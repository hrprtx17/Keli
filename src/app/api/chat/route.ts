import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Agent from '@/models/Agent';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';
import { auth } from '@/auth';
import { searchKnowledge } from '@/lib/rag';
import { rateLimit } from '@/lib/rate-limit';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  
  // Rate Limit: 60 requests per minute for authenticated dashboard users
  const rateLimitResult = await rateLimit(`chat:${ip}`, 60, 60 * 1000, ip, '/api/chat');
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests' }, 
      { 
        status: 429, 
        headers: {
          'Retry-After': Math.ceil((rateLimitResult.reset.getTime() - Date.now()) / 1000).toString(),
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        }
      }
    );
  }

  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { message, agentId, conversationId } = await req.json();
    if (!message || !agentId) return NextResponse.json({ error: 'Message and Agent ID required' }, { status: 400 });

    await connectDB();
    const agent = await Agent.findOne({ _id: agentId, workspaceId: (session.user as any).workspaceId });
    if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });

    const workspace = await (await import('@/models/Workspace')).default.findById(agent.workspaceId);
    if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });

    const monthlyCredits = workspace.usage?.monthlyCredits || 0;
    const addonCredits = workspace.usage?.addonCredits || 0;
    const usedThisMonth = workspace.usage?.creditsUsedThisMonth || 0;
    
    if (usedThisMonth >= monthlyCredits && addonCredits <= 0) {
      // Log exhaustion
      import('@/models/SecurityLog').then(mod => {
        mod.default.create({
          eventType: 'credit_exhausted',
          ipAddress: ip,
          endpoint: '/api/chat',
          workspaceId: workspace._id
        }).catch(console.error);
      });
      return NextResponse.json({ reply: '⚠️ Workspace is out of AI credits. Please upgrade or top-up credits in the Billing tab.', conversationId });
    }

    // Handle Conversation
    let convId = conversationId;
    let conv;
    if (!convId) {
      conv = await Conversation.create({
        agentId: agent._id,
        workspaceId: agent.workspaceId,
        sessionId: 'dashboard-' + Date.now(),
        source: 'dashboard',
        messageCount: 1
      });
      convId = conv._id;
    } else {
      conv = await Conversation.findByIdAndUpdate(convId, { $inc: { messageCount: 1 } });
    }

    // Save user message
    await Message.create({
      conversationId: convId,
      agentId: agent._id,
      role: 'user',
      content: message
    });

    // RAG Pipeline
    let relevantChunks: string[] = [];
    try {
      if (process.env.HUGGINGFACE_API_KEY) {
        relevantChunks = await searchKnowledge(message, agent._id.toString());
      }
    } catch (e) {
      console.error('RAG Error (continuing without context):', e);
    }
    
    const contextStr = relevantChunks.length > 0 
      ? `\n\nRelevant Knowledge Base Information:\n${relevantChunks.join('\n---\n')}` 
      : '';

    const systemPrompt = (agent.systemPrompt || 'You are a helpful assistant.') + contextStr;

    // Get previous messages for context (last 5)
    const prevMessages = await Message.find({ conversationId: convId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
    
    const formattedMessages = prevMessages.reverse().map(m => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content
    }));

    // Groq Call
    let aiReply = 'I apologize, I am unable to respond at the moment.';
    try {
      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          ...formattedMessages,
        ],
        model: agent.model || 'llama-3.1-8b-instant',
        temperature: agent.config?.temperature || 0.7,
        max_tokens: agent.config?.maxTokens || 500,
      });
      aiReply = completion.choices[0]?.message?.content || aiReply;
    } catch (e) {
      console.error('Groq Error:', e);
    }

    // Save AI message
    await Message.create({
      conversationId: convId,
      agentId: agent._id,
      role: 'assistant',
      content: aiReply
    });

    if (conv) {
      await Conversation.findByIdAndUpdate(convId, { $inc: { messageCount: 1 } });
    }

    // Atomic Deduct credit (Wrapped in fail-safe so it never blocks user response)
    try {
      await (await import('@/models/Workspace')).default.findOneAndUpdate(
        { _id: workspace._id },
        [
          {
            $set: {
              "usage.creditsUsedThisMonth": {
                $cond: {
                  if: { $lt: ["$usage.creditsUsedThisMonth", "$usage.monthlyCredits"] },
                  then: { $add: [{ $ifNull: ["$usage.creditsUsedThisMonth", 0] }, 1] },
                  else: { $ifNull: ["$usage.creditsUsedThisMonth", 0] }
                }
              }
            }
          }
        ]
      );
    } catch (cErr) {
      console.error('Non-blocking Credit Decoupler Log:', cErr);
    }

    return NextResponse.json({ reply: aiReply, conversationId: convId });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
