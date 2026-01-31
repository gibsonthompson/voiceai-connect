// app/terms/page.tsx
// 
// VoiceAI Connect Terms of Service
// Last Updated: January 2026
// 
// Covers: White-label platform terms, AI receptionist usage, call recording compliance,
// TCPA requirements, payment terms, intellectual property, liability limitations

import Link from 'next/link';

// Main marketing site URL - used for logo/home links
const MARKETING_URL = 'https://myvoiceaiconnect.com';

function WaveformIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="2" y="9" width="2" height="6" rx="1" fill="currentColor" opacity="0.6" />
      <rect x="5" y="7" width="2" height="10" rx="1" fill="currentColor" opacity="0.8" />
      <rect x="8" y="4" width="2" height="16" rx="1" fill="currentColor" />
      <rect x="11" y="6" width="2" height="12" rx="1" fill="currentColor" />
      <rect x="14" y="3" width="2" height="18" rx="1" fill="currentColor" />
      <rect x="17" y="7" width="2" height="10" rx="1" fill="currentColor" opacity="0.8" />
      <rect x="20" y="9" width="2" height="6" rx="1" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

export const metadata = {
  title: 'Terms of Service | VoiceAI Connect',
  description: 'VoiceAI Connect Terms of Service. The legal agreement governing your use of our platform.',
};

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#050505] text-[#fafaf9]">
      {/* Grain overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.02] z-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-white/[0.06] bg-[#050505]/80 backdrop-blur-2xl">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="flex h-16 sm:h-20 items-center justify-between">
            <a href={MARKETING_URL} className="flex items-center gap-2.5 group">
              <div className="h-9 w-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
                <WaveformIcon className="w-5 h-5 text-[#fafaf9]" />
              </div>
              <span className="text-base font-semibold">VoiceAI Connect</span>
            </a>
            <a href={MARKETING_URL} className="text-sm text-[#fafaf9]/60 hover:text-[#fafaf9] transition-colors">
              ← Back to Home
            </a>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="relative pt-28 sm:pt-32 pb-16 px-4 sm:px-6">
        <article className="mx-auto max-w-3xl">
          <header className="mb-12">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Terms of Service</h1>
            <p className="mt-4 text-[#fafaf9]/60">
              Last Updated: January 31, 2026
            </p>
          </header>

          <div className="prose prose-invert prose-lg max-w-none
            prose-headings:font-semibold prose-headings:tracking-tight
            prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4
            prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3
            prose-p:text-[#fafaf9]/70 prose-p:leading-relaxed prose-p:mb-4
            prose-a:text-emerald-400 prose-a:no-underline hover:prose-a:underline
            prose-strong:text-[#fafaf9]
            prose-ul:text-[#fafaf9]/70 prose-ol:text-[#fafaf9]/70
            prose-li:mb-2
          ">
            
            <p>
              Welcome to VoiceAI Connect. These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of 
              the VoiceAI Connect platform, website, APIs, and related services (collectively, the &ldquo;Service&rdquo;) 
              provided by VoiceAI Connect (&ldquo;Company,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;).
            </p>

            <p>
              <strong>By creating an account, accessing, or using our Service, you agree to be bound by these Terms 
              and our <Link href="/privacy">Privacy Policy</Link>.</strong> If you do not agree to these Terms, you may not 
              access or use the Service.
            </p>

            <p>
              If you are using the Service on behalf of a business or organization, you represent and warrant that you 
              have the authority to bind that entity to these Terms.
            </p>

            <h2>1. Definitions</h2>
            
            <ul>
              <li><strong>&ldquo;Agency&rdquo; or &ldquo;Agency User&rdquo;</strong> means a subscriber who uses VoiceAI Connect to create, manage, and resell AI receptionist services under their own brand.</li>
              <li><strong>&ldquo;End Client&rdquo;</strong> means a customer of an Agency User who receives AI receptionist services.</li>
              <li><strong>&ldquo;Caller&rdquo;</strong> means any individual who places a phone call to a number connected to the Service.</li>
              <li><strong>&ldquo;AI Receptionist&rdquo;</strong> means the automated voice assistant technology provided through the Service.</li>
              <li><strong>&ldquo;Content&rdquo;</strong> means any text, audio, data, scripts, configurations, or other materials uploaded to or generated through the Service.</li>
              <li><strong>&ldquo;Subscription&rdquo;</strong> means the paid plan under which an Agency accesses the Service.</li>
            </ul>

            <h2>2. The Service</h2>

            <h3>2.1 Description</h3>
            <p>
              VoiceAI Connect is a white-label platform that enables Agencies to offer AI-powered receptionist services 
              to their End Clients. The Service includes AI voice technology that answers phone calls, responds to 
              caller inquiries, schedules appointments, captures caller information, and provides call recordings and transcripts.
            </p>

            <h3>2.2 White-Label Rights</h3>
            <p>
              Subject to these Terms and your Subscription, we grant you a limited, non-exclusive, non-transferable right to:
            </p>
            <ul>
              <li>Brand and customize the Service with your own logo, colors, and business name</li>
              <li>Resell AI receptionist services to your End Clients under your own brand</li>
              <li>Set your own pricing for services you provide to End Clients</li>
              <li>Access the Service through your own custom domain (where supported by your plan)</li>
            </ul>

            <h3>2.3 Service Availability</h3>
            <p>
              We strive to maintain 99.9% uptime for the Service. However, we do not guarantee uninterrupted access. 
              The Service may be unavailable due to scheduled maintenance (with advance notice where practicable), 
              emergency maintenance, or circumstances beyond our reasonable control.
            </p>

            <h2>3. Account Registration and Security</h2>

            <h3>3.1 Account Creation</h3>
            <p>
              To use the Service, you must create an account by providing accurate, current, and complete information. 
              You may create an account using your email address or by signing in with a third-party authentication 
              provider such as Google. You must be at least 18 years old and have the legal capacity to enter into these Terms.
            </p>

            <h3>3.2 Account Security</h3>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials and for all activities 
              that occur under your account. You must immediately notify us at support@myvoiceaiconnect.com if you suspect 
              unauthorized access to your account.
            </p>

            <h3>3.3 Account Sharing</h3>
            <p>
              Your account is for your use only. You may not share account credentials with third parties. You may 
              create sub-accounts for team members as permitted by your Subscription plan.
            </p>

            <h2>4. Subscriptions and Payment</h2>

            <h3>4.1 Subscription Plans</h3>
            <p>
              Access to the Service requires a paid Subscription. Subscription details, including features, pricing, 
              and usage limits, are described on our pricing page and in your account dashboard. We reserve the right 
              to modify pricing with 30 days&apos; notice.
            </p>

            <h3>4.2 Payment Terms</h3>
            <ul>
              <li>Subscriptions are billed monthly or annually in advance, as selected at signup.</li>
              <li>All payments are processed securely through Stripe. By providing payment information, you authorize us to charge your payment method for all fees owed.</li>
              <li>All fees are stated in U.S. dollars unless otherwise specified.</li>
              <li>Fees are non-refundable except as expressly provided in these Terms or required by law.</li>
            </ul>

            <h3>4.3 Usage-Based Charges</h3>
            <p>
              Certain features may incur usage-based charges (e.g., call minutes, additional phone numbers). These 
              charges will be clearly disclosed and billed according to your usage.
            </p>

            <h3>4.4 Failed Payments</h3>
            <p>
              If payment fails, we will notify you and attempt to process the payment again. If payment remains 
              unsuccessful after 7 days, we may suspend or terminate your access to the Service.
            </p>

            <h3>4.5 Stripe Connect (For Agencies)</h3>
            <p>
              If you use Stripe Connect to receive payments from your End Clients, your use of Stripe is subject to 
              Stripe&apos;s terms of service. We are not responsible for Stripe&apos;s services, fees, or any issues arising 
              from your use of Stripe Connect.
            </p>

            <h2>5. Telecommunications and Call Recording Compliance</h2>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5 my-6">
              <p className="text-amber-200 font-semibold mb-2">Important Legal Notice</p>
              <p className="text-[#fafaf9]/70 text-sm mb-0">
                The Service involves telecommunications and call recording. As an Agency User, YOU are responsible for 
                ensuring your use of the Service complies with all applicable federal, state, and local laws, including 
                but not limited to the Telephone Consumer Protection Act (TCPA), state call recording laws, and 
                consumer protection regulations.
              </p>
            </div>

            <h3>5.1 AI Disclosure (TCPA Compliance)</h3>
            <p>
              The Federal Communications Commission (FCC) requires disclosure when calls use AI-generated voices. 
              Our AI Receptionists are configured to identify themselves as AI assistants at the beginning of each call. 
              You agree not to disable, circumvent, or modify this disclosure.
            </p>

            <h3>5.2 Call Recording Consent</h3>
            <p>
              The Service records calls for quality assurance, training, and to provide transcripts. Our AI Receptionists 
              are configured to inform callers that the call may be recorded. However, call recording laws vary by jurisdiction:
            </p>
            <ul>
              <li><strong>One-Party Consent States:</strong> Recording is permitted if one party (including the AI acting on your behalf) consents.</li>
              <li><strong>Two-Party/All-Party Consent States:</strong> All parties must consent to recording. These states include California, Connecticut, Florida, Illinois, Maryland, Massachusetts, Montana, Nevada, New Hampshire, Pennsylvania, and Washington.</li>
            </ul>
            <p>
              <strong>It is YOUR responsibility</strong> to ensure that your use of call recording features complies with 
              applicable laws in your jurisdiction and the jurisdictions where your callers are located. If you operate 
              in or receive calls from two-party consent states, you must ensure callers are properly notified and consent 
              to recording.
            </p>

            <h3>5.3 Prohibited Telecommunications Uses</h3>
            <p>You agree NOT to use the Service to:</p>
            <ul>
              <li>Make outbound telemarketing calls or robocalls without proper consent</li>
              <li>Violate the Telephone Consumer Protection Act (TCPA) or state equivalents</li>
              <li>Contact numbers on the National Do Not Call Registry for marketing purposes</li>
              <li>Transmit caller ID information that is misleading or inaccurate (caller ID spoofing)</li>
              <li>Engage in any form of telephone harassment or fraud</li>
            </ul>

            <h3>5.4 Indemnification for Telecom Violations</h3>
            <p>
              You agree to indemnify and hold VoiceAI Connect harmless from any claims, damages, fines, or penalties 
              arising from your violation of telecommunications laws, including TCPA violations. TCPA violations can 
              result in statutory damages of $500 to $1,500 per violation.
            </p>

            <h2>6. Acceptable Use Policy</h2>

            <h3>6.1 Permitted Use</h3>
            <p>You may use the Service only for lawful business purposes in accordance with these Terms.</p>

            <h3>6.2 Prohibited Conduct</h3>
            <p>You agree NOT to:</p>
            <ul>
              <li>Use the Service for any illegal purpose or in violation of any laws</li>
              <li>Infringe on the intellectual property rights of others</li>
              <li>Transmit malware, viruses, or other harmful code</li>
              <li>Attempt to gain unauthorized access to the Service or related systems</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
              <li>Resell or redistribute the Service except as expressly permitted (white-label)</li>
              <li>Use the Service to collect, store, or process sensitive personal information (e.g., Social Security numbers, payment card details, health information) unless compliant with applicable regulations</li>
              <li>Create Content that is defamatory, obscene, harassing, or discriminatory</li>
              <li>Impersonate any person or entity</li>
              <li>Use the Service in any manner that could damage our reputation or goodwill</li>
            </ul>

            <h3>6.3 Content Guidelines</h3>
            <p>
              Content you create (scripts, FAQ responses, greetings) must be accurate, lawful, and not misleading. 
              You are solely responsible for all Content you upload or configure.
            </p>

            <h2>7. Intellectual Property</h2>

            <h3>7.1 Our Intellectual Property</h3>
            <p>
              The Service, including its software, AI models, algorithms, design, features, and documentation, is owned 
              by VoiceAI Connect and protected by copyright, trademark, and other intellectual property laws. Except 
              for the limited white-label rights granted herein, no rights are transferred to you.
            </p>

            <h3>7.2 Your Content</h3>
            <p>
              You retain ownership of Content you create and upload to the Service. By uploading Content, you grant 
              us a non-exclusive, worldwide, royalty-free license to use, store, display, and process your Content 
              solely for the purpose of providing the Service.
            </p>

            <h3>7.3 Feedback</h3>
            <p>
              If you provide feedback, suggestions, or ideas about the Service, we may use them without obligation 
              to you and you assign all rights in such feedback to us.
            </p>

            <h3>7.4 Trademarks</h3>
            <p>
              &ldquo;VoiceAI Connect&rdquo; and our logo are trademarks of VoiceAI Connect. You may not use our trademarks 
              without prior written permission. Your use of our white-label features does not grant you rights to 
              use our trademarks—you use your own branding.
            </p>

            <h2>8. Data Processing and Privacy</h2>

            <h3>8.1 Privacy Policy</h3>
            <p>
              Our collection and use of personal information is governed by our <Link href="/privacy">Privacy Policy</Link>, 
              which is incorporated into these Terms by reference.
            </p>

            <h3>8.2 Data Processing Relationship</h3>
            <p>
              With respect to personal data of your End Clients and their Callers, you are the data controller and we 
              are the data processor acting on your behalf. We process such data only according to your instructions 
              (as implemented through the Service) and in accordance with our Privacy Policy.
            </p>

            <h3>8.3 GDPR and Data Protection</h3>
            <p>
              If you process personal data of individuals in the European Economic Area or United Kingdom, a Data 
              Processing Agreement (DPA) is available upon request at support@myvoiceaiconnect.com.
            </p>

            <h3>8.4 Your Obligations</h3>
            <p>
              You are responsible for ensuring you have a lawful basis to collect and process personal data through 
              the Service, including obtaining any necessary consents from End Clients and Callers.
            </p>

            <h2>9. Third-Party Services</h2>

            <p>
              The Service integrates with third-party services including:
            </p>
            <ul>
              <li><strong>Authentication:</strong> Google Sign-In for account creation and login</li>
              <li><strong>Payments:</strong> Stripe for payment processing and Stripe Connect for agency payouts</li>
              <li><strong>Telephony:</strong> VAPI and related providers for voice AI services</li>
              <li><strong>Integrations:</strong> Google Calendar, CRM systems, and other business tools</li>
            </ul>
            <p>
              Your use of these integrations is subject to the respective third party&apos;s terms of service. We are not 
              responsible for the availability, accuracy, or functionality of third-party services.
            </p>

            <h2>10. Disclaimer of Warranties</h2>

            <div className="bg-white/[0.05] border border-white/[0.08] rounded-xl p-5 my-6">
              <p className="text-[#fafaf9]/70 text-sm mb-0">
                THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS 
                OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR 
                PURPOSE, TITLE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, 
                OR COMPLETELY SECURE. WE DO NOT WARRANT THAT THE AI RECEPTIONIST WILL RESPOND ACCURATELY OR APPROPRIATELY 
                IN ALL SITUATIONS.
              </p>
            </div>

            <h2>11. Limitation of Liability</h2>

            <div className="bg-white/[0.05] border border-white/[0.08] rounded-xl p-5 my-6">
              <p className="text-[#fafaf9]/70 text-sm mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL VOICEAI CONNECT, ITS AFFILIATES, DIRECTORS, 
                EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, 
                INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, BUSINESS, OR GOODWILL, ARISING OUT OF OR RELATED TO 
                YOUR USE OF THE SERVICE, REGARDLESS OF WHETHER SUCH DAMAGES WERE FORESEEABLE OR WHETHER WE WERE ADVISED 
                OF THE POSSIBILITY OF SUCH DAMAGES.
              </p>
              <p className="text-[#fafaf9]/70 text-sm mb-0">
                OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING OUT OF OR RELATED TO THESE TERMS OR THE SERVICE SHALL 
                NOT EXCEED THE AMOUNTS PAID BY YOU TO VOICEAI CONNECT IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
              </p>
            </div>

            <p>
              Some jurisdictions do not allow the exclusion or limitation of certain damages. In such jurisdictions, 
              our liability will be limited to the greatest extent permitted by law.
            </p>

            <h2>12. Indemnification</h2>

            <p>
              You agree to indemnify, defend, and hold harmless VoiceAI Connect, its affiliates, officers, directors, 
              employees, and agents from and against any claims, liabilities, damages, losses, costs, and expenses 
              (including reasonable attorneys&apos; fees) arising out of or related to:
            </p>
            <ul>
              <li>Your use of the Service</li>
              <li>Your Content</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any applicable law, including telecommunications laws</li>
              <li>Your violation of any third-party rights</li>
              <li>Any claims by your End Clients or their Callers</li>
            </ul>

            <h2>13. Term and Termination</h2>

            <h3>13.1 Term</h3>
            <p>
              These Terms commence when you create an account and continue until terminated by either party.
            </p>

            <h3>13.2 Termination by You</h3>
            <p>
              You may terminate your account at any time through your account settings or by contacting support. 
              Termination takes effect at the end of your current billing period. No refunds will be provided for 
              unused portions of prepaid fees.
            </p>

            <h3>13.3 Termination by Us</h3>
            <p>We may terminate or suspend your account immediately if you:</p>
            <ul>
              <li>Violate these Terms</li>
              <li>Fail to pay fees when due</li>
              <li>Engage in conduct that could harm us, other users, or third parties</li>
              <li>Are subject to bankruptcy or insolvency proceedings</li>
            </ul>
            <p>
              We may also terminate your account for any reason with 30 days&apos; notice.
            </p>

            <h3>13.4 Effect of Termination</h3>
            <p>Upon termination:</p>
            <ul>
              <li>Your access to the Service will cease</li>
              <li>Your data will be retained for 30 days, after which it may be deleted</li>
              <li>You remain liable for any fees owed</li>
              <li>Provisions that by their nature should survive termination will survive (e.g., intellectual property, indemnification, limitation of liability)</li>
            </ul>

            <h3>13.5 Data Export</h3>
            <p>
              You may request an export of your data within 30 days of termination. After 30 days, we may delete 
              your data in accordance with our data retention practices.
            </p>

            <h2>14. Modifications to Terms</h2>

            <p>
              We may modify these Terms at any time. We will notify you of material changes by email (to the address 
              associated with your account) and/or by posting a notice on the Service at least 30 days before the 
              changes take effect. Your continued use of the Service after the effective date constitutes acceptance 
              of the modified Terms. If you do not agree to the modified Terms, you must stop using the Service and 
              terminate your account.
            </p>

            <h2>15. Dispute Resolution</h2>

            <h3>15.1 Informal Resolution</h3>
            <p>
              Before initiating any formal dispute proceeding, you agree to first contact us at support@myvoiceaiconnect.com 
              to attempt to resolve the dispute informally. We will attempt to resolve the dispute within 30 days.
            </p>

            <h3>15.2 Arbitration</h3>
            <p>
              If the dispute is not resolved informally, any controversy or claim arising out of or relating to these 
              Terms or the Service shall be settled by binding arbitration administered by the American Arbitration 
              Association in accordance with its Commercial Arbitration Rules. The arbitration shall be conducted in 
              Georgia, and judgment on the award may be entered in any court having jurisdiction.
            </p>

            <h3>15.3 Class Action Waiver</h3>
            <p>
              YOU AGREE THAT ANY DISPUTE RESOLUTION PROCEEDINGS WILL BE CONDUCTED ONLY ON AN INDIVIDUAL BASIS AND NOT 
              IN A CLASS, CONSOLIDATED, OR REPRESENTATIVE ACTION. You waive any right to participate in a class action 
              lawsuit or class-wide arbitration.
            </p>

            <h3>15.4 Exceptions</h3>
            <p>
              Notwithstanding the above, either party may seek injunctive or equitable relief in a court of competent 
              jurisdiction to protect intellectual property rights or prevent irreparable harm.
            </p>

            <h2>16. General Provisions</h2>

            <h3>16.1 Governing Law</h3>
            <p>
              These Terms are governed by the laws of the State of Georgia, without regard to its conflict of 
              laws principles.
            </p>

            <h3>16.2 Entire Agreement</h3>
            <p>
              These Terms, together with our Privacy Policy and any other agreements expressly incorporated by 
              reference, constitute the entire agreement between you and VoiceAI Connect regarding the Service.
            </p>

            <h3>16.3 Severability</h3>
            <p>
              If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in 
              full force and effect.
            </p>

            <h3>16.4 Waiver</h3>
            <p>
              Our failure to enforce any right or provision of these Terms will not be considered a waiver of such 
              right or provision.
            </p>

            <h3>16.5 Assignment</h3>
            <p>
              You may not assign or transfer these Terms or your rights under them without our prior written consent. 
              We may assign these Terms without restriction.
            </p>

            <h3>16.6 Notices</h3>
            <p>
              We may provide notices to you via email to the address associated with your account or through the Service. 
              You may provide notices to us at support@myvoiceaiconnect.com.
            </p>

            <h3>16.7 Force Majeure</h3>
            <p>
              We will not be liable for any failure or delay in performance due to circumstances beyond our reasonable 
              control, including natural disasters, war, terrorism, labor disputes, government actions, or internet 
              or telecommunications failures.
            </p>

            <h2>17. Contact Information</h2>

            <p>If you have questions about these Terms, please contact us:</p>
            
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 my-6">
              <ul className="space-y-2 mb-0">
                <li><strong>Email:</strong> <a href="mailto:support@myvoiceaiconnect.com" className="text-emerald-400 hover:underline">support@myvoiceaiconnect.com</a></li>
                <li><strong>Privacy Inquiries:</strong> <a href="mailto:privacy@myvoiceaiconnect.com" className="text-emerald-400 hover:underline">privacy@myvoiceaiconnect.com</a></li>
                <li><strong>Mailing Address:</strong> VoiceAI Connect, Attn: Legal Team, 2855 Broome Rd, Gainesville, GA 30507</li>
              </ul>
            </div>

            <hr className="my-10 border-white/[0.08]" />

            <p className="text-sm text-[#fafaf9]/50">
              By using VoiceAI Connect, you acknowledge that you have read, understood, and agree to be bound by 
              these Terms of Service.
            </p>

          </div>
        </article>
      </main>

      {/* Footer */}
      <footer className="relative border-t border-white/[0.06] py-12 px-4 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <a href={MARKETING_URL} className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center">
                <WaveformIcon className="w-4 h-4 text-[#fafaf9]" />
              </div>
              <span className="text-sm font-medium">VoiceAI Connect</span>
            </a>
            <div className="flex items-center gap-6 text-sm text-[#fafaf9]/40">
              <Link href="/terms" className="hover:text-[#fafaf9] transition-colors">Terms of Service</Link>
              <Link href="/privacy" className="hover:text-[#fafaf9] transition-colors">Privacy Policy</Link>
            </div>
            <p className="text-sm text-[#fafaf9]/30">© 2026 VoiceAI Connect</p>
          </div>
        </div>
      </footer>
    </div>
  );
}