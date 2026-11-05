// app/billing-policy/page.tsx - VoiceAI Connect Billing & Cancellation Policy
import Link from 'next/link';
import MarketingNav from '@/components/marketing-nav';
import MarketingFooter from '@/components/marketing-footer';

export const metadata = {
  alternates: { canonical: '/billing-policy' },
  title: 'Billing & Cancellation Policy | VoiceAI Connect',
  description: 'How billing, usage charges, failed payments, cancellation, and refunds work on the VoiceAI Connect platform.',
};

export default function BillingPolicy() {
  return (
    <main className="min-h-screen bg-ink">
      <MarketingNav />

      {/* Header - dark hero */}
      <section className="canvas-dot relative pt-32 lg:pt-40 pb-12 lg:pb-16 overflow-hidden">
        <div className="hero-aurora" />
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 relative">
          <div className="max-w-3xl">
            <p className="font-mono text-[10px] tracking-[0.18em] uppercase mb-5" style={{ color: '#4aeabc' }}>Legal</p>
            <h1 className="font-display font-medium text-white tracking-tight" style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)', letterSpacing: '-0.025em', lineHeight: 1.05 }}>
              Billing &amp; Cancellation Policy
            </h1>
            <p className="mt-5 font-mono text-[12px] text-white/45">Last Updated: November 5, 2026</p>
          </div>
        </div>
      </section>

      {/* Body - light paper */}
      <section className="bg-paper py-14 lg:py-20">
        <article className="mx-auto max-w-3xl px-6 lg:px-10">
          <div className="prose prose-lg max-w-none
            prose-headings:font-display prose-headings:font-medium prose-headings:tracking-tight prose-headings:text-black
            prose-h2:text-[1.625rem] prose-h2:mt-10 prose-h2:mb-4 prose-h2:pt-7 prose-h2:border-t prose-h2:border-black/[0.06]
            prose-h3:text-[1.25rem] prose-h3:mt-7 prose-h3:mb-3
            prose-p:font-display prose-p:text-[17px] prose-p:text-black/72 prose-p:leading-relaxed prose-p:mb-4
            prose-a:text-em-deep prose-a:no-underline hover:prose-a:underline
            prose-strong:text-black prose-strong:font-semibold
            prose-ul:text-black/72 prose-ol:text-black/72 prose-ul:text-[17px] prose-ol:text-[17px]
            prose-li:mb-2 prose-li:leading-relaxed
          ">

            <p>
              This Billing &amp; Cancellation Policy explains how billing, usage charges, failed payments,
              cancellation, and refunds work for your VoiceAI Connect <strong>agency subscription</strong>. It
              supplements our <Link href="/terms">Terms of Service</Link>; if there is any conflict, the Terms
              of Service control.
            </p>

            <h2>1. Your agency subscription</h2>
            <p>
              Paid agency plans are billed monthly in advance through our payment processor, Stripe, and renew
              automatically each month at the then-current price until you cancel. You authorize us to charge
              your payment method on file for each billing cycle. Current plans and pricing are shown on our
              website.
            </p>

            <h2>2. Usage charges</h2>
            <p>
              Depending on your plan, your subscription may include per-client and per-minute usage billing in
              addition to the flat monthly fee. Call minutes are measured per call and reported as they are
              used; spam calls that the Service blocks are excluded. Usage is totaled and billed on your regular
              monthly invoice rather than charged separately per call.
            </p>

            <h2>3. Failed or declined payments</h2>
            <p>
              If a scheduled payment fails, Stripe automatically retries your payment method over the following
              days on its standard schedule. Your account stays active while those retries are in progress. If
              payment still cannot be collected after the retries are exhausted, the subscription is canceled and
              the account is suspended. You can reactivate at any time from your billing settings.
            </p>

            <h2>4. Canceling your agency plan</h2>
            <p>
              You can cancel at any time from your billing settings. You choose when it takes effect:
            </p>
            <ul>
              <li><strong>At the end of your billing period (recommended):</strong> you and all of your clients stay fully live until your current paid period ends, then the subscription cancels. You are not charged again, and you can resume anytime before that date.</li>
              <li><strong>Immediately:</strong> your access ends right away and your clients&rsquo; AI receptionists go offline. For a short window after cancellation we hold your clients&rsquo; phone numbers so you keep the same numbers if you reactivate quickly.</li>
            </ul>

            <h2>5. Refunds</h2>
            <p>
              Agency subscription payments are not automatically refunded. Canceling stops future charges but
              does not refund the current or prior periods. Any refund is at our discretion. To ask about a
              refund, contact us through your dashboard.
            </p>

            <h2>6. Payments between agencies and their clients</h2>
            <p>
              When an agency bills its own end clients, those payments are processed through the agency&rsquo;s
              connected Stripe account and go directly to the agency, which is the merchant of record for that
              relationship. VoiceAI Connect does not hold or refund payments made by an agency&rsquo;s end
              clients. Each agency sets and administers its own billing, cancellation, and refund policy for its
              clients, and issues any such refunds from its own Stripe account.
            </p>

            <h2>7. Price changes</h2>
            <p>
              We may change plan pricing from time to time. A change that affects your plan applies from your
              next billing cycle, with reasonable notice beforehand so you can cancel if you do not wish to
              continue.
            </p>

          </div>
        </article>
      </section>

      <MarketingFooter />
    </main>
  );
}
