import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Agent from '@/models/Agent';
import { auth } from '@/auth';
import { z } from 'zod';

const createAgentSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional()
});

function generateApiKey() {
  return 'ad_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  await connectDB();
  const agents = await Agent.find({ workspaceId: (session.user as any).workspaceId });
  return NextResponse.json(agents);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { name, description } = createAgentSchema.parse(body);

    await connectDB();
    const apiKey = generateApiKey();
    const newAgent = await Agent.create({
      workspaceId: (session.user as any).workspaceId,
      name,
      description,
      apiKey,
      model: 'llama-3.1-8b-instant'
    });

    return NextResponse.json(newAgent, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 400 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
