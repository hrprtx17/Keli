import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import DataSource from '@/models/DataSource';
import User from '@/models/User';

async function resolveWorkspaceId(session: any): Promise<string | null> {
  if ((session.user as any).workspaceId) return (session.user as any).workspaceId;
  const dbUser = await User.findOne({ email: session.user?.email });
  return dbUser?.workspaceId?.toString() || null;
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const agentId = url.searchParams.get('agentId');

  await connectDB();
  const workspaceId = await resolveWorkspaceId(session);
  if (!workspaceId) return NextResponse.json([]);

  const filter: any = { workspaceId };
  if (agentId) filter.agentId = agentId;

  const docs = await DataSource.find(filter).sort({ createdAt: -1 });
  return NextResponse.json(docs);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { agentId, type, name, content, metadata } = body;
  
  if (!agentId || !type || !name || !content) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  await connectDB();
  const workspaceId = await resolveWorkspaceId(session);
  if (!workspaceId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const source = await DataSource.create({
    agentId,
    workspaceId,
    type,
    name,
    content,
    status: 'ready', // For now auto-ready simulated ingestion
    metadata: metadata || {}
  });

  return NextResponse.json(source, { status: 201 });
}
