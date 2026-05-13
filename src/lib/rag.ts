import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import KnowledgeChunk from '@/models/KnowledgeChunk';
import mongoose from 'mongoose';

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
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) {
     console.warn('[HuggingFace API Config Missing] Vector generation skipped.');
     return new Array(384).fill(0); // Guarantee dimensionality match
  }

  try {
    const response = await fetch(
      'https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2',
      {
        headers: { 
          Authorization: `Bearer ${apiKey}`, 
          'Content-Type': 'application/json' 
        },
        method: 'POST',
        body: JSON.stringify({ inputs: text }),
      }
    );

    if (!response.ok) {
       const errTxt = await response.text();
       console.error(`HuggingFace HTTP Failure: ${errTxt}`);
       return new Array(384).fill(0);
    }

    const result = await response.json();
    if (Array.isArray(result)) {
       // Standard feature-extraction can wrap results in nested dimensions [ [0.1, 0.2] ]
       if (Array.isArray(result[0])) {
          return result[0];
       }
       return result;
    }
    console.error('Unexpected embedding structure received:', result);
    return new Array(384).fill(0);
  } catch (e) {
    console.error('HuggingFace generation catch block:', e);
    return new Array(384).fill(0);
  }
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
