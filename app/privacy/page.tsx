// app/privacy/page.tsx
// 
// VoiceAI Connect Privacy Policy
// Last Updated: January 2025
// 
// Covers: GDPR, CCPA/CPRA, TCPA, call recording consent, voice data, 
// white-label platform specifics, Stripe payments, data retention

import Link from 'next/link';

// Main marketing site URL - used for logo/home links
const MARKETING_URL = 'https://voiceaiconnect.com';

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
  title: 'Privacy Policy | VoiceAI Connect',
  description: 'VoiceAI Connect Privacy Policy. Learn how we collect, use, and protect your data.',
};

export default function PrivacyPolicy() {
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
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Privacy Policy</h1>
            <p className="mt-4 text-[#fafaf9]/60">
              Last Updated: January 20, 2025
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
              VoiceAI Connect (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) is committed to protecting your privacy. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use 
              our white-label AI receptionist platform and related services (collectively, the &ldquo;Service&rdquo;).
            </p>

            <p>
              By accessing or using our Service, you agree to this Privacy Policy. If you do not agree with the terms 
              of this Privacy Policy, please do not access the Service.
            </p>

            <h2>1. Who This Policy Applies To</h2>
            
            <p>This Privacy Policy applies to:</p>
            
            <ul>
              <li><strong>Agency Users:</strong> Businesses and individuals who subscribe to VoiceAI Connect to create and manage AI receptionist services under their own brand.</li>
              <li><strong>End Clients:</strong> The customers of our Agency Users who use the AI receptionist services.</li>
              <li><strong>Callers:</strong> Individuals who interact with AI receptionists powered by our platform.</li>
              <li><strong>Website Visitors:</strong> Anyone who visits our website.</li>
            </ul>

            <h2>2. Information We Collect</h2>

            <h3>2.1 Information You Provide Directly</h3>
            
            <p>We collect information you voluntarily provide when you:</p>
            
            <ul>
              <li><strong>Create an account:</strong> Name, email address, company name, phone number, and password.</li>
              <li><strong>Subscribe to our Service:</strong> Billing address, payment method details (processed securely by Stripe), and business information.</li>
              <li><strong>Configure your AI receptionist:</strong> Business name, greeting scripts, frequently asked questions, business hours, and service descriptions.</li>
              <li><strong>Contact support:</strong> Any information you provide in support requests or communications.</li>
            </ul>

            <h3>2.2 Voice and Call Data</h3>
            
            <p>
              <strong>Important:</strong> Our Service processes telephone calls using AI technology. When calls are made to 
              phone numbers connected to our Service, we collect and process:
            </p>
            
            <ul>
              <li><strong>Call recordings:</strong> Audio recordings of conversations between callers and the AI receptionist.</li>
              <li><strong>Call transcripts:</strong> Text transcriptions of call audio.</li>
              <li><strong>Call metadata:</strong> Phone numbers (caller and recipient), call duration, timestamps, and call disposition.</li>
              <li><strong>Caller information:</strong> Any information voluntarily provided by callers during the conversation (e.g., name, contact details, appointment requests).</li>
            </ul>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5 my-6">
              <p className="text-amber-200 font-semibold mb-2">Call Recording Notice</p>
              <p className="text-[#fafaf9]/70 text-sm mb-0">
                Our AI receptionists are configured to inform callers that they are speaking with an AI assistant and that 
                the call may be recorded. This disclosure complies with FCC regulations and state call recording laws. 
                Agency Users are responsible for ensuring their use of call recordings complies with applicable laws in 
                their jurisdiction.
              </p>
            </div>

            <h3>2.3 Information Collected Automatically</h3>
            
            <p>When you access our Service, we automatically collect:</p>
            
            <ul>
              <li><strong>Device information:</strong> IP address, browser type, operating system, and device identifiers.</li>
              <li><strong>Usage data:</strong> Pages viewed, features used, time spent on the Service, and navigation patterns.</li>
              <li><strong>Cookies and similar technologies:</strong> We use cookies, pixels, and similar technologies to enhance your experience and collect analytics data.</li>
            </ul>

            <h3>2.4 Information from Third Parties</h3>
            
            <p>We may receive information from:</p>
            
            <ul>
              <li><strong>Payment processors:</strong> Stripe provides us with limited transaction information (we do not store full payment card details).</li>
              <li><strong>Integration partners:</strong> If you connect third-party services (e.g., Google Calendar, CRM systems), we receive data necessary to provide the integration.</li>
              <li><strong>Telephony providers:</strong> Our telephony partners provide call routing and metadata.</li>
            </ul>

            <h2>3. How We Use Your Information</h2>
            
            <p>We use the information we collect to:</p>
            
            <ul>
              <li>Provide, operate, and maintain our Service</li>
              <li>Process transactions and send related information (confirmations, invoices)</li>
              <li>Create and manage user accounts</li>
              <li>Power AI receptionist conversations and generate call transcripts</li>
              <li>Send notifications about calls, appointments, and service updates</li>
              <li>Respond to customer service requests and support needs</li>
              <li>Improve and personalize the Service</li>
              <li>Analyze usage patterns and optimize performance</li>
              <li>Detect, prevent, and address technical issues, fraud, or security concerns</li>
              <li>Comply with legal obligations</li>
              <li>Send marketing communications (with your consent, where required)</li>
            </ul>

            <h3>3.1 AI Training and Improvement</h3>
            
            <p>
              We may use aggregated and de-identified call data to improve our AI models and Service quality. 
              This data is stripped of personally identifiable information and cannot be used to identify individual 
              callers or businesses. Agency Users can opt out of having their data used for AI improvement by 
              contacting us at privacy@voiceaiconnect.com.
            </p>

            <h2>4. Legal Basis for Processing (GDPR)</h2>
            
            <p>For users in the European Economic Area (EEA) and United Kingdom, we process personal data based on:</p>
            
            <ul>
              <li><strong>Contract performance:</strong> Processing necessary to provide our Service to you.</li>
              <li><strong>Legitimate interests:</strong> Processing for our legitimate business interests, such as improving our Service, preventing fraud, and marketing (where not overridden by your rights).</li>
              <li><strong>Consent:</strong> Where you have given explicit consent (e.g., for marketing emails).</li>
              <li><strong>Legal obligation:</strong> Processing necessary to comply with applicable laws.</li>
            </ul>

            <h2>5. How We Share Your Information</h2>
            
            <p>We may share your information with:</p>

            <h3>5.1 Service Providers</h3>
            <p>
              Third-party vendors who perform services on our behalf, including cloud hosting (Vercel, AWS), 
              payment processing (Stripe), telephony services (Twilio/VAPI), email delivery, and analytics providers. 
              These providers are contractually obligated to protect your data and use it only for the services they provide to us.
            </p>

            <h3>5.2 Agency Users and Their Clients</h3>
            <p>
              If you are a caller, your call data (recordings, transcripts, information you provide) is shared with 
              the Agency User whose AI receptionist you interacted with, and may be shared with their end client 
              (the business the AI receptionist represents).
            </p>

            <h3>5.3 Business Transfers</h3>
            <p>
              In connection with a merger, acquisition, bankruptcy, or sale of assets, your information may be 
              transferred to the acquiring entity. We will notify you of any such change.
            </p>

            <h3>5.4 Legal Requirements</h3>
            <p>
              We may disclose your information if required by law, regulation, legal process, or governmental request, 
              or to protect the rights, property, or safety of VoiceAI Connect, our users, or others.
            </p>

            <h3>5.5 With Your Consent</h3>
            <p>We may share your information for other purposes with your explicit consent.</p>

            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5 my-6">
              <p className="text-emerald-400 font-semibold mb-2">We Do Not Sell Your Personal Information</p>
              <p className="text-[#fafaf9]/70 text-sm mb-0">
                VoiceAI Connect does not sell, rent, or trade your personal information to third parties for their 
                marketing purposes. We do not &ldquo;sell&rdquo; or &ldquo;share&rdquo; personal information as defined under the 
                California Consumer Privacy Act (CCPA/CPRA).
              </p>
            </div>

            <h2>6. Data Retention</h2>
            
            <p>We retain your information for as long as necessary to:</p>
            
            <ul>
              <li>Provide our Service to you</li>
              <li>Comply with legal obligations (e.g., tax records, legal holds)</li>
              <li>Resolve disputes and enforce agreements</li>
            </ul>

            <p>Specific retention periods:</p>
            
            <ul>
              <li><strong>Account data:</strong> Retained while your account is active and for 30 days after deletion request.</li>
              <li><strong>Call recordings and transcripts:</strong> Retained for 90 days by default. Agency Users can configure shorter retention periods or request immediate deletion.</li>
              <li><strong>Billing records:</strong> Retained for 7 years to comply with tax and accounting requirements.</li>
              <li><strong>Analytics data:</strong> Aggregated analytics retained indefinitely; individual-level analytics retained for 26 months.</li>
            </ul>

            <h2>7. Your Privacy Rights</h2>

            <h3>7.1 All Users</h3>
            <p>Regardless of your location, you have the right to:</p>
            <ul>
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Delete your account and associated data</li>
              <li>Opt out of marketing communications</li>
              <li>Request a copy of your data in a portable format</li>
            </ul>

            <h3>7.2 California Residents (CCPA/CPRA)</h3>
            <p>If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA) and California Privacy Rights Act (CPRA):</p>
            <ul>
              <li><strong>Right to Know:</strong> Request disclosure of the categories and specific pieces of personal information we have collected about you.</li>
              <li><strong>Right to Delete:</strong> Request deletion of your personal information, subject to certain exceptions.</li>
              <li><strong>Right to Correct:</strong> Request correction of inaccurate personal information.</li>
              <li><strong>Right to Opt-Out:</strong> Opt out of the sale or sharing of personal information (note: we do not sell personal information).</li>
              <li><strong>Right to Limit Use of Sensitive Personal Information:</strong> Limit our use of sensitive personal information to what is necessary to provide the Service.</li>
              <li><strong>Right to Non-Discrimination:</strong> We will not discriminate against you for exercising your privacy rights.</li>
            </ul>
            <p>
              To exercise these rights, contact us at privacy@voiceaiconnect.com or use the &ldquo;Privacy Requests&rdquo; section in your account settings. 
              We will respond to verified requests within 45 days.
            </p>

            <h3>7.3 European Economic Area and UK Residents (GDPR)</h3>
            <p>If you are in the EEA or UK, you have rights under the General Data Protection Regulation (GDPR):</p>
            <ul>
              <li><strong>Right of Access:</strong> Obtain confirmation of whether we process your data and request a copy.</li>
              <li><strong>Right to Rectification:</strong> Request correction of inaccurate or incomplete data.</li>
              <li><strong>Right to Erasure:</strong> Request deletion of your data in certain circumstances.</li>
              <li><strong>Right to Restriction:</strong> Request restriction of processing in certain circumstances.</li>
              <li><strong>Right to Data Portability:</strong> Receive your data in a structured, machine-readable format.</li>
              <li><strong>Right to Object:</strong> Object to processing based on legitimate interests or for direct marketing.</li>
              <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time where processing is based on consent.</li>
              <li><strong>Right to Lodge a Complaint:</strong> Lodge a complaint with a supervisory authority.</li>
            </ul>
            <p>
              Contact our Data Protection Officer at dpo@voiceaiconnect.com. For international data transfers from 
              the EEA/UK, we use Standard Contractual Clauses approved by the European Commission.
            </p>

            <h3>7.4 Other State Privacy Laws</h3>
            <p>
              We comply with applicable state privacy laws including the Virginia Consumer Data Protection Act (VCDPA), 
              Colorado Privacy Act (CPA), Connecticut Data Privacy Act (CTDPA), and other emerging state regulations. 
              Residents of these states may exercise similar rights by contacting us.
            </p>

            <h2>8. Data Security</h2>
            
            <p>
              We implement appropriate technical and organizational measures to protect your personal information, including:
            </p>
            
            <ul>
              <li>Encryption of data in transit (TLS 1.3) and at rest (AES-256)</li>
              <li>Secure cloud infrastructure with SOC 2 certified providers</li>
              <li>Access controls and authentication requirements</li>
              <li>Regular security assessments and monitoring</li>
              <li>Employee training on data protection</li>
              <li>Incident response procedures</li>
            </ul>
            
            <p>
              However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive 
              to protect your personal information, we cannot guarantee absolute security.
            </p>

            <h2>9. International Data Transfers</h2>
            
            <p>
              VoiceAI Connect is based in the United States. If you access our Service from outside the United States, 
              your information will be transferred to, stored, and processed in the United States. We ensure appropriate 
              safeguards are in place for international transfers, including Standard Contractual Clauses for transfers 
              from the EEA/UK.
            </p>

            <h2>10. Children&apos;s Privacy</h2>
            
            <p>
              Our Service is not directed to individuals under 18 years of age. We do not knowingly collect personal 
              information from children. If we learn we have collected personal information from a child under 18, 
              we will delete that information promptly. If you believe we have information from a child, please 
              contact us at privacy@voiceaiconnect.com.
            </p>

            <h2>11. Third-Party Links</h2>
            
            <p>
              Our Service may contain links to third-party websites or services. We are not responsible for the 
              privacy practices of these third parties. We encourage you to review the privacy policies of any 
              third-party sites you visit.
            </p>

            <h2>12. Cookies and Tracking Technologies</h2>
            
            <p>We use cookies and similar technologies for:</p>
            
            <ul>
              <li><strong>Essential cookies:</strong> Required for the Service to function (authentication, security).</li>
              <li><strong>Analytics cookies:</strong> Help us understand how visitors use our Service.</li>
              <li><strong>Preference cookies:</strong> Remember your settings and preferences.</li>
            </ul>
            
            <p>
              You can control cookies through your browser settings. Disabling certain cookies may affect Service functionality. 
              We honor Global Privacy Control (GPC) signals where required by law.
            </p>

            <h2>13. Do Not Track</h2>
            
            <p>
              Some browsers have a &ldquo;Do Not Track&rdquo; feature that signals to websites that you do not want your online 
              activity tracked. Our Service does not currently respond to DNT signals, but we do honor Global Privacy 
              Control (GPC) signals in jurisdictions where required.
            </p>

            <h2>14. Changes to This Privacy Policy</h2>
            
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material changes by posting 
              the updated policy on our website with a new &ldquo;Last Updated&rdquo; date, and for significant changes, by email 
              to Agency Users. Your continued use of the Service after changes constitutes acceptance of the updated policy.
            </p>

            <h2>15. Contact Us</h2>
            
            <p>If you have questions about this Privacy Policy or our privacy practices, please contact us:</p>
            
            <ul>
              <li><strong>Email:</strong> privacy@voiceaiconnect.com</li>
              <li><strong>Data Protection Officer:</strong> dpo@voiceaiconnect.com</li>
              <li><strong>Mailing Address:</strong> VoiceAI Connect, Attn: Privacy Team, 2855 Broome Rd. Gainesville GA</li>
            </ul>

            <p>
              For California residents, you may also contact us toll-free at [Phone Number] to exercise your CCPA/CPRA rights.
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
            <p className="text-sm text-[#fafaf9]/30">© 2025 VoiceAI Connect</p>
          </div>
        </div>
      </footer>
    </div>
  );
}