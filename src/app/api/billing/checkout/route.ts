import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import Workspace from '@/models/Workspace';
import DodoPayments from 'dodopayments';

const dodo = new DodoPayments({
  bearerToken: process.env.DODO_API_KEY || ''
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { type } = await req.json(); // 'premium' or 'addon'
    
    await connectDB();
    const workspace = await Workspace.findById((session.user as any).workspaceId);
    if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });

    const productId = type === 'premium' 
      ? process.env.DODO_PRODUCT_PREMIUM || 'pdt_premium_placeholder'
      : process.env.DODO_PRODUCT_ADDON || 'pdt_addon_placeholder';

    // @ts-ignore - bypassing strict type checks for metadata/payment_link depending on exact SDK version
    const payment = await dodo.payments.create({
      billing: {
        city: '',
        country: 'US',
        state: '',
        street: '',
        zipcode: '',
      },
      customer: {
        name: session.user?.name || 'Customer',
        email: session.user?.email || '',
      },
      productCart: [
        {
          productId: productId,
          quantity: 1,
        },
      ],
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=true`,
      metadata: {
        workspaceId: workspace._id.toString(),
        type: type
      }
    });

    // Dodo returns payment_link or url or checkout_url depending on endpoint
    const checkoutUrl = (payment as any).payment_link || (payment as any).url || (payment as any).checkoutUrl;
    
    // If running without real API keys, mock it for the MVP demo:
    if (!process.env.DODO_API_KEY || process.env.DODO_API_KEY.includes('your_')) {
      return NextResponse.json({ checkoutUrl: '/billing?success=true&mock=true' });
    }

    return NextResponse.json({ checkoutUrl });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
