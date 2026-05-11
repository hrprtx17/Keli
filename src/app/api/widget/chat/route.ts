import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Agent from '@/models/Agent';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';
import { searchKnowledge } from '@/lib/rag';
import { rateLimit } from '@/lib/rate-limit';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// CORS Headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  
  // Rate Limit: 10 requests per minute for public widget users
  const rateLimitResult = await rateLimit(`widget:${ip}`, 10, 60 * 1000, ip, '/api/widget/chat');
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests' }, 
      { 
        status: 429, 
        headers: {
          ...corsHeaders,
          'Retry-After': Math.ceil((rateLimitResult.reset.getTime() - Date.now()) / 1000).toString()
        }
      }
    );
  }

  try {
    const { message, agentId, conversationId } = await req.json();
    if (!message || !agentId) {
      return NextResponse.json({ error: 'Message and Agent ID required' }, { status: 400, headers: corsHeaders });
    }

    await connectDB();
    const agent = await Agent.findById(agentId);
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404, headers: corsHeaders });
    }

    const workspace = await (await import('@/models/Workspace')).default.findById(agent.workspaceId);
    if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404, headers: corsHeaders });

    // Domain Verification
    const referer = req.headers.get('referer') || req.headers.get('origin');
    if (referer && workspace.allowedDomains && workspace.allowedDomains.length > 0) {
      const isLocalhost = referer.includes('localhost') || referer.includes('127.0.0.1');
      const isAllowed = isLocalhost || workspace.allowedDomains.some((domain: string) => referer.includes(domain));
      if (!isAllowed) {
        import('@/models/SecurityLog').then(mod => {
          mod.default.create({ eventType: 'unauthorized_domain', ipAddress: ip, endpoint: '/api/widget/chat', details: referer, workspaceId: workspace._id }).catch(console.error);
        });
        return NextResponse.json({ error: 'Unauthorized domain' }, { status: 403, headers: corsHeaders });
      }
    }

    const monthlyCredits = workspace.usage?.monthlyCredits || 0;
    const addonCredits = workspace.usage?.addonCredits || 0;
    const usedThisMonth = workspace.usage?.creditsUsedThisMonth || 0;
    
    if (usedThisMonth >= monthlyCredits && addonCredits <= 0) {
      return NextResponse.json({ reply: 'I am currently unavailable due to maintenance.' }, { headers: corsHeaders });
    }

    let convId = conversationId;
    let conv;
    if (!convId) {
      conv = await Conversation.create({
        agentId: agent._id,
        workspaceId: agent.workspaceId,
        sessionId: 'widget-' + Date.now(),
        source: 'widget',
        messageCount: 1
      });
      convId = conv._id;
    } else {
      conv = await Conversation.findByIdAndUpdate(convId, { $inc: { messageCount: 1 } });
    }

    await Message.create({
      conversationId: convId,
      agentId: agent._id,
      role: 'user',
      content: message
    });

    let relevantChunks: string[] = [];
    try {
      if (process.env.HUGGINGFACE_API_KEY) {
        relevantChunks = await searchKnowledge(message, agent._id.toString());
      }
    } catch (e) {
      console.error('RAG Error:', e);
    }
    
    const contextStr = relevantChunks.length > 0 
      ? `\n\nRelevant Knowledge Base Information:\n${relevantChunks.join('\n---\n')}` 
      : '';

    const systemPrompt = (agent.systemPrompt || 'You are a helpful customer support assistant. Keep answers concise.') + contextStr;

    const prevMessages = await Message.find({ conversationId: convId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
    
    const formattedMessages = prevMessages.reverse().map(m => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content
    }));

    let aiReply = 'I apologize, I am unable to respond at the moment.';
    try {
      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          ...formattedMessages,
        ],
        model: agent.model || 'llama-3.1-8b-instant',
        temperature: agent.config?.temperature || 0.7,
        max_tokens: agent.config?.maxTokens || 300,
      });
      aiReply = completion.choices[0]?.message?.content || aiReply;
    } catch (e) {
      console.error('Groq Error:', e);
    }

    await Message.create({
      conversationId: convId,
      agentId: agent._id,
      role: 'assistant',
      content: aiReply
    });

    if (conv) {
      await Conversation.findByIdAndUpdate(convId, { $inc: { messageCount: 1 } });
    }

    // Atomic Deduct credit
    await (await import('@/models/Workspace')).default.findOneAndUpdate(
      { _id: workspace._id },
      [
        {
          $set: {
            "usage.creditsUsedThisMonth": {
              $cond: {
                if: { $lt: ["$usage.creditsUsedThisMonth", "$usage.monthlyCredits"] },
                then: { $add: ["$usage.creditsUsedThisMonth", 1] },
                else: "$usage.creditsUsedThisMonth"
              }
            },
            "usage.addonCredits": {
              $cond: {
                if: { $gte: ["$usage.creditsUsedThisMonth", "$usage.monthlyCredits"] },
                then: { $subtract: ["$usage.addonCredits", 1] },
                else: "$usage.addonCredits"
              }
            }
          }
        }
      ]
    );

    return NextResponse.json({ reply: aiReply, conversationId: convId }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Widget Chat Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders });
  }
}
