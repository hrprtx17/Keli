import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Workspace from '@/models/Workspace';
import { auth } from '@/auth';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');

  if (!slug || slug.length < 2) {
    return NextResponse.json({ available: false, error: 'Too short' });
  }

  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const exists = await Workspace.findOne({ slug: slug.toLowerCase() });
    
    return NextResponse.json({ available: !exists });
  } catch (e) {
    return NextResponse.json({ available: false });
  }
}
