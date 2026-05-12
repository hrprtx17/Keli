import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Agent from '@/models/Agent';
import User from '@/models/User';
import { auth } from '@/auth';
import { z } from 'zod';

const createAgentSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  systemPrompt: z.string().optional(),
  workspaceId: z.string().optional(), // passed from onboarding
});

function generateApiKey() {
  return 'ad_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

async function resolveWorkspaceId(session: any): Promise<string | null> {
  // First try the session (works for credentials login)
  if ((session.user as any).workspaceId) return (session.user as any).workspaceId;
  // For Google OAuth, look up the DB user
  const dbUser = await User.findOne({ email: session.user?.email });
  return dbUser?.workspaceId?.toString() || null;
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const workspaceId = await resolveWorkspaceId(session);
  if (!workspaceId) return NextResponse.json([], { status: 200 });

  const agents = await Agent.find({ workspaceId });
  return NextResponse.json(agents);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { name, description, systemPrompt, workspaceId: bodyWorkspaceId } = createAgentSchema.parse(body);

    await connectDB();

    // Use provided workspaceId (from onboarding) OR resolve from session/DB
    const workspaceId = bodyWorkspaceId || await resolveWorkspaceId(session);
    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace not found. Please complete onboarding first.' }, { status: 400 });
    }

    const apiKey = generateApiKey();
    const newAgent = await Agent.create({
      workspaceId,
      name,
      description: description || '',
      systemPrompt: systemPrompt || `You are ${name}, a helpful customer support AI assistant. Be concise, friendly, and accurate.`,
      apiKey,
      model: 'llama-3.1-8b-instant',
      config: { temperature: 0.7, maxTokens: 500 },
      widgetConfig: {
        primaryColor: '#F97316',
        welcomeMessage: `Hi! I'm ${name}. How can I help you today?`,
        showBranding: true,
      }
    });

    return NextResponse.json(newAgent, { status: 201 });
  } catch (error) {
    console.error('Agent create error:', error);
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues }, { status: 400 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
