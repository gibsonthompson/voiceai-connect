import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

const VALID_PLANS = ['starter', 'professional', 'enterprise'];
const TRIAL_DAYS = 14;

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

    if (!VALID_PLANS.includes(planType)) {
      return NextResponse.json(
        { error: 'Invalid plan type' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get agency and verify current state
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select('id, name, email, subscription_status, status, stripe_subscription_id')
      .eq('id', agencyId)
      .single();

    if (agencyError || !agency) {
      return NextResponse.json(
        { error: 'Agency not found' },
        { status: 404 }
      );
    }

    // Only allow starting trial from pending state
    // Prevent double-start for agencies that already have a trial or subscription
    const isPending = agency.subscription_status === 'pending' || agency.status === 'pending_payment';
    const alreadyHasSubscription = agency.stripe_subscription_id != null;
    const alreadyTrialing = agency.subscription_status === 'trialing' || agency.subscription_status === 'trial';
    const alreadyActive = agency.subscription_status === 'active';

    if (!isPending || alreadyHasSubscription || alreadyTrialing || alreadyActive) {
      return NextResponse.json(
        { error: 'Agency already has an active subscription or trial' },
        { status: 400 }
      );
    }

    // Set trial — 14 days from now, no Stripe, no credit card
    const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

    const { error: updateError } = await supabase
      .from('agencies')
      .update({
        subscription_status: 'trialing',
        status: 'trial',
        plan_type: planType,
        trial_ends_at: trialEndsAt.toISOString(),
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', agencyId);

    if (updateError) {
      console.error('Failed to start trial:', updateError);
      return NextResponse.json(
        { error: 'Failed to start trial' },
        { status: 500 }
      );
    }

    console.log(`✅ Agency free trial started (no card): ${agency.name} (${agencyId}) | Plan: ${planType} | Ends: ${trialEndsAt.toISOString()}`);

    return NextResponse.json({
      success: true,
      trialEndsAt: trialEndsAt.toISOString(),
      planType,
    });
  } catch (error) {
    console.error('Start trial error:', error);
    return NextResponse.json(
      { error: 'Failed to start trial' },
      { status: 500 }
    );
  }
}