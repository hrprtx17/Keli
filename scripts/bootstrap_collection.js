const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Simple .env parsing helper since dotenv might be missing
function getUri() {
  try {
    const envPath = path.join(__dirname, '../.env.local');
    const envRaw = fs.readFileSync(envPath, 'utf8');
    const match = envRaw.match(/^MONGODB_URI=(.+)$/m);
    return match ? match[1].trim() : null;
  } catch (e) {
    return null;
  }
}

async function bootstrap() {
  const uri = getUri();
  if (!uri) {
    console.error("FATAL: Could not locate MONGODB_URI in .env.local");
    process.exit(1);
  }

  console.log("Connecting to MongoDB via Mongoose...");
  await mongoose.connect(uri);
  
  try {
    // Create actual database entry to force collection initialization
    const collection = mongoose.connection.collection('knowledgechunks');
    
    console.log("Initiating database insertion sequence...");
    await collection.insertOne({
      text: "System Bootstrap Core",
      embedding: Array(384).fill(0.01),
      agentId: new mongoose.Types.ObjectId(),
      workspaceId: new mongoose.Types.ObjectId(),
      dataSourceId: new mongoose.Types.ObjectId(),
      createdAt: new Date()
    });

    console.log("\n✅ VERIFIED SUCCESSFUL INJECTION.");
    console.log("The collection 'knowledgechunks' has now been forcefully created.");
    console.log("Refresh your MongoDB Atlas page -> Select Search Index -> The collection will now be selectable.");

  } catch (err) {
    console.error("Error seeding collection:", err);
  } finally {
    await mongoose.disconnect();
  }
}

bootstrap();
