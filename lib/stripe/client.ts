import Stripe from 'stripe';

let stripe: Stripe | null = null;

export function getStripeClient() {
  if (!stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }
    stripe = new Stripe(secretKey, {
      apiVersion: '2026-07-29.dahlia',
    });
  }
  return stripe;
}

export async function createCheckoutSession(
  priceInCents: number,
  successUrl: string,
  cancelUrl: string,
  metadata?: Record<string, string>
) {
  const stripe = getStripeClient();

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'DebuD - AI Design Analysis',
            description: 'Get AI-powered design suggestions and patches for your React components',
          },
          unit_amount: priceInCents,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
  });

  return session;
}
