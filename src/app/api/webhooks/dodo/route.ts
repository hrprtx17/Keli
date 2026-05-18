import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Workspace from '@/models/Workspace';

import DodoPayments from 'dodopayments';
import SecurityLog from '@/models/SecurityLog';

export async function POST(req: Request) {
  try {
    await connectDB();
  } catch (dbErr) {
    console.error('Database connection failed in webhook:', dbErr);
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
  }

  const payloadText = await req.text();
  const signature = req.headers.get('webhook-signature') || req.headers.get('dodo-signature');
  
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
  }

  let event;
  try {
    const dodo = new DodoPayments({ bearerToken: process.env.DODO_API_KEY || '' });
    if (dodo.webhooks && process.env.DODO_WEBHOOK_SECRET) {
      event = dodo.webhooks.unwrap(payloadText, { 
        headers: { 'webhook-signature': signature }, 
        key: process.env.DODO_WEBHOOK_SECRET 
      });
    } else {
      event = JSON.parse(payloadText);
    }
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
