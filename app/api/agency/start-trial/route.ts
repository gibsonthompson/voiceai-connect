import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

const VALID_PLANS = ['starter', 'professional', 'enterprise', 'free', 'pro', 'scale'];
const TRIAL_DAYS = 14;

// Legacy plan mapping
const LEGACY_MAP: Record<string, string> = {
  starter: 'free',
  professional: 'pro',
  enterprise: 'scale',
};

function normalizePlan(plan: string): string {
  return LEGACY_MAP[plan] || plan;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agencyId, planType: rawPlanType } = body;

    if (!agencyId || !rawPlanType) {
      return NextResponse.json(
        { error: 'Agency ID and plan type are required' },
        { status: 400 }
      );
    }

    if (!VALID_PLANS.includes(rawPlanType)) {
      return NextResponse.json(
        { error: 'Invalid plan type' },
        { status: 400 }
      );
    }

    const planType = normalizePlan(rawPlanType);
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

    // Free plan: activate immediately (no trial period)
    if (planType === 'free') {
      const { error: updateError } = await supabase
        .from('agencies')
        .update({
          subscription_status: 'active',
          status: 'active',
          plan_type: 'free',
          trial_ends_at: null,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', agencyId);

      if (updateError) {
        console.error('Failed to activate free plan:', updateError);
        return NextResponse.json(
          { error: 'Failed to activate plan' },
          { status: 500 }
        );
      }

      console.log(`✅ Agency activated on Free plan: ${agency.name} (${agencyId})`);

      return NextResponse.json({
        success: true,
        trialEndsAt: null,
        planType: 'free',
      });
    }

    // Pro/Scale: start 14-day trial
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

    console.log(`✅ Agency trial started: ${agency.name} (${agencyId}) | Plan: ${planType} | Ends: ${trialEndsAt.toISOString()}`);

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