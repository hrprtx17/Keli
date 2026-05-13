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
import { createGroq } from '@ai-sdk/groq';
import { streamText, createUIMessageStreamResponse } from 'ai';

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

    // Bulletproof extraction of promptText to ensure context indexing never receives empty inputs
    const latestMsg = uiMessages[uiMessages.length - 1];
    let promptText = '';
    if (Array.isArray(latestMsg.parts)) {
      promptText = latestMsg.parts.map((p: any) => p.type === 'text' ? p.text : '').filter(Boolean).join(' ');
    }
    if (!promptText && latestMsg.content) promptText = latestMsg.content;
    if (!promptText && latestMsg.text) promptText = latestMsg.text;
    
    await connectDB();

    // Ensure user identity linkage is retrieved safely
    const workspaceId = await resolveWorkspaceId(session);
    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace resolution lock failed.' }, { status: 403 });
    }

    const agent = await Agent.findOne({ _id: agentId, workspaceId });
    if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) return NextResponse.json({ error: 'Workspace context invalid' }, { status: 404 });

    const monthlyCredits = workspace.usage?.monthlyCredits || 0;
    const usedThisMonth = workspace.usage?.creditsUsedThisMonth || 0;
    const addonCredits = workspace.usage?.addonCredits || 0;
    
    if (usedThisMonth >= monthlyCredits && addonCredits <= 0) {
      return NextResponse.json({ error: '⚠️ AI credits exhausted.' }, { status: 403 });
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
      console.error('[RAG Failure Recovery]', e);
    }
    
    const contextStr = relevantChunks.length > 0 
      ? `\n\nRelevant Context:\n${relevantChunks.join('\n---\n')}` 
      : '';

    const systemPrompt = (agent.systemPrompt || 'You are a helpful assistant.') + contextStr;

    // Stabilized UI to core mapping to circumvent complex object transformation issues
    const modelMessages = uiMessages.map((msg: any) => {
      let c = '';
      if (Array.isArray(msg.parts)) {
        c = msg.parts.map((p: any) => p.type === 'text' ? p.text : '').filter(Boolean).join('\n');
      }
      if (!c && msg.content) c = msg.content;
      if (!c && msg.text) c = msg.text;
      return {
        role: (msg.role === 'user' || msg.role === 'assistant' || msg.role === 'system') ? msg.role : 'user',
        content: c || ''
      };
    });

    // Explicit provider allocation with runtime environment propagation
    const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

    const result = streamText({
      model: groq(agent.model || 'llama-3.1-8b-instant'),
      system: systemPrompt,
      messages: modelMessages,
      temperature: agent.config?.temperature || 0.7,
      maxOutputTokens: agent.config?.maxTokens || 800,
      onFinish: async ({ text }) => {
         try {
           await Message.create({
             conversationId: convId,
             agentId: agent._id,
             role: 'assistant',
             content: text
           });
           
           await Conversation.findByIdAndUpdate(convId, { $inc: { messageCount: 1 } });

           await Workspace.findOneAndUpdate(
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
         } catch (saveErr) {
           console.error('[Finalize Error Ignored]', saveErr);
         }
      }
    });

    // Ensure atomic return of UI response stream
    return createUIMessageStreamResponse({
       stream: result.toUIMessageStream({
          messageMetadata: () => ({ conversationId: convId.toString() })
       })
    });

  } catch (error: any) {
    console.error('Production AI Pipeline Fault:', error);
    return NextResponse.json(
      { 
        error: 'Internal Pipeline Disruption', 
        details: error.message,
        stage: 'Execution'
      }, 
      { status: 500 }
    );
  }
}
