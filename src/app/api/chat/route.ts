import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Agent from '@/models/Agent';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';
import { auth } from '@/auth';
import { searchKnowledge } from '@/lib/rag';
import { rateLimit } from '@/lib/rate-limit';
import { groq } from '@ai-sdk/groq';
import { streamText, createUIMessageStreamResponse, convertToModelMessages } from 'ai';

export const maxDuration = 30;

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

    const promptText = uiMessages[uiMessages.length - 1].parts?.[0]?.text || uiMessages[uiMessages.length - 1].text || '';

    await connectDB();
    const agent = await Agent.findOne({ _id: agentId, workspaceId: (session.user as any).workspaceId });
    if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });

    const workspace = await (await import('@/models/Workspace')).default.findById(agent.workspaceId);
    if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });

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
        workspaceId: agent.workspaceId,
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
      content: promptText
    });

    let relevantChunks: string[] = [];
    try {
      relevantChunks = await searchKnowledge(promptText, agent._id.toString(), agent.workspaceId.toString());
    } catch (e) {
      console.error('[RAG Fail]', e);
    }
    
    const contextStr = relevantChunks.length > 0 
      ? `\n\nRelevant Context:\n${relevantChunks.join('\n---\n')}` 
      : '';

    const systemPrompt = (agent.systemPrompt || 'You are a helpful assistant.') + contextStr;
    const modelMessages = await convertToModelMessages(uiMessages);

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
         } catch (saveErr) {
           console.error('[Finalize Fail]', saveErr);
         }
      }
    });

    // Attach conversation info dynamically to the message metadata boundary
    return createUIMessageStreamResponse({
       stream: result.toUIMessageStream({
          messageMetadata: () => ({ conversationId: convId.toString() })
       })
    });

  } catch (error: any) {
    console.error('Stream Fault:', error);
    return NextResponse.json({ error: 'Engine internal fault' }, { status: 500 });
  }
}
