import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import Workspace from '@/models/Workspace';

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  await connectDB();
  const workspace = await Workspace.findById((session.user as any).workspaceId);
  return NextResponse.json(workspace);
}
