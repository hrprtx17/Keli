import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import Conversation from '@/models/Conversation';
import User from '@/models/User';

async function getWorkspaceId(session: any) {
  if ((session.user as any).workspaceId) return (session.user as any).workspaceId;
  const dbUser = await User.findOne({ email: session.user?.email });
  return dbUser?.workspaceId?.toString() || null;
}

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectDB();
  const workspaceId = await getWorkspaceId(session);
  if (!workspaceId) return NextResponse.json([]);
  const conversations = await Conversation.find({ workspaceId }).sort({ createdAt: -1 }).limit(50);
  return NextResponse.json(conversations);
}
