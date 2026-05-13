import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Agent from '@/models/Agent';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';
import User from '@/models/User';
import Workspace from '@/models/Workspace';
import { auth } from '@/auth';
import { searchKnowledge } from '@/lib/rag';
import { rateLimit } from '@/lib/rate-limit';
import Groq from 'groq-sdk';

export const maxDuration = 30;

// Fully secure workspace identifier resolver that guarantees multi-auth compatibility
async function resolveWorkspaceId(session: any): Promise<string | null> {
  if ((session.user as any).workspaceId) return (session.user as any).workspaceId;
  const dbUser = await User.findOne({ email: session.user?.email });
  return dbUser?.workspaceId?.toString() || null;
}

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  
  const rateLimitResult = await rateLimit(`chat:${ip}`, 60, 60 * 1000, ip, '/api/chat');
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { messages: uiMessages, agentId, conversationId: reqConvId } = await req.json();
    
    if (!uiMessages || !Array.isArray(uiMessages) || uiMessages.length === 0 || !agentId) {
       return NextResponse.json({ error: 'Valid messages array and Agent ID required' }, { status: 400 });
    }

    // Secure retrieval of latest user prompt
    const latestMsg = uiMessages[uiMessages.length - 1];
    let promptText = '';
    if (Array.isArray(latestMsg.parts)) {
      promptText = latestMsg.parts.map((p: any) => p.type === 'text' ? p.text : '').filter(Boolean).join(' ');
    }
    if (!promptText && latestMsg.content) promptText = latestMsg.content;
    if (!promptText && latestMsg.text) promptText = latestMsg.text;
    
    await connectDB();

    const workspaceId = await resolveWorkspaceId(session);
    if (!workspaceId) return NextResponse.json({ error: 'Workspace context failure' }, { status: 403 });

    const agent = await Agent.findOne({ _id: agentId, workspaceId });
    if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) return NextResponse.json({ error: 'Workspace invalid' }, { status: 404 });

    const monthlyCredits = workspace.usage?.monthlyCredits || 0;
    const usedThisMonth = workspace.usage?.creditsUsedThisMonth || 0;
    const addonCredits = workspace.usage?.addonCredits || 0;
    
    if (usedThisMonth >= monthlyCredits && addonCredits <= 0) {
      return NextResponse.json({ error: 'AI credits exhausted. Please upgrade.' }, { status: 403 });
    }

    let convId = reqConvId;
    if (!convId) {
      const conv = await Conversation.create({
        agentId: agent._id,
        workspaceId: workspace._id,
        sessionId: 'dashboard-' + Date.now(),
        source: 'dashboard',
        messageCount: 1
      });
      convId = conv._id;
    } else {
      await Conversation.findByIdAndUpdate(convId, { $inc: { messageCount: 1 } });
    }

    await Message.create({
      conversationId: convId,
      agentId: agent._id,
      role: 'user',
      content: promptText || ''
    });

    let relevantChunks: string[] = [];
    try {
      if (promptText) {
        relevantChunks = await searchKnowledge(promptText, agent._id.toString(), workspaceId);
      }
    } catch (e) {
      console.error('[Dashboard RAG Recovery]', e);
    }
    
    const contextStr = relevantChunks.length > 0 
      ? `\n\nRelevant Knowledge Context:\n${relevantChunks.join('\n---\n')}` 
      : '';

    const systemPrompt = (agent.systemPrompt || 'You are a helpful AI assistant.') + contextStr;

    // Build standard message history
    const prevMessages = await Message.find({ conversationId: convId })
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();
    
    const formattedMessages = prevMessages.reverse().map(m => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content
    }));

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'Environment Error: GROQ_API_KEY not set in deployment settings.' }, { status: 500 });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        ...formattedMessages
      ],
      model: agent.model || 'llama-3.1-8b-instant',
      temperature: agent.config?.temperature || 0.7,
      max_tokens: agent.config?.maxTokens || 600,
    });

    const aiReply = completion.choices[0]?.message?.content || 'No response from engine.';

    await Message.create({
      conversationId: convId,
      agentId: agent._id,
      role: 'assistant',
      content: aiReply
    });

    await Conversation.findByIdAndUpdate(convId, { $inc: { messageCount: 1 } });

    // Clean, highly-compatible robust atomic credit update
    if (usedThisMonth < monthlyCredits) {
      await Workspace.updateOne(
        { _id: workspace._id },
        { $inc: { "usage.creditsUsedThisMonth": 1 } }
      );
    } else if (addonCredits > 0) {
      await Workspace.updateOne(
        { _id: workspace._id },
        { $inc: { "usage.addonCredits": -1 } }
      );
    }

    return NextResponse.json({ reply: aiReply, conversationId: convId });

  } catch (error: any) {
    console.error('Deployment AI Engine Exception:', error);
    return NextResponse.json(
      { 
        error: `Engine Exception: ${error.message || 'Fatal termination'}`, 
        details: error.message || 'Fatal handler termination'
      }, 
      { status: 500 }
    );
  }
}
