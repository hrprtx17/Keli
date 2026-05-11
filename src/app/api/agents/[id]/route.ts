import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Agent from '@/models/Agent';
import { auth } from '@/auth';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  await connectDB();
  const agent = await Agent.findOne({ _id: params.id, workspaceId: (session.user as any).workspaceId });
  if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  return NextResponse.json(agent);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  await connectDB();
  const updatedAgent = await Agent.findOneAndUpdate(
    { _id: params.id, workspaceId: (session.user as any).workspaceId },
    { $set: body },
    { new: true }
  );

  if (!updatedAgent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  return NextResponse.json(updatedAgent);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const agent = await Agent.findOneAndDelete({ _id: params.id, workspaceId: (session.user as any).workspaceId });
  if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
