import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Agent from '@/models/Agent';
import User from '@/models/User';
import { auth } from '@/auth';

async function resolveWorkspaceId(session: any): Promise<string | null> {
  if ((session.user as any).workspaceId) return (session.user as any).workspaceId;
  const dbUser = await User.findOne({ email: session.user?.email });
  return dbUser?.workspaceId?.toString() || null;
}

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { id } = await context.params;

  await connectDB();
  const workspaceId = await resolveWorkspaceId(session);
  if (!workspaceId) return NextResponse.json({ error: 'No workspace' }, { status: 403 });

  const agent = await Agent.findOne({ _id: id, workspaceId });
  if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  return NextResponse.json(agent);
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;

  const body = await req.json();
  await connectDB();
  
  const workspaceId = await resolveWorkspaceId(session);
  if (!workspaceId) return NextResponse.json({ error: 'No workspace' }, { status: 403 });

  // Prevent overriding crucial fields unintentionally via spread
  const updateData: any = {};
  if (body.name) updateData.name = body.name;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.systemPrompt) updateData.systemPrompt = body.systemPrompt;
  if (body.widgetConfig) updateData.widgetConfig = body.widgetConfig;
  if (body.config) updateData.config = body.config;

  const updatedAgent = await Agent.findOneAndUpdate(
    { _id: id, workspaceId },
    { $set: updateData },
    { new: true }
  );

  if (!updatedAgent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  return NextResponse.json(updatedAgent);
}

// Fallback for clients that might hit PUT instead of PATCH
export { PATCH as PUT };

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;

  await connectDB();
  const workspaceId = await resolveWorkspaceId(session);
  if (!workspaceId) return NextResponse.json({ error: 'No workspace' }, { status: 403 });

  const agent = await Agent.findOneAndDelete({ _id: id, workspaceId });
  if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
