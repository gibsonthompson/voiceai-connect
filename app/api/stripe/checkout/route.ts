import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/server';

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-12-15.clover',
  });
}

const PRICE_IDS: Record<string, string> = {
  starter: process.env.STRIPE_PRICE_AGENCY_STARTER || '',
  professional: process.env.STRIPE_PRICE_AGENCY_PRO || '',
  enterprise: process.env.STRIPE_PRICE_AGENCY_ENTERPRISE || '',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agencyId, planType } = body;

    if (!agencyId || !planType) {
      return NextResponse.json(
        { error: 'Agency ID and plan type are required' },
        { status: 400 }
      );
    }

    const priceId = PRICE_IDS[planType];
    if (!priceId) {
      return NextResponse.json(
        { error: 'Invalid plan type' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get agency details
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select('id, email, name, stripe_customer_id')
      .eq('id', agencyId)
      .single();

    if (agencyError || !agency) {
      return NextResponse.json(
        { error: 'Agency not found' },
        { status: 404 }
      );
    }

    // Create or retrieve Stripe customer
    let customerId = agency.stripe_customer_id;

    if (!customerId) {
      const customer = await getStripe().customers.create({
        email: agency.email,
        name: agency.name,
        metadata: {
          agency_id: agency.id,
        },
      });
      customerId = customer.id;

      // Save customer ID to database
      await supabase
        .from('agencies')
        .update({ stripe_customer_id: customerId })
        .eq('id', agencyId);
    }

    // Create checkout session with 14-day trial
    const baseUrl = process.env.NEXT_PUBLIC_PLATFORM_URL || 'https://myvoiceaiconnect.com';
    
    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          agency_id: agencyId,
          plan_type: planType,
        },
      },
      success_url: `${baseUrl}/signup/success`,
      cancel_url: `${baseUrl}/signup/plan?agency=${agencyId}`,
      metadata: {
        agency_id: agencyId,
        plan_type: planType,
      },
    });

    // DO NOT update agency status here.
    // The Stripe webhook (handleAgencyCheckoutCompleted) handles setting:
    //   status: 'trial'
    //   subscription_status: 'trialing'
    //   stripe_subscription_id
    //   trial_ends_at
    // This only fires AFTER the user completes payment on Stripe's checkout page.

    return NextResponse.json({
      success: true,
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}