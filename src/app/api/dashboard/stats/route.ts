import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import Conversation from '@/models/Conversation';
import Ticket from '@/models/Ticket';
import Agent from '@/models/Agent';
import User from '@/models/User';

async function resolveWorkspaceId(session: any): Promise<string | null> {
  if ((session.user as any).workspaceId) return (session.user as any).workspaceId;
  const dbUser = await User.findOne({ email: session.user?.email });
  return dbUser?.workspaceId?.toString() || null;
}

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const workspaceId = await resolveWorkspaceId(session);
  if (!workspaceId) return NextResponse.json({ conversations: 0, tickets: 0, agents: 0, resolutionRate: 0 });

  const [conversations, openTickets, agents] = await Promise.all([
    Conversation.countDocuments({ workspaceId }),
    Ticket.countDocuments({ workspaceId, status: 'open' }),
    Agent.countDocuments({ workspaceId }),
  ]);

  return NextResponse.json({
    conversations,
    openTickets,
    agents,
    resolutionRate: conversations > 0 ? Math.round(((conversations - openTickets) / conversations) * 100) : 0,
  });
}
