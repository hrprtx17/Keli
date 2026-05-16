import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Agent from '@/models/Agent';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const agentId = searchParams.get('agent');
  
  if (!agentId) return NextResponse.json({ error: 'Agent ID required' }, { status: 400 });

  try {
    await connectDB();
    const agent = await Agent.findById(agentId);
    if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    if (!agent.isActive) return NextResponse.json({ error: 'Agent not active' }, { status: 403 });

    return NextResponse.json({
      agentName: agent.name || 'AI Assistant',
      welcomeMessage: agent.widgetConfig?.welcomeMessage || 'Hello! How can I help you today?',
      primaryColor: agent.widgetConfig?.primaryColor || '#F97316',
      showBranding: agent.widgetConfig?.showBranding !== false
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
