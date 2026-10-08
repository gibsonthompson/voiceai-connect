// ============================================================================
// CANONICAL LEGAL TEMPLATES (Terms of Service + Privacy Policy)
// ----------------------------------------------------------------------------
// The agency-facing legal editor edits a small set of FIELDS, never the page
// body, so the protective clauses (liability, indemnification, dispute
// resolution, IP, etc.) can never be removed. The page is always composed from
// the fixed template below with the agency's field values dropped into the
// variable slots. Variable slots, and nothing else, are editable:
//   {{SUPPORT_EMAIL}}       contact / support / cancellation email
//   {{AGENCY_NAME}}         legal / business name
//   {{PAYMENT_PROCESSOR}}   billing processor shown in the billing clauses
//   {{TRIAL_TERMS}}         free-trial wording (Terms 5.1)
//   {{REFUND_POLICY}}       refund wording (Terms 6.2)
// Plus auto values the agency never sets: {{EFFECTIVE_DATE}}, {{CURRENCY_SYMBOL}},
// {{LOWEST_PRICE}}.
// This module is the single source of truth, used by both the hosted page
// (components/LegalPage) and the editor (components/agency/LegalEditor).
// ============================================================================

export type LegalType = 'terms' | 'privacy';

// Fields an agency may customize. Everything else on the page is fixed.
export interface LegalFields {
  support_email?: string;
  business_name?: string;
  payment_processor?: string;
  trial_terms?: string;   // terms only
  refund_policy?: string; // terms only
}

export interface LegalAgencyFields {
  name?: string | null;
  support_email?: string | null;
  support_phone?: string | null;
  display_currency?: string | null;
  price_starter?: number | null;
  // connection flags used only to pick a sensible default payment processor
  stripe_charges_enabled?: boolean | null;
  paystack_connected?: boolean | null;
  flutterwave_connected?: boolean | null;
  // used only to derive a default contact email when none is set
  marketing_domain?: string | null;
  domain_verified?: boolean | null;
}

// ----------------------------------------------------------------------------
// Defaults for the editable fields (used when an agency has not customized).
// ----------------------------------------------------------------------------
export const DEFAULT_TRIAL_TERMS =
`Your subscription may begin with a free trial. Depending on your provider, a valid payment method may be required to start the trial. If a payment method is required, you will not be charged during the trial period, and at the end of the trial your payment method will be automatically charged the then-current monthly price for the plan you selected, unless you cancel before the trial ends. If no payment method is required to start the trial, your Service will pause at the end of the trial until you choose a plan and provide payment.

Paid subscriptions renew automatically each month at the then-current price until you cancel. You may cancel at any time before your next billing date to avoid further charges. Cancellation takes effect at the end of the current billing period, and you retain access until then.`;

export const DEFAULT_REFUND_POLICY =
`If you cancel within the first 30 days of your paid subscription, you are eligible for a full refund. After 30 days, no refunds are issued for partial billing periods.`;

// A couple of ready-made refund presets the editor offers.
export const REFUND_PRESETS: { key: string; label: string; text: string }[] = [
  { key: 'money_back_30', label: '30-day money-back guarantee', text: DEFAULT_REFUND_POLICY },
  { key: 'non_refundable', label: 'Non-refundable', text: 'Payments are non-refundable. No refunds are issued for partially used months, except where required by law. You may cancel before your next billing date, and service continues through your paid period.' },
];

// Fields shown per document, in order.
export const LEGAL_FIELD_SCHEMA: Record<LegalType, Array<{
  key: keyof LegalFields;
  label: string;
  help: string;
  kind: 'email' | 'text' | 'longtext' | 'refund';
}>> = {
  terms: [
    { key: 'support_email', label: 'Contact email', help: 'Shown wherever the page says to contact or cancel. Fills every email reference.', kind: 'email' },
    { key: 'business_name', label: 'Legal / business name', help: 'The entity named throughout the document. Defaults to your agency name.', kind: 'text' },
    { key: 'payment_processor', label: 'Payment processor', help: 'Named in the billing section. Defaults to the provider you have connected.', kind: 'text' },
    { key: 'trial_terms', label: 'Free trial terms', help: 'The free-trial paragraph (Section 5).', kind: 'longtext' },
    { key: 'refund_policy', label: 'Refund policy', help: 'The refund paragraph (Section 6).', kind: 'refund' },
  ],
  privacy: [
    { key: 'support_email', label: 'Contact email', help: 'Shown wherever the page says to contact you or exercise data rights. Fills every email reference.', kind: 'email' },
    { key: 'business_name', label: 'Legal / business name', help: 'The entity named throughout the document. Defaults to your agency name.', kind: 'text' },
    { key: 'payment_processor', label: 'Payment processor', help: 'Named in the data-sharing section. Defaults to the provider you have connected.', kind: 'text' },
  ],
};

export function defaultPaymentProcessor(agency: LegalAgencyFields): string {
  if (agency.flutterwave_connected) return 'Flutterwave';
  if (agency.paystack_connected) return 'Paystack';
  return 'Stripe';
}

// Default contact email when an agency has not set one. Stays on the AGENCY's
// own brand, never the platform: the agency's support email if present, else
// info@ their verified custom domain, else info@<their-name>.com. The platform
// (VoiceAI Connect) is never named on an agency's legal pages.
export function defaultLegalEmail(agency: LegalAgencyFields): string {
  if (agency.support_email && agency.support_email.trim()) return agency.support_email.trim();
  const domain = (agency.marketing_domain && agency.domain_verified)
    ? String(agency.marketing_domain).replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '').trim()
    : '';
  if (domain) return `info@${domain}`;
  const slug = (agency.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 63);
  return slug ? `info@${slug}.com` : 'info@yourcompany.com';
}

// ----------------------------------------------------------------------------
// TEMPLATES (ported verbatim from the live policies, with the five variable
// slots inserted). Do not remove protective sections here.
// ----------------------------------------------------------------------------
export const TERMS_TEMPLATE =
`# Terms of Service

**Last Updated: {{EFFECTIVE_DATE}}**

These Terms of Service ("Terms") govern your access to and use of the AI-powered phone receptionist service (the "Service") provided by {{AGENCY_NAME}} ("we," "us," or "our"). By creating an account or using the Service, you agree to these Terms. If you do not agree, do not use the Service.

---

## 1. Eligibility

You must be at least 18 years old to use the Service. By using the Service, you represent that you are at least 18 years old and have the legal authority to enter into these Terms on behalf of yourself or the business entity you represent.

---

## 2. Description of Service

{{AGENCY_NAME}} provides an AI-powered phone receptionist that:

- **Answers incoming calls** to your dedicated AI phone number using artificial intelligence.
- **Takes messages** and collects caller information (name, phone number, reason for calling).
- **Books appointments** by checking your connected calendar for availability and scheduling on your behalf.
- **Sends SMS notifications** with call summaries after each call.
- **Records and transcribes calls** so you can review conversations in your dashboard.
- **Transfers calls** to you or your staff based on rules you configure.
- **Detects and blocks spam** calls automatically.

The AI receptionist is not a human. It is an automated system designed to handle calls professionally on your behalf. The AI speaks English and Spanish and automatically detects the caller's language.

---

## 3. AI Limitations and Disclaimers

You acknowledge and agree that:

- **AI Is Not Perfect.** The AI may misunderstand callers, produce inaccurate transcriptions, or generate incomplete summaries. You are responsible for reviewing AI output before taking action.
- **No Professional Advice.** The AI does not provide legal, medical, financial, tax, or other professional advice. It processes calls based on the information you provide in your business configuration.
- **No Guaranteed Outcomes.** We do not guarantee that the AI will capture every lead, book every appointment correctly, or satisfy every caller. AI performance varies based on call quality, caller speech patterns, and complexity of requests.
- **Continuous Improvement.** The AI system may be updated to improve accuracy and features. These updates may change how the AI responds to certain situations.
- **Not an Emergency Service.** The Service is not a substitute for emergency services. If a caller reports an emergency, the AI will attempt to transfer the call or advise the caller to call 911, but this is not guaranteed.

---

## 4. Your Account

### 4.1 Registration
You must provide accurate, current, and complete information when creating your account. You agree to update your information promptly if it changes.

### 4.2 Security
You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account. Notify us immediately at {{SUPPORT_EMAIL}} if you suspect unauthorized access.

### 4.3 One Account Per Business
Each account is intended for a single business location. If you operate multiple locations, each requires a separate account.

---

## 5. Free Trial and Billing

### 5.1 Free Trial, Billing, and Automatic Renewal
{{TRIAL_TERMS}}

### 5.2 Subscription Plans
After the trial, continued use requires a paid subscription. Current pricing is available on our website. Plans start at {{CURRENCY_SYMBOL}}{{LOWEST_PRICE}}/month.

### 5.3 Billing
Subscriptions are billed monthly in advance. Payment is processed through {{PAYMENT_PROCESSOR}}. You authorize us to charge your payment method on file for each billing cycle.

### 5.4 Failed Payments
If a payment fails, we will attempt to process it again. If payment continues to fail, your Service may be suspended until the balance is resolved. Your AI phone number may be released after 30 days of non-payment.

### 5.5 Price Changes
We may change subscription pricing with at least 30 days' advance notice. Price changes take effect at the start of your next billing cycle after the notice period. If you do not agree to a price change, you may cancel before it takes effect.

---

## 6. Cancellation and Refunds

### 6.1 How to Cancel
You may cancel your subscription at any time from your dashboard or by contacting us at {{SUPPORT_EMAIL}}. Cancellation takes effect at the end of your current billing period. You will continue to have access until then.

### 6.2 Refunds
{{REFUND_POLICY}}

### 6.3 Effect of Cancellation
Upon cancellation:
- Your AI phone number will be released and may be reassigned.
- Call recordings, transcripts, and account data will be retained for 30 days, then permanently deleted unless you request earlier deletion.
- Any outstanding balance remains due.

### 6.4 Reactivation
If you wish to reactivate your account within 30 days of cancellation, contact us and we will attempt to restore your data and phone number (subject to availability).

---

## 7. Call Recording

### 7.1 Consent
By using the Service, you agree that all calls handled by the AI receptionist will be recorded and transcribed. The AI discloses this to callers at the start of each call.

### 7.2 Your Responsibility
You are responsible for ensuring that call recording complies with all applicable federal and state laws in your jurisdiction, including two-party consent states. You agree not to use the Service in any manner that violates recording consent laws.

### 7.3 Ownership
You own the call recordings and transcripts generated by the Service for your business. We retain a license to process, store, and transmit this data as necessary to provide the Service.

### 7.4 HIPAA
If you are a healthcare provider or handle protected health information (PHI), you must enable HIPAA mode in your settings (if available on your plan). Standard accounts are not HIPAA-compliant. Contact us at {{SUPPORT_EMAIL}} for information about HIPAA-eligible plans.

---

## 8. Acceptable Use

You agree not to use the Service to:

- Violate any applicable law or regulation.
- Harass, abuse, threaten, or intimidate any person.
- Record calls in violation of applicable consent laws.
- Misrepresent the AI as a human with the intent to defraud or deceive.
- Send spam, unsolicited messages, or bulk communications.
- Interfere with or disrupt the Service or its infrastructure.
- Attempt to reverse-engineer, decompile, or extract the source code of the AI.
- Use the Service for any illegal purpose, including illegal telemarketing.
- Circumvent any security measures or access controls.

We reserve the right to suspend or terminate your account for violations of this section without notice.

---

## 9. Intellectual Property

### 9.1 Our Property
The Service, including the AI technology, software, dashboard, website, documentation, and all related intellectual property, is owned by us or our licensors. You receive a limited, non-exclusive, non-transferable license to use the Service during your subscription.

### 9.2 Your Content
You retain ownership of your business information, call recordings, and other content you provide through the Service. You grant us a limited license to use, process, and store this content solely to provide the Service.

### 9.3 Feedback
If you provide suggestions, ideas, or feedback about the Service, you grant us the right to use that feedback without obligation to you.

---

## 10. Limitation of Liability

TO THE MAXIMUM EXTENT PERMITTED BY LAW:

- **WE ARE NOT LIABLE** for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, revenue, data, or business opportunities.
- **WE ARE NOT LIABLE** for missed calls, dropped calls, or call quality issues caused by network conditions, caller equipment, or third-party services.
- **WE ARE NOT LIABLE** for errors in AI-generated transcriptions, summaries, or responses.
- **WE ARE NOT LIABLE** for appointments booked incorrectly by the AI.
- **WE ARE NOT LIABLE** for actions taken by you or third parties based on AI-generated information.
- **OUR TOTAL LIABILITY** for any claims arising from or related to the Service is limited to the amount you paid us in the 12 months preceding the claim.

---

## 11. Indemnification

You agree to indemnify, defend, and hold harmless {{AGENCY_NAME}} and its officers, employees, agents, and affiliates from any claims, damages, losses, liabilities, and expenses (including reasonable attorneys' fees) arising from:

- Your use of the Service.
- Your violation of these Terms.
- Your violation of any law, including call recording consent laws.
- Any third-party claim related to your business or use of the Service.
- Any content you provide through the Service.

---

## 12. Service Availability

We strive to provide reliable, 24/7 service. However:

- **No Guaranteed Uptime.** We do not guarantee 100% uptime. The Service may be temporarily unavailable due to maintenance, updates, or circumstances beyond our control.
- **Scheduled Maintenance.** We will provide advance notice when possible for planned maintenance windows.
- **Force Majeure.** We are not liable for service interruptions caused by events beyond our reasonable control, including natural disasters, power outages, internet disruptions, cyberattacks, or government actions.

---

## 13. Termination

### 13.1 By You
You may terminate your account at any time by cancelling your subscription as described in Section 6.

### 13.2 By Us
We may suspend or terminate your account at any time if:
- You violate these Terms.
- Your payment fails and is not resolved within 30 days.
- We reasonably believe your use of the Service is fraudulent or harmful.
- We discontinue the Service (with at least 30 days' notice).

### 13.3 Effect of Termination
Upon termination, your right to use the Service ceases immediately. Sections 9, 10, 11, and 14 survive termination.

---

## 14. Dispute Resolution

### 14.1 Informal Resolution
Before filing any formal claim, you agree to contact us at {{SUPPORT_EMAIL}} and attempt to resolve the dispute informally for at least 30 days.

### 14.2 Governing Law
These Terms are governed by the laws of the state in which {{AGENCY_NAME}} is headquartered, without regard to conflict of law principles.

### 14.3 Arbitration
Any dispute that cannot be resolved informally shall be resolved by binding arbitration administered by the American Arbitration Association under its Commercial Arbitration Rules. The arbitration will be conducted in English and the arbitrator's decision will be final and binding.

### 14.4 Class Action Waiver
You agree to resolve disputes with us on an individual basis. You waive any right to participate in a class action lawsuit or class-wide arbitration.

### 14.5 Small Claims Exception
Either party may bring a claim in small claims court if the claim qualifies.

---

## 15. Changes to These Terms

We may update these Terms from time to time. When we make material changes, we will:
- Post the updated Terms on our website with a new "Last Updated" date.
- Notify you by email at least 15 days before the changes take effect.

Your continued use of the Service after the effective date constitutes acceptance of the updated Terms. If you do not agree to the changes, you must stop using the Service and cancel your account.

---

## 16. General Provisions

- **Entire Agreement.** These Terms, together with our Privacy Policy, constitute the entire agreement between you and {{AGENCY_NAME}} regarding the Service.
- **Severability.** If any provision of these Terms is found to be unenforceable, the remaining provisions remain in full force and effect.
- **No Waiver.** Our failure to enforce any provision of these Terms does not constitute a waiver of that provision.
- **Assignment.** You may not assign or transfer your rights under these Terms. We may assign our rights without restriction.
- **Notices.** We may send notices to you by email or through the Service. You may send notices to us at {{SUPPORT_EMAIL}}.

---

## 17. Contact Us

If you have questions about these Terms, please contact us:

**{{AGENCY_NAME}}**
Email: {{SUPPORT_EMAIL}}

## Telecommunications, Recording, and Lawful Use

You are solely responsible for ensuring that your use of the Service complies with all applicable federal, state, and local laws. This includes, without limitation:

- **AI disclosure.** Many jurisdictions require that callers be told they are interacting with an automated or AI system. The Service is configured to identify itself as an AI assistant at the start of each call, and you agree not to disable, suppress, or circumvent this disclosure.
- **Call recording consent.** The Service may record calls to provide transcripts and summaries. Recording-consent laws vary by jurisdiction, and several states (including California, Connecticut, Florida, Illinois, Maryland, Massachusetts, Montana, Nevada, New Hampshire, Pennsylvania, and Washington) require the consent of all parties. You are responsible for ensuring callers are properly notified and, where required, consent to recording.
- **TCPA and outbound contact.** You agree not to use the Service to place unlawful telemarketing calls, robocalls, or text messages, to contact numbers on any Do Not Call registry for marketing without consent, or otherwise to violate the Telephone Consumer Protection Act (TCPA) or its state equivalents.
- **Healthcare and sensitive data.** The Service is not configured or intended to process protected health information (PHI) under HIPAA, payment card data, or similar regulated information unless a separate written agreement (such as a Business Associate Agreement) is in place. You must not use the Service for such purposes absent that agreement.

You represent and warrant that you have obtained all rights, permissions, and consents necessary for the calls, recordings, messages, and data you process through the Service. You agree to indemnify and hold us harmless from any claims, damages, fines, or penalties arising from your violation of these laws.`;

export const PRIVACY_TEMPLATE =
`# Privacy Policy

**Last Updated: {{EFFECTIVE_DATE}}**

{{AGENCY_NAME}} ("we," "us," or "our") provides an AI-powered phone receptionist service (the "Service"). This Privacy Policy describes how we collect, use, disclose, and protect information when you use our Service, visit our website, or interact with us.

By using our Service, you agree to the collection and use of information as described in this policy. If you do not agree, please do not use the Service.

---

## 1. Information We Collect

### 1.1 Information You Provide
- **Account Information:** Name, email address, phone number, business name, business address, industry, and billing details when you create an account.
- **Business Configuration:** Services offered, business hours, staff member names and contact information, knowledge base content, greeting messages, and voice preferences.
- **Payment Information:** Credit card or payment method details processed securely by our third-party payment processor ({{PAYMENT_PROCESSOR}}). We do not store full payment card numbers on our servers.
- **Communications:** Emails, support requests, and feedback you send us.

### 1.2 Information Collected Automatically During Calls
- **Call Recordings:** Audio recordings of all calls handled by the AI receptionist. Callers are notified at the start of each call that the call may be recorded.
- **Call Transcripts:** Automated text transcriptions of call recordings generated by speech-to-text technology.
- **AI-Generated Summaries:** Summaries of call content created by artificial intelligence, including caller name, phone number, reason for calling, and any appointment requests.
- **Call Metadata:** Date, time, duration, caller phone number (caller ID), call direction, and call outcome (e.g., message taken, appointment booked, call transferred).

### 1.3 Information Collected Through the Dashboard and Website
- **Usage Data:** Pages visited, features used, login times, device type, browser type, and operating system.
- **IP Address:** Collected for security, fraud prevention, and approximate geolocation.
- **Cookies and Similar Technologies:** Session cookies for authentication, preference cookies for settings, and analytics cookies to understand usage patterns. See Section 9 for details.

### 1.4 Information from Third-Party Integrations
- **Google Calendar:** When you connect Google Calendar, we access your calendar availability to enable appointment booking. We do not read, modify, or store unrelated calendar events.
- **SMS Providers:** Phone numbers and message content for sending call notification texts.

---

## 2. How We Use Your Information

We use the information we collect for the following purposes:

- **Providing the Service:** Answering calls via AI, generating transcripts and summaries, booking appointments, sending SMS notifications, and displaying call data on your dashboard.
- **Account Management:** Creating and maintaining your account, processing payments, and communicating with you about your subscription.
- **Service Improvement:** Analyzing aggregate usage patterns to improve the AI receptionist's accuracy, reliability, and features. We do not use your individual call recordings or transcripts to train AI models.
- **Security and Fraud Prevention:** Detecting spam calls, preventing abuse, and protecting the integrity of the Service.
- **Legal Compliance:** Responding to legal requests and complying with applicable laws and regulations.
- **Customer Support:** Responding to your inquiries and resolving issues.

**We do not sell, rent, or trade your personal information to third parties for their marketing purposes.**

---

## 3. AI Disclosure

Our Service uses artificial intelligence to answer phone calls on your behalf. Please be aware of the following:

- **AI, Not Human:** Calls are answered by an AI system, not a human receptionist. The AI is designed to sound natural but is not a real person.
- **AI Disclosure to Callers:** The AI greeting includes a disclosure that the call may be recorded. In jurisdictions requiring AI disclosure (including California under AB 2905 and Texas under TRAIGA), the AI identifies itself as an automated system.
- **Accuracy Limitations:** AI-generated transcripts, summaries, and responses may contain errors. Transcriptions may not capture every word accurately, and summaries may omit or misrepresent details. You are responsible for reviewing AI output before taking action based on it.
- **No Professional Advice:** The AI does not provide legal, medical, financial, or other professional advice. It relays information and takes messages based on your business configuration.

---

## 4. Call Recording and Consent

### 4.1 Recording Disclosure
All calls handled by the AI receptionist are recorded and transcribed. The AI greeting informs callers that the call may be recorded for quality and training purposes. By continuing the call after this disclosure, the caller provides implied consent to recording.

### 4.2 Two-Party Consent Compliance
We operate under a universal disclosure policy: every call includes a recording disclosure regardless of the caller's location. This ensures compliance with all-party consent states, including California, Connecticut, Delaware, Florida, Illinois, Maryland, Massachusetts, Montana, Nevada, New Hampshire, Pennsylvania, and Washington.

### 4.3 Your Responsibilities
As the business owner, you are responsible for ensuring that call recording complies with all applicable laws in your jurisdiction. If your jurisdiction requires additional disclosures beyond what the AI provides, you should configure your greeting message accordingly.

---

## 5. Data Sharing and Third Parties

We share information with the following categories of third parties solely to provide and improve the Service:

| Category | Purpose | Data Shared |
|----------|---------|-------------|
| Voice AI Processing | Powering the AI receptionist | Call audio, business configuration |
| Speech-to-Text | Generating call transcripts | Call audio |
| AI Language Processing | Generating summaries and responses | Call transcripts, business knowledge base |
| Telephony Infrastructure | Making and receiving calls, sending SMS | Phone numbers, call data, SMS content |
| Payment Processing | Subscription billing | Billing details (processed by {{PAYMENT_PROCESSOR}}) |
| Calendar Integration | Booking appointments | Calendar availability, appointment details |
| Cloud Hosting | Storing data securely | All service data (encrypted) |

We require all third-party service providers to maintain appropriate security measures and to process data only as instructed by us.

We may also disclose information:
- To comply with legal obligations, court orders, or government requests.
- To protect the rights, safety, or property of {{AGENCY_NAME}}, our users, or the public.
- In connection with a merger, acquisition, or sale of assets (with notice to affected users).

---

## 6. Data Retention

- **Call Recordings:** Retained for the duration of your active subscription plus 30 days after cancellation, unless you request earlier deletion.
- **Call Transcripts and Summaries:** Retained for the duration of your active subscription plus 30 days after cancellation.
- **Account Information:** Retained for as long as your account is active, plus up to 90 days after deletion to allow for reactivation.
- **Billing Records:** Retained for up to 7 years as required by tax and accounting regulations.
- **Usage Analytics:** Retained in aggregate, anonymized form indefinitely.

You may request deletion of your call recordings and transcripts at any time by contacting us at {{SUPPORT_EMAIL}}.

---

## 7. Your Rights

Depending on your location, you may have the following rights regarding your personal information:

### 7.1 All Users
- **Access:** Request a copy of the personal information we hold about you.
- **Correction:** Request correction of inaccurate or incomplete information.
- **Deletion:** Request deletion of your personal information, subject to legal retention requirements.
- **Opt-Out of Marketing:** Unsubscribe from marketing communications at any time.

### 7.2 California Residents (CCPA/CPRA)
California residents have additional rights under the California Consumer Privacy Act:
- **Right to Know:** What personal information we collect, use, and disclose.
- **Right to Delete:** Request deletion of personal information, with certain exceptions.
- **Right to Opt-Out of Sale:** We do not sell personal information, so this right does not apply.
- **Right to Non-Discrimination:** We will not discriminate against you for exercising your rights.

To exercise your CCPA rights, contact us at {{SUPPORT_EMAIL}} or call us. We will respond within 45 days.

### 7.3 European Residents (GDPR)
If you are located in the European Economic Area, you have additional rights:
- **Right to Portability:** Receive your data in a structured, machine-readable format.
- **Right to Restrict Processing:** Request that we limit how we use your data.
- **Right to Object:** Object to processing based on legitimate interests.
- **Right to Lodge a Complaint:** With your local data protection authority.

### 7.4 Other State Privacy Laws
Residents of Colorado, Connecticut, Virginia, Utah, Texas, Oregon, Montana, and other states with comprehensive privacy laws may have similar rights. Contact us at {{SUPPORT_EMAIL}} to exercise any applicable rights.

---

## 8. Data Security

We implement industry-standard security measures to protect your information:

- **Encryption:** Data is encrypted in transit (TLS 1.2+) and at rest (AES-256).
- **Access Controls:** Access to personal data is restricted to authorized personnel on a need-to-know basis.
- **Infrastructure:** We use enterprise-grade cloud hosting with SOC 2 compliance.
- **Monitoring:** We monitor for unauthorized access and security incidents.
- **Incident Response:** We maintain a breach response plan and will notify affected users within 72 hours of discovering a breach, as required by applicable law.

No method of transmission or storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.

---

## 9. Cookies

Our website and dashboard use the following types of cookies:

- **Essential Cookies:** Required for authentication, security, and basic functionality. Cannot be disabled.
- **Preference Cookies:** Remember your settings and preferences (e.g., theme, language).
- **Analytics Cookies:** Help us understand how you use the Service so we can improve it. These may be provided by third-party analytics services.

You can control cookies through your browser settings. Disabling essential cookies may prevent you from using certain features.

---

## 10. SMS Communications

As part of the Service, we send SMS messages to notify you about calls. By using the Service, you consent to receiving these messages:

- **Call Notifications:** Summaries sent after each call, including caller details and AI summary.
- **Account Alerts:** Subscription reminders, trial expiration notices, and security alerts.

Message frequency varies based on call volume. Standard message and data rates may apply. You may opt out of non-essential SMS at any time by replying STOP or adjusting your notification settings.

---

## 11. Children's Privacy

Our Service is not directed to children under 13 years of age. We do not knowingly collect personal information from children under 13. If we become aware that we have collected information from a child under 13, we will delete it promptly. If you believe a child has provided us with personal information, please contact us at {{SUPPORT_EMAIL}}.

---

## 12. International Data Transfers

If you are located outside the United States, your information may be transferred to and processed in the United States, where our servers and service providers are located. By using the Service, you consent to this transfer. We take appropriate safeguards to ensure your data is protected in accordance with this Privacy Policy.

---

## 13. Changes to This Privacy Policy

We may update this Privacy Policy from time to time. When we make material changes, we will notify you by email or by posting a notice on our website. Your continued use of the Service after the effective date of the updated policy constitutes your acceptance of the changes.

---

## 14. Contact Us

If you have questions about this Privacy Policy or wish to exercise your data rights, please contact us:

**{{AGENCY_NAME}}**
Email: {{SUPPORT_EMAIL}}`;

const TEMPLATES: Record<LegalType, string> = { terms: TERMS_TEMPLATE, privacy: PRIVACY_TEMPLATE };

// Build the final markdown for a document: fixed template + the agency's field
// values (falling back to sensible defaults). Protective sections are part of
// the template and are always present.
export function composeLegalDoc(type: LegalType, fields: LegalFields | null | undefined, agency: LegalAgencyFields): string {
  const f = fields || {};
  const cs = agency.display_currency === 'GBP' ? '£' : agency.display_currency === 'EUR' ? '€' : '$';
  const lowestPrice = agency.price_starter ? Math.round(agency.price_starter / 100) : 49;
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const supportEmail = (f.support_email && f.support_email.trim()) || defaultLegalEmail(agency);
  const businessName = (f.business_name && f.business_name.trim()) || agency.name || 'Our Company';
  const processor = (f.payment_processor && f.payment_processor.trim()) || defaultPaymentProcessor(agency);
  const trialTerms = (f.trial_terms && f.trial_terms.trim()) || DEFAULT_TRIAL_TERMS;
  const refundPolicy = (f.refund_policy && f.refund_policy.trim()) || DEFAULT_REFUND_POLICY;

  return TEMPLATES[type]
    .replace(/\{\{TRIAL_TERMS\}\}/g, trialTerms)
    .replace(/\{\{REFUND_POLICY\}\}/g, refundPolicy)
    .replace(/\{\{PAYMENT_PROCESSOR\}\}/g, processor)
    .replace(/\{\{AGENCY_NAME\}\}/g, businessName)
    .replace(/\{\{SUPPORT_EMAIL\}\}/g, supportEmail)
    .replace(/\{\{CURRENCY_SYMBOL\}\}/g, cs)
    .replace(/\{\{LOWEST_PRICE\}\}/g, String(lowestPrice))
    .replace(/\{\{EFFECTIVE_DATE\}\}/g, today);
}

// Resolve the effective value shown in an editor field (stored value or default).
export function effectiveFieldValue(key: keyof LegalFields, fields: LegalFields | null | undefined, agency: LegalAgencyFields): string {
  const f = fields || {};
  switch (key) {
    case 'support_email': return (f.support_email ?? '') || defaultLegalEmail(agency);
    case 'business_name': return (f.business_name ?? '') || (agency.name || '');
    case 'payment_processor': return (f.payment_processor ?? '') || defaultPaymentProcessor(agency);
    case 'trial_terms': return (f.trial_terms ?? '') || DEFAULT_TRIAL_TERMS;
    case 'refund_policy': return (f.refund_policy ?? '') || DEFAULT_REFUND_POLICY;
    default: return '';
  }
}