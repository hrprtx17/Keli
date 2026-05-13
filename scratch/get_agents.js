const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI not found in .env.local');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  
  const agentSchema = new mongoose.Schema({}, { strict: false });
  const Agent = mongoose.models.Agent || mongoose.model('Agent', agentSchema, 'agents');
  
  const agents = await Agent.find({}).limit(3);
  console.log('--- EXISTING AGENTS ---');
  agents.forEach(a => {
    console.log(`ID: ${a._id} | Name: ${a.name}`);
  });
  
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
