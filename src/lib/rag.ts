import { pipeline, env } from '@xenova/transformers';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import KnowledgeChunk from '@/models/KnowledgeChunk';
import mongoose from 'mongoose';
import path from 'path';

// Configure Transformers.js for optimized serverless usage with bundled local models
env.allowRemoteModels = false;
env.localModelPath = path.join(process.cwd(), 'models');

let extractor: any = null;

// Singleton strategy for local model initialization
async function getExtractor() {
  if (!extractor) {
    // Load local bundled model immediately and reliably
    extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return extractor;
}

export async function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): Promise<string[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap: overlap,
  });
  
  // Clean whitespace normalizer before passing to splitter
  const normalizedText = text.replace(/\s+/g, ' ').trim();
  
  // Returns raw strings
  return await splitter.splitText(normalizedText);
}

export async function getEmbedding(text: string): Promise<number[]> {
  const generateEmbedding = await getExtractor();
  const output = await generateEmbedding(text, { pooling: 'mean', normalize: true });
  // Convert Float32Array output tensor structure into Standard Number Array for MongoDB compatibility
  return Array.from(output.data);
}

export async function searchKnowledge(
  query: string,
  agentId: string,
  workspaceId: string,
  topK = 5
): Promise<string[]> {
  const startTime = Date.now();
  try {
    const queryEmbedding = await getEmbedding(query);
    const embeddingTime = Date.now();
    
    // Construct accurate Vector Search MongoDB Aggregation Pipeline
    const results = await KnowledgeChunk.aggregate([
      {
        $vectorSearch: {
          index: "vector_index", 
          path: "embedding",
          queryVector: queryEmbedding,
          numCandidates: 100,
          limit: topK,
          filter: {
             agentId: new mongoose.Types.ObjectId(agentId),
             workspaceId: new mongoose.Types.ObjectId(workspaceId)
          }
        }
      },
      {
        $project: {
          text: 1,
          score: { $meta: "vectorSearchScore" }
        }
      }
    ]);

    const searchTime = Date.now();
    const totalElapsed = searchTime - startTime;

    console.log(`\n[RAG DEBUG] Retrieval Stats -----------------`);
    console.log(`- Embed Time: ${embeddingTime - startTime}ms`);
    console.log(`- Search Time: ${searchTime - embeddingTime}ms`);
    console.log(`- Total Time: ${totalElapsed}ms`);
    console.log(`- Chunks Found: ${results.length}`);
    
    results.forEach((doc, i) => {
       console.log(`  [Chunk ${i+1}] Score: ${doc.score.toFixed(4)} | Text Snapshot: "${doc.text.substring(0, 60).replace(/\n/g, ' ')}..."`);
    });
    console.log(`---------------------------------------------\n`);

    return results.map(doc => doc.text);
  } catch (err) {
    console.error("CRITICAL VECTOR RETRIEVAL FAILURE:", err);
    // Graceful degradation - empty context injection avoids crashing overall user response pipeline
    return [];
  }
}
