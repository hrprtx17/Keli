const mongoose = require('mongoose');
const Groq = require('groq-sdk');

async function run() {
  const MONGODB_URI = 'mongodb+srv://x1hrprt:hrprt2311@cluster0.o5pv3ah.mongodb.net/agentdesk?retryWrites=true&w=majority';
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to DB');
  
  const agentId = '6a04a1e26f74339dbfb5a5c4'; // An active agent from previous output
  const Agent = mongoose.model('Agent', new mongoose.Schema({}, { strict: false }));
  const Message = mongoose.model('Message', new mongoose.Schema({}, { strict: false }));
  const Conversation = mongoose.model('Conversation', new mongoose.Schema({}, { strict: false }));

  const agent = await Agent.findById(agentId);
  console.log('Loaded Agent:', agent.get('name'));

  const promptText = 'hello test message';
  const convId = new mongoose.Types.ObjectId(); // simulate new

  console.log('Creating user message...');
  await Message.create({
    conversationId: convId,
    agentId: agent._id,
    role: 'user',
    content: promptText || ''
  });

  const systemPrompt = agent.get('systemPrompt') || 'You are a helpful AI assistant.';

  // Build messages exactly like route.ts
  const prevMessages = await Message.find({ conversationId: convId })
    .sort({ createdAt: -1 })
    .limit(8)
    .lean();
  
  const formattedMessages = prevMessages.reverse().map(m => ({
    role: m.role,
    content: m.content
  }));

  console.log('Formatted Messages payload:', JSON.stringify(formattedMessages, null, 2));

  try {
    const GROQ_API_KEY = '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';
    const groq = new Groq({ apiKey: GROQ_API_KEY });
    
    console.log('Calling Groq completions...');
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        ...formattedMessages
      ],
      model: agent.get('model') || 'llama-3.1-8b-instant',
      temperature: agent.get('config')?.temperature || 0.7,
      max_tokens: agent.get('config')?.maxTokens || 600,
    });

    console.log('SUCCESS! AI Reply:', completion.choices[0]?.message?.content);
  } catch (err) {
    console.error('FATAL EXCEPTION CAUGHT:', err);
  }

  // Clean up
  await Message.deleteMany({ conversationId: convId });
  await mongoose.connection.close();
}

run();
