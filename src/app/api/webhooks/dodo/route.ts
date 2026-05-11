import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Workspace from '@/models/Workspace';

import DodoPayments from 'dodopayments';
import SecurityLog from '@/models/SecurityLog';

export async function POST(req: Request) {
  const payloadText = await req.text();
  const signature = req.headers.get('webhook-signature') || req.headers.get('dodo-signature');
  
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
  }

  let event;
  try {
    const dodo = new DodoPayments({ bearerToken: process.env.DODO_API_KEY || '' });
    // Assuming Dodo SDK supports webhook construction. If not, fallback to raw parsing
    event = dodo.webhooks ? await dodo.webhooks.constructEvent(payloadText, signature, process.env.DODO_WEBHOOK_SECRET || '') : JSON.parse(payloadText);
  } catch (err: any) {
    SecurityLog.create({
      eventType: 'webhook_failure',
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      endpoint: '/api/webhooks/dodo',
      details: err.message
    }).catch(console.error);
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  try {
    await connectDB();

    // Check if this is a payment success event
    if (event.type === 'payment.succeeded' || event.type === 'payment_intent.succeeded') {
      const metadata = event.data?.metadata || event.data?.object?.metadata;
      
      if (metadata && metadata.workspaceId) {
        const workspace = await Workspace.findById(metadata.workspaceId);
        
        if (workspace) {
          if (metadata.type === 'premium') {
            workspace.plan = 'premium';
            workspace.usage.monthlyCredits = 20000;
            workspace.limits.maxAgents = 5;
            // Also store subscription/customer IDs if provided in the payload
            if (event.data?.customer) workspace.dodoCustomerId = event.data.customer;
            if (event.data?.subscription) workspace.dodoSubscriptionId = event.data.subscription;
          } else if (metadata.type === 'addon') {
            workspace.usage.addonCredits += 10000;
          }
          await workspace.save();
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 400 });
  }
}
