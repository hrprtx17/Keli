import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Message from '@/models/Message';
import Agent from '@/models/Agent';
import { auth } from '@/auth';
import mongoose from 'mongoose';

export async function GET() {
  const session = await auth();
  if (!session || !(session.user as any).workspaceId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const workspaceId = new mongoose.Types.ObjectId((session.user as any).workspaceId);
    
    // Calculate date range (last 30 days or similar)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);

    // 1. Get all agent IDs tied to workspace
    const agents = await Agent.find({ workspaceId }).select('_id name').lean();
    const agentIds = agents.map(a => a._id);

    // 2. Aggregate message count per agent (Pie Chart Real Data)
    const usagePerAgent = await Message.aggregate([
      { 
        $match: { 
          agentId: { $in: agentIds },
          role: 'assistant' // count only AI completions as credit consumption
        } 
      },
      {
        $group: {
          _id: "$agentId",
          total: { $sum: 1 }
        }
      }
    ]);

    const finalPerAgent = usagePerAgent.map(item => {
      const agentObj = agents.find(a => a._id.toString() === item._id.toString());
      return {
        name: agentObj?.name || 'Unknown Agent',
        value: item.total || 0
      };
    });

    // 3. Aggregate message count per day (Bar Chart Real Data)
    const usagePerDay = await Message.aggregate([
      {
        $match: {
          agentId: { $in: agentIds },
          role: 'assistant',
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            day: { $dayOfMonth: "$createdAt" },
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" }
          },
          credits: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
    ]);

    // Formulate friendly display names for the response
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const finalHistory = usagePerDay.map(item => ({
      name: `${monthNames[item._id.month - 1]} ${item._id.day}`,
      credits: item.credits
    }));

    // If totally empty, supply one zeroed record to satisfy graphing requirements without hardcoding fake spikes.
    if (finalHistory.length === 0) {
        const todayStr = `${monthNames[endDate.getMonth()]} ${endDate.getDate()}`;
        finalHistory.push({ name: todayStr, credits: 0 });
    }

    return NextResponse.json({
      perAgent: finalPerAgent.length > 0 ? finalPerAgent : [{ name: 'No Activity', value: 0 }],
      history: finalHistory
    });

  } catch (error) {
    console.error('Analytics API failed:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
