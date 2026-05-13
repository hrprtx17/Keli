const mongoose = require('mongoose');

const AgentSchema = new mongoose.Schema({}, { strict: false });

async function check() {
  const MONGODB_URI = 'mongodb+srv://x1hrprt:hrprt2311@cluster0.o5pv3ah.mongodb.net/agentdesk?retryWrites=true&w=majority';
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to DB');
  
  const Agent = mongoose.models.Agent || mongoose.model('Agent', AgentSchema, 'agents');
  const agents = await Agent.find({});
  
  console.log(`Found ${agents.length} agents:`);
  agents.forEach(a => {
     console.log(`- Agent ID: ${a._id}, Name: ${a.get('name')}, Model: ${a.get('model')}`);
  });
  
  mongoose.connection.close();
}

check();
