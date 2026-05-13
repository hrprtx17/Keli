import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import DataSource from '@/models/DataSource';
import User from '@/models/User';
import KnowledgeChunk from '@/models/KnowledgeChunk';
import { chunkText, getEmbedding } from '@/lib/rag';


async function resolveWorkspaceId(session: any): Promise<string | null> {
  if ((session.user as any).workspaceId) return (session.user as any).workspaceId;
  const dbUser = await User.findOne({ email: session.user?.email });
  return dbUser?.workspaceId?.toString() || null;
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const url = new URL(req.url);
  const agentId = url.searchParams.get('agentId');
  await connectDB();
  const workspaceId = await resolveWorkspaceId(session);
  if (!workspaceId) return NextResponse.json([]);
  const filter: any = { workspaceId };
  if (agentId) filter.agentId = agentId;
  const docs = await DataSource.find(filter).sort({ createdAt: -1 });
  return NextResponse.json(docs);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const encoder = new TextEncoder();

  // Construct response execution stream for real-time stage relay
  const readableStream = new ReadableStream({
    async start(controller) {
      const sendStatus = (stage: string, data: any = {}) => {
        controller.enqueue(encoder.encode(JSON.stringify({ stage, ...data }) + "\n"));
      };

      try {
        await connectDB();
        const workspaceId = await resolveWorkspaceId(session);
        if (!workspaceId) throw new Error('Forbidden access');

        sendStatus('Uploading'); // Step 1 active
        
        // Read incoming binary stream
        const formData = await req.formData();
        const agentId = formData.get('agentId') as string;
        const file = formData.get('file') as File | null;

        if (!agentId || !file) throw new Error('Agent ID and File expected.');

        sendStatus('Extracting'); // Step 2 active

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const nameLower = file.name.toLowerCase();
        let rawText = '';

        if (file.type === 'application/pdf' || nameLower.endsWith('.pdf')) {
          const pdf = require('pdf-parse');
          const result = await pdf(buffer);
          rawText = result.text;
        } else if (nameLower.endsWith('.docx')) {
          const mammoth = await import('mammoth');
          const result = await mammoth.extractRawText({ buffer });
          rawText = result.value;
        } else if (
          nameLower.endsWith('.txt') || 
          nameLower.endsWith('.csv') || 
          nameLower.endsWith('.md') || 
          nameLower.endsWith('.markdown')
        ) {
          rawText = new TextDecoder().decode(arrayBuffer);
        } else {
          rawText = new TextDecoder('utf-8').decode(arrayBuffer);
        }

        if (!rawText || rawText.trim().length === 0) {
          throw new Error('Extraction failure: Contains no usable text.');
        }

        sendStatus('Chunking'); // Step 3 active
        
        // Await asynchronous LangChain integration splitter
        const chunks = await chunkText(rawText, 1000, 200);

        if (chunks.length === 0) {
            throw new Error('Document fragmented into zero usable sections.');
        }

        sendStatus('Embedding', { total: chunks.length }); // Step 4 active

        const source = await DataSource.create({
          agentId,
          workspaceId,
          type: nameLower.endsWith('.pdf') ? 'pdf' : 
                nameLower.endsWith('.docx') ? 'docx' : 
                nameLower.endsWith('.csv') ? 'csv' : 
                nameLower.endsWith('.md') ? 'md' : 'txt',
          name: file.name,
          content: rawText.slice(0, 5000), // optimized store limit
          status: 'processing',
          metadata: { size: file.size, type: file.type }
        });

        const vectorDocs: any[] = [];
        
        // Process file chunks in parallelized batches to maximize CPU throughput
        const batchSize = 5;
        
        for (let i = 0; i < chunks.length; i += batchSize) {
          const currentBatch = chunks.slice(i, i + batchSize);
          
          // Compute concurrent embeddings for current slice
          const batchResults = await Promise.all(
            currentBatch.map(async (textChunk) => {
              const vector = await getEmbedding(textChunk);
              return {
                agentId,
                workspaceId,
                dataSourceId: source._id,
                text: textChunk,
                embedding: vector
              };
            })
          );
          
          vectorDocs.push(...batchResults);
          
          // Send realtime feedback tracking status
          sendStatus('Embedding', { current: vectorDocs.length, total: chunks.length });
        }

        sendStatus('Training'); // Step 5 active
        await KnowledgeChunk.insertMany(vectorDocs);
        
        source.status = 'ready';
        await source.save();

        sendStatus('Completed', { id: source._id }); // Step 6 success finality
        controller.close();

      } catch (err: any) {
        sendStatus('Failed', { error: err.message });
        controller.close();
      }
    }
  });

  return new Response(readableStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

  try {
    await connectDB();
    const workspaceId = await resolveWorkspaceId(session);
    if (!workspaceId) throw new Error('Unauthorized');

    // Delete the root source only if owner
    const result = await DataSource.findOneAndDelete({ _id: id, workspaceId });
    if (!result) return NextResponse.json({ error: 'Resource not located' }, { status: 404 });

    // Cascade cleanup vector space
    await KnowledgeChunk.deleteMany({ dataSourceId: id });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
