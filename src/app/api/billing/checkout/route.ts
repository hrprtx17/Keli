import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import Workspace from '@/models/Workspace';
import User from '@/models/User';
import DodoPayments from 'dodopayments';

const dodo = new DodoPayments({
  bearerToken: process.env.DODO_API_KEY || '',
  environment: (process.env.DODO_API_KEY && process.env.DODO_API_KEY.includes('live')) ? 'live_mode' : 'test_mode'
});

async function resolveWorkspaceId(session: any): Promise<string | null> {
  if ((session.user as any).workspaceId) return (session.user as any).workspaceId;
  const dbUser = await User.findOne({ email: session.user?.email });
  return dbUser?.workspaceId?.toString() || null;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { type } = await req.json(); // 'premium' or 'addon'
    
    await connectDB();
    const workspaceId = await resolveWorkspaceId(session);
    if (!workspaceId) return NextResponse.json({ error: 'Workspace context missing' }, { status: 400 });

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });

    const productId = type === 'premium' 
      ? process.env.DODO_PRODUCT_PREMIUM || 'pdt_premium_placeholder'
      : process.env.DODO_PRODUCT_ADDON || 'pdt_addon_placeholder';

    // If running without real API keys, fallback immediately for the MVP demo:
    if (!process.env.DODO_API_KEY || process.env.DODO_API_KEY.includes('your_')) {
      return NextResponse.json({ checkoutUrl: '/billing?success=true&mock=true' });
    }

    // Exact call per SDK definition
    const checkoutSession = await dodo.checkoutSessions.create({
      customer: {
        name: session.user?.name || 'Customer',
        email: session.user?.email || '',
      },
      product_cart: [
        {
          product_id: productId,
          quantity: 1,
        },
      ],
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/billing?success=true`,
      metadata: {
        workspaceId: workspace._id.toString(),
        type: type
      }
    });

    const checkoutUrl = checkoutSession.checkout_url;
    
    if (!checkoutUrl) {
       throw new Error('Failed to receive checkout URL from session creation.');
    }

    return NextResponse.json({ checkoutUrl });
  } catch (error: any) {
    console.error('Dodo Checkout Failure Error:', error);
    return NextResponse.json({ error: `Checkout initialization failure: ${error.message || 'Unknown'}` }, { status: 500 });
  }
}
