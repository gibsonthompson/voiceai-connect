import { NextRequest, NextResponse } from 'next/server';

/* ═══════════════════════════════════════════════════════════════════════════
   POST /api/widget/escalate
   Collects visitor name + email/phone, sends notification to support team.
   Uses Resend for email notification.

   Two modes:
   1. Default (no agencyEmail) — sends to VoiceAI Connect support
   2. Agency (agencyEmail + agencyName) — sends to agency's support email

   IMPORTANT: this route only returns success when the notification is actually
   sent. If it can't be sent, it returns a non-2xx so the widget can show an
   error (and the visitor can use the email fallback) instead of being told
   their message was delivered when it wasn't.
   ═══════════════════════════════════════════════════════════════════════════ */

const VOICEAI_SUPPORT_EMAIL = 'support@myvoiceaiconnect.com';
const NOTIFICATION_FROM = 'VoiceAI Connect <notifications@myvoiceaiconnect.com>';

export async function POST(req: NextRequest) {
  try {
    const { name, contact, message, conversationSummary, agencyEmail, agencyName } = await req.json();

    if (!name || !contact) {
      return NextResponse.json({ error: 'Name and contact info are required' }, { status: 400 });
    }

    // Determine recipient — agency support or VoiceAI Connect support
    const recipientEmail = agencyEmail || VOICEAI_SUPPORT_EMAIL;
    const brandName = agencyName || 'VoiceAI Connect';

    // Determine if contact is email or phone
    const isEmail = contact.includes('@');
    const contactLabel = isEmail ? 'Email' : 'Phone';

    // Build notification email
    const accentColor = '#4aeabc';
    const emailHtml = `
      <div style="font-family: 'Geist', -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 0;">
        <div style="background: #0c1018; border-radius: 16px; padding: 32px; border: 1px solid rgba(255,255,255,0.08);">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 24px;">
            <div style="width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg, ${accentColor}, #047857); display: flex; align-items: center; justify-content: center; color: #080b14; font-weight: 700; font-size: 12px;">${brandName.charAt(0).toUpperCase()}</div>
            <span style="color: #ffffff; font-size: 14px; font-weight: 600;">Website Support Request</span>
          </div>
          
          <div style="background: rgba(74, 234, 188, 0.08); border: 1px solid rgba(74, 234, 188, 0.2); border-radius: 10px; padding: 16px; margin-bottom: 20px;">
            <p style="margin: 0 0 8px; color: ${accentColor}; font-size: 11px; text-transform: uppercase; letter-spacing: 0.14em; font-family: monospace;">Visitor requesting support</p>
            <p style="margin: 0; color: #ffffff; font-size: 16px; font-weight: 600;">${name}</p>
          </div>

          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; color: rgba(255,255,255,0.45); font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; font-family: monospace; width: 80px;">Name</td>
              <td style="padding: 10px 0; color: #ffffff; font-size: 14px;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: rgba(255,255,255,0.45); font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; font-family: monospace;">${contactLabel}</td>
              <td style="padding: 10px 0; color: ${accentColor}; font-size: 14px;">${contact}</td>
            </tr>
            ${message ? `
            <tr>
              <td style="padding: 10px 0; color: rgba(255,255,255,0.45); font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; font-family: monospace; vertical-align: top;">Message</td>
              <td style="padding: 10px 0; color: rgba(255,255,255,0.75); font-size: 13px; line-height: 1.5;">${message}</td>
            </tr>` : ''}
            ${conversationSummary ? `
            <tr>
              <td colspan="2" style="padding: 16px 0 0; border-top: 1px solid rgba(255,255,255,0.06);">
                <p style="color: rgba(255,255,255,0.45); font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; font-family: monospace; margin: 0 0 8px;">Chat history</p>
                <div style="background: rgba(255,255,255,0.03); border-radius: 8px; padding: 12px; font-size: 12px; color: rgba(255,255,255,0.6); line-height: 1.6; white-space: pre-wrap;">${conversationSummary}</div>
              </td>
            </tr>` : ''}
          </table>

          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.06);">
            <p style="margin: 0; color: rgba(255,255,255,0.35); font-size: 11px;">
              Sent from ${brandName} website support widget · ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} ET
            </p>
          </div>
        </div>
      </div>
    `;

    // Send email via Resend. If we can't send, fail loudly — don't fake success.
    const resendKey = process.env.RESEND_API_KEY;

    if (!resendKey) {
      // Log the full lead so it's recoverable from server logs even though email is down.
      console.error('RESEND_API_KEY not set — escalation email NOT sent. Undelivered lead:',
        JSON.stringify({ brandName, recipientEmail, name, contact, message: message || null }));
      return NextResponse.json({ error: 'Notification service unavailable' }, { status: 503 });
    }

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: NOTIFICATION_FROM,
        to: [recipientEmail],
        subject: `Support request — ${name}`,
        html: emailHtml,
        reply_to: isEmail ? contact : undefined,
      }),
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      console.error('Resend error:', errText);
      // Log the full lead so it's recoverable from server logs.
      console.error('Undelivered lead:',
        JSON.stringify({ brandName, recipientEmail, name, contact, message: message || null }));
      return NextResponse.json({ error: 'Failed to send notification' }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Escalation error:', err);
    return NextResponse.json({ error: 'Failed to process escalation' }, { status: 500 });
  }
}