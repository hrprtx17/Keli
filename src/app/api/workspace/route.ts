import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import Workspace from '@/models/Workspace';
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
  const wsId = await resolveWorkspaceId(session);
  if (!wsId) return NextResponse.json(null);
  
  const workspace = await Workspace.findById(wsId);
  return NextResponse.json(workspace);
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    await connectDB();
    
    const wsId = await resolveWorkspaceId(session);
    if (!wsId) return NextResponse.json({ error: 'No workspace bound to user' }, { status: 404 });

    // Guarded updates
    const updates: any = {};
    if (body.name) updates.name = body.name;
    if (body.allowedDomains !== undefined) updates.allowedDomains = body.allowedDomains;

    const updated = await Workspace.findByIdAndUpdate(wsId, { $set: updates }, { new: true });
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { name, slug } = await req.json();
    if (!name || !slug) return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });

    await connectDB();

    const dbUser = await User.findOne({ email: session.user?.email });
    if (!dbUser) {
      const newUser = await User.create({
        name: session.user?.name || 'User',
        email: session.user?.email,
        role: 'owner',
        image: (session.user as any)?.image || null,
      });
      return handleCreateWorkspace(req, newUser, name, slug);
    }

    return await handleCreateWorkspace(req, dbUser, name, slug);
  } catch (error: any) {
    console.error('Workspace create error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

async function handleCreateWorkspace(req: Request, dbUser: any, name: string, slug: string) {
  const existing = await Workspace.findOne({ slug });
  if (existing) {
    return NextResponse.json({ error: 'Workspace URL is already taken. Try another.' }, { status: 400 });
  }

  if (dbUser.workspaceId) {
    const ws = await Workspace.findById(dbUser.workspaceId);
    if (ws) return NextResponse.json(ws, { status: 200 });
  }

  const workspace = await Workspace.create({
    name,
    slug,
    ownerId: dbUser._id,
    plan: 'free',
    usage: {
      monthlyCredits: 500,
      addonCredits: 0,
      creditsUsedThisMonth: 0,
      resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    },
    limits: { maxAgents: 1, maxStorage: 10 },
    allowedDomains: [],
  });

  dbUser.workspaceId = workspace._id;
  await dbUser.save();

  return NextResponse.json(workspace, { status: 201 });
}
