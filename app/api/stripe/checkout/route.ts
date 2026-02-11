import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrencyForCountry, convertToLocalCurrency } from '@/lib/currency';

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-12-15.clover',
  });
}

// USD amounts in cents for each plan
const PLAN_PRICES_USD_CENTS: Record<string, number> = {
  starter: 9900,       // $99
  professional: 19900,  // $199
  enterprise: 49900,    // $499
};

const PLAN_NAMES: Record<string, string> = {
  starter: 'Starter',
  professional: 'Professional',
  enterprise: 'Scale',
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

    const usdCents = PLAN_PRICES_USD_CENTS[planType];
    if (!usdCents) {
      return NextResponse.json(
        { error: 'Invalid plan type' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get agency details including country
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select('id, email, name, stripe_customer_id, country')
      .eq('id', agencyId)
      .single();

    if (agencyError || !agency) {
      return NextResponse.json(
        { error: 'Agency not found' },
        { status: 404 }
      );
    }

    // Determine currency from agency's country
    const countryCode = agency.country || 'US';
    const currencyConfig = getCurrencyForCountry(countryCode);
    const currency = currencyConfig.code.toLowerCase(); // Stripe expects lowercase
    const localAmount = convertToLocalCurrency(usdCents / 100, countryCode); // convertToLocalCurrency expects dollars
    const localAmountCents = Math.round(localAmount * (currencyConfig.decimals === 0 ? 1 : 100));
    
    // For zero-decimal currencies (JPY, HUF, etc.), Stripe expects the amount as-is
    // For normal currencies, Stripe expects cents
    // Our convertToLocalCurrency returns rounded whole numbers since decimals=0 in our config
    // So for JPY: $99 * 152 = 15048 yen (pass 15048 to Stripe)
    // For GBP: $99 * 0.79 = 78 pounds (pass 7800 to Stripe as pence)
    const ZERO_DECIMAL_CURRENCIES = [
      'jpy', 'krw', 'vnd', 'clp', 'pyg', 'ugx', 'gnf', 'rwf', 'xof', 'xaf',
      'bif', 'djf', 'kmf', 'mga', 'xpf'
    ];
    
    const isZeroDecimal = ZERO_DECIMAL_CURRENCIES.includes(currency);
    const stripeAmount = isZeroDecimal ? localAmount : localAmount * 100;

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

      await supabase
        .from('agencies')
        .update({ stripe_customer_id: customerId })
        .eq('id', agencyId);
    }

    // Create checkout session with price_data (dynamic currency)
    const baseUrl = process.env.NEXT_PUBLIC_PLATFORM_URL || 'https://myvoiceaiconnect.com';
    
    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency,
            unit_amount: stripeAmount,
            recurring: { interval: 'month' },
            product_data: {
              name: `VoiceAI Connect ${PLAN_NAMES[planType]} Plan`,
              description: `White-label AI receptionist platform — ${PLAN_NAMES[planType]}`,
            },
          },
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

    console.log(`✅ Agency checkout created: ${session.id} | ${currency.toUpperCase()} ${stripeAmount} (${PLAN_NAMES[planType]})`);

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