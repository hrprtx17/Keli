const Groq = require('groq-sdk');

async function test() {
  const apiKey = "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";
  const groq = new Groq({ apiKey });
  
  const modelsToTest = ['llama-3.1-8b-instant', 'llama3-8b-8192', 'mixtral-8x7b-32768'];
  
  for (const m of modelsToTest) {
    try {
      console.log(`\nTesting model: ${m}...`);
      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: 'hi' }],
        model: m,
        max_tokens: 50
      });
      console.log(`Success for ${m}! Reply:`, completion.choices[0].message.content);
    } catch (e) {
      console.error(`FAILED for ${m}:`, e.message);
    }
  }
}

test();
