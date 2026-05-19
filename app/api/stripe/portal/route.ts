import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    // Pega o ID do cliente Stripe vinculado a este estabelecimento
    const { data: establishment, error } = await supabaseAdmin
      .from('establishments')
      .select('stripe_customer_id')
      .eq('id', establishmentId)
      .single();

    if (error || !establishment?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'Você ainda não possui um histórico de pagamentos com a Stripe. Faça o primeiro pagamento (Checkout) para gerar sua conta.' },
        { status: 404 }
      );
    }

    // Gera o link de sessão do Portal do Cliente
    const returnUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/`;
    const session = await stripe.billingPortal.sessions.create({
      customer: establishment.stripe_customer_id,
      return_url: returnUrl,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe Portal Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
