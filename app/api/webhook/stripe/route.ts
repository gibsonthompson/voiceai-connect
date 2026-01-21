import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/server';

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-12-15.clover',
  });
}

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const agencyId = session.metadata?.agency_id;
        const planType = session.metadata?.plan_type;

        if (agencyId) {
          // Calculate trial end date (14 days from now)
          const trialEndsAt = new Date();
          trialEndsAt.setDate(trialEndsAt.getDate() + 14);

          await supabase
            .from('agencies')
            .update({
              stripe_subscription_id: session.subscription as string,
              subscription_status: 'trial',
              status: 'trial',
              plan_type: planType || 'starter',
              trial_ends_at: trialEndsAt.toISOString(),
            })
            .eq('id', agencyId);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const agencyId = subscription.metadata?.agency_id;

        if (agencyId) {
          let status: string;
          if (subscription.status === 'active') {
            status = 'active';
          } else if (subscription.status === 'trialing') {
            status = 'trial';
          } else if (subscription.status === 'past_due') {
            status = 'past_due';
          } else {
            status = subscription.status;
          }

          // Get period end from subscription items if available
          const periodEnd = subscription.items?.data?.[0]?.current_period_end;

          await supabase
            .from('agencies')
            .update({
              subscription_status: status,
              status: status === 'active' || status === 'trial' ? status : 'suspended',
              ...(periodEnd && { current_period_end: new Date(periodEnd * 1000).toISOString() }),
            })
            .eq('id', agencyId);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const agencyId = subscription.metadata?.agency_id;

        if (agencyId) {
          await supabase
            .from('agencies')
            .update({
              subscription_status: 'canceled',
              status: 'suspended',
            })
            .eq('id', agencyId);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        // In newer Stripe API, subscription is accessed through parent or subscription_details
        const subscriptionId = (invoice as unknown as { subscription?: string }).subscription || 
                               invoice.parent?.subscription_details?.subscription;

        if (subscriptionId && typeof subscriptionId === 'string') {
          // Find agency by subscription ID
          const { data: agency } = await supabase
            .from('agencies')
            .select('id')
            .eq('stripe_subscription_id', subscriptionId)
            .single();

          if (agency) {
            await supabase
              .from('agencies')
              .update({
                subscription_status: 'active',
                status: 'active',
              })
              .eq('id', agency.id);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as unknown as { subscription?: string }).subscription || 
                               invoice.parent?.subscription_details?.subscription;

        if (subscriptionId && typeof subscriptionId === 'string') {
          // Find agency by subscription ID
          const { data: agency } = await supabase
            .from('agencies')
            .select('id')
            .eq('stripe_subscription_id', subscriptionId)
            .single();

          if (agency) {
            await supabase
              .from('agencies')
              .update({
                subscription_status: 'past_due',
              })
              .eq('id', agency.id);
          }
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
