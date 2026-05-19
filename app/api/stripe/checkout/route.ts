import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const Stripe = require('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2025-02-24.acacia',
    });

    const { establishmentId } = await req.json();

    if (!establishmentId) {
      return NextResponse.json({ error: 'Establishment ID is required' }, { status: 400 });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Stripe is not configured on the server.' }, { status: 500 });
    }

    // You would typically look up the customer in your DB first.
    // For this implementation, we'll create a new checkout session.
    // In production, make sure you map this session to the establishment in the webhook.
    
    // Pass establishmentId in the client_reference_id so the webhook knows who paid
    const session = await stripe.checkout.sessions.create({
      line_items: process.env.STRIPE_PRICE_ID 
        ? [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }]
        : [
            {
              price_data: {
                currency: 'brl',
                product_data: {
                  name: 'Plano Pro - CRM Barbearia',
                  description: 'Acesso completo a todas as funcionalidades do sistema',
                },
                unit_amount: 4900, // R$ 49,00
                recurring: {
                  interval: 'month',
                },
              },
              quantity: 1,
            },
          ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/?canceled=true`,
      client_reference_id: establishmentId,
      metadata: {
        establishmentId: establishmentId,
      }
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe Checkout Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
