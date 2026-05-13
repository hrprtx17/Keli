import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import DataSource from '@/models/DataSource';
import User from '@/models/User';
import KnowledgeChunk from '@/models/KnowledgeChunk';
import { chunkText, getEmbedding } from '@/lib/rag';
import { crawlWebsite } from '@/lib/crawler';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Explicit long timeout for slow website spiders

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendStatus = (stage: string, data: object = {}) => {
        controller.enqueue(encoder.encode(JSON.stringify({ stage, ...data }) + '\n'));
      };

      try {
        const { agentId, url } = await req.json();

        if (!agentId || !url) throw new Error('Agent ID and valid target URL required.');

        await connectDB();

        // Ownership check
        const user = await User.findOne({ email: session.user?.email });
        if (!user) throw new Error('Principal record lookup failed.');

        sendStatus('Initializing'); // Step 1

        // Execute heavy spider sequence
        // Cap to 10 internal pages for speed/safety in current runtime
        const pages = await crawlWebsite(url, 10, (status, current, max) => {
           sendStatus('Crawling', { current, total: max });
        });

        if (pages.length === 0) {
          throw new Error('Spider yielded zero crawlable pages. Site might block headless requests.');
        }

        sendStatus('Extracting'); // Aggregating page outputs

        let totalChunksPayload: { text: string, metadata: any }[] = [];

        // Process pages sequentially to minimize memory spike
        for (const page of pages) {
          sendStatus('Chunking');
          const chunks = await chunkText(page.content, 1000, 200);
          const meta = {
            sourceUrl: page.url,
            pageTitle: page.title,
            crawledAt: new Date().toISOString()
          };
          
          totalChunksPayload = totalChunksPayload.concat(
             chunks.map(c => ({ text: `[Source: ${page.title}] ${c}`, metadata: meta }))
          );
        }

        if (totalChunksPayload.length === 0) {
          throw new Error('Post-crawl segmentation resulted in zero usable sections.');
        }

        sendStatus('Embedding', { total: totalChunksPayload.length });

        // Aggregated Source Creation representing the composite Crawl Job
        const domain = new URL(url).hostname;
        const source = await DataSource.create({
          agentId,
          workspaceId: (session.user as any).workspaceId,
          type: 'url',
          name: `Site Crawl: ${domain}`,
          content: `Crawl collection of ${pages.length} pages. Origin: ${url}`,
          status: 'processing',
          metadata: {
            url,
            pages: pages.length
          }
        });

        // Process embeddings in concurrent batches of 5 to maximize CPU and network performance
        const batchSize = 5;
        const chunksToInsert: any[] = [];
        
        for (let i = 0; i < totalChunksPayload.length; i += batchSize) {
          const currentBatch = totalChunksPayload.slice(i, i + batchSize);
          
          // Run slice concurrent vector generations
          const batchResults = await Promise.all(
            currentBatch.map(async (chunkPkg) => {
              const vec = await getEmbedding(chunkPkg.text);
              return {
                agentId,
                workspaceId: (session.user as any).workspaceId,
                dataSourceId: source._id,
                text: chunkPkg.text,
                embedding: vec,
                metadata: chunkPkg.metadata
              };
            })
          );
          
          chunksToInsert.push(...batchResults);
          
          // Send progress status ticks
          sendStatus('Embedding', { current: chunksToInsert.length, total: totalChunksPayload.length });
        }

        // Perform a single high-speed bulk database write instead of multiple consecutive roundtrips
        if (chunksToInsert.length > 0) {
          await KnowledgeChunk.insertMany(chunksToInsert);
        }

        // Finalize parent state
        await DataSource.findByIdAndUpdate(source._id, { status: 'ready' });

        sendStatus('Completed');
        controller.close();

      } catch (err: any) {
        console.error('[Crawler Route Crash]:', err);
        sendStatus('Failed', { error: err.message || 'Unknown runtime disruption' });
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
