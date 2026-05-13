const mongoose = require('mongoose');

async function run() {
  const MONGODB_URI = 'mongodb+srv://x1hrprt:hrprt2311@cluster0.o5pv3ah.mongodb.net/agentdesk?retryWrites=true&w=majority';
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to DB');
  
  const WorkspaceSchema = new mongoose.Schema({}, { strict: false });
  const Workspace = mongoose.model('Workspace', WorkspaceSchema, 'workspaces');

  const ws = await Workspace.findOne({});
  console.log('Loaded Workspace:', ws._id);

  try {
    console.log('Executing Atomic Credit Update aggregation pipeline query...');
    const res = await Workspace.findOneAndUpdate(
      { _id: ws._id },
      [
        {
          $set: {
            "usage.creditsUsedThisMonth": {
              $cond: {
                if: { $lt: ["$usage.creditsUsedThisMonth", "$usage.monthlyCredits"] },
                then: { $add: [{ $ifNull: ["$usage.creditsUsedThisMonth", 0] }, 1] },
                else: { $ifNull: ["$usage.creditsUsedThisMonth", 0] }
              }
            }
          }
        }
      ]
    );
    console.log('SUCCESS on update!');
  } catch (e) {
    console.error('UPDATE FAILED:', e);
  }
  
  mongoose.connection.close();
}

run();
