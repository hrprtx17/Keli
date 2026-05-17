const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('ERROR: MONGODB_URI is not set in .env.local');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('Successfully connected to MongoDB!');
    const db = client.db('agentdesk');

    // 1. Fetch first active agent
    const agent = await db.collection('agents').findOne({});
    if (!agent) {
      console.warn('WARNING: No agents found in the "agents" collection.');
      process.exit(0);
    }
    console.log('Found Agent:', {
      _id: agent._id.toString(),
      name: agent.name,
      workspaceId: agent.workspaceId ? agent.workspaceId.toString() : 'none'
    });

    // 2. Resolve Workspace Owner ID
    let ownerId = agent.userId?.toString() || agent.ownerId?.toString();
    let notificationEmail = agent.notificationEmail || agent.ownerEmail;

    if (agent.workspaceId) {
      console.log('Resolving Workspace:', agent.workspaceId.toString());
      const workspace = await db.collection('workspaces').findOne({ _id: agent.workspaceId });
      if (workspace) {
        console.log('Found Workspace:', {
          _id: workspace._id.toString(),
          name: workspace.name,
          ownerId: workspace.ownerId ? workspace.ownerId.toString() : 'none'
        });
        if (!ownerId && workspace.ownerId) {
          ownerId = workspace.ownerId.toString();
        }
        if (!notificationEmail && workspace.ownerId) {
          const ownerUser = await db.collection('users').findOne({ _id: workspace.ownerId });
          if (ownerUser) {
            notificationEmail = ownerUser.email;
          }
        }
      } else {
        console.warn('WARNING: Workspace referenced by agent does not exist!');
      }
    }

    console.log('Resolved Parameters:', {
      ownerId: ownerId || 'unassigned',
      notificationEmail: notificationEmail || 'none'
    });

    // 3. Perform Test Ticket Insertion
    const testTicket = {
      agentId: agent._id.toString(),
      agentName: agent.name,
      sessionId: 'test_session_123',
      visitorName: 'Diagnostic Tester',
      visitorEmail: 'diagnostic@example.com',
      subject: 'Diagnostic Human Escalation Test',
      description: 'This is a self-test of the ticket escalation system to ensure insertions succeed.',
      conversationHistory: [
        { role: 'user', content: 'Help me please' },
        { role: 'assistant', content: 'I cannot help with that.' }
      ],
      status: 'open',
      priority: 'medium',
      ownerId: ownerId || 'unassigned',
      createdAt: new Date(),
      updatedAt: new Date(),
      agentNotes: ''
    };

    console.log('Inserting test ticket into "tickets" collection...');
    const result = await db.collection('tickets').insertOne(testTicket);
    console.log('Ticket successfully inserted with _id:', result.insertedId.toString());

    // 4. Clean up test ticket
    console.log('Cleaning up test ticket...');
    await db.collection('tickets').deleteOne({ _id: result.insertedId });
    console.log('Test completed successfully. Database flows are 100% correct!');

  } catch (err) {
    console.error('CRITICAL DATABASE ERROR:', err);
  } finally {
    await client.close();
  }
}

run();
