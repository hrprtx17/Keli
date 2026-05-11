// Simple text chunking
export function chunkText(text: string): string[] {
  const chunks: string[] = []
  const sentences = text.split(/[.!?]+/)
  let chunk = ''
  for (const sentence of sentences) {
    if ((chunk + sentence).length > 500) {
      if (chunk) chunks.push(chunk.trim())
      chunk = sentence
    } else {
      chunk += sentence + '. '
    }
  }
  if (chunk) chunks.push(chunk.trim())
  return chunks.filter(c => c.length > 50)
}

// Use Hugging Face free API for embeddings
export async function getEmbedding(
  text: string
): Promise<number[]> {
  const res = await fetch(
    'https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2',
    {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ inputs: text })
    }
  )
  return res.json()
}

// Cosine similarity search
export function cosineSimilarity(a: number[], b: number[]) {
  const dot = a.reduce((sum, v, i) => sum + v * b[i], 0)
  const magA = Math.sqrt(a.reduce((s, v) => s + v*v, 0))
  const magB = Math.sqrt(b.reduce((s, v) => s + v*v, 0))
  return dot / (magA * magB)
}

// Find relevant chunks
export async function searchKnowledge(
  query: string,
  agentId: string,
  topK = 3
): Promise<string[]> {
  const DataSource = (await import('@/models/DataSource')).default
  const queryEmbedding = await getEmbedding(query)
  
  const sources = await DataSource.find({ 
    agentId, 
    status: 'ready' 
  })
  
  const allChunks: { text: string; score: number }[] = []
  
  for (const source of sources) {
    const chunks = chunkText(source.content)
    for (const chunk of chunks) {
      const emb = await getEmbedding(chunk)
      if (Array.isArray(emb)) {
        const score = cosineSimilarity(queryEmbedding, emb)
        allChunks.push({ text: chunk, score })
      }
    }
  }
  
  return allChunks
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(c => c.text)
}
