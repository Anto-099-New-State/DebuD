import { getServerSession } from 'next-auth';
import { NextRequest } from 'next/server';
import { authOptions } from '@/lib/auth';
import { createCheckoutSession } from '@/lib/stripe/client';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { owner, repo } = body;

    if (!owner || !repo) {
      return Response.json({ error: 'Missing owner or repo' }, { status: 400 });
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    const checkoutSession = await createCheckoutSession(
      1900, // $19.00
      `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}&owner=${owner}&repo=${repo}`,
      `${baseUrl}/dashboard/analyze?owner=${owner}&repo=${repo}`,
      {
        owner,
        repo,
        userId: session.user?.email || '',
      }
    );

    return Response.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return Response.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
