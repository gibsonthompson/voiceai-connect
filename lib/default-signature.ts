// ============================================================================
// Default white-label email signature.
// ----------------------------------------------------------------------------
// The agency's own logo, name, website, and AI demo line. A signature only ever
// contains the agency's OWN fields (never lead or per-send variables), so this
// builder fills each one with the agency's real value when the dashboard knows
// it, and only falls back to a merge token ({agency_owner_name}, etc.) for a
// field that is missing. The backend compose still resolves any remaining token
// on send, so an unset field is never shown raw to a prospect. That is why the
// editor shows the agency's actual branding instead of {placeholders}.
// Backend fallback for agencies who never open the editor: buildDefaultSignatureHtml
// in src/routes/outreach.js (token form, resolved on send).
// ============================================================================

export interface DefaultSignatureOpts {
  logoUrl?: string | null;
  ownerName?: string | null;
  agencyName?: string | null;
  website?: string | null;     // bare host, no scheme (e.g. acme.com)
  demoNumber?: string | null;  // already formatted for display
  includeDemo?: boolean;       // defaults to true when a demoNumber is present
}

export function buildDefaultSignatureHtml(opts: DefaultSignatureOpts = {}): string {
  const { logoUrl, ownerName, agencyName, website, demoNumber, includeDemo } = opts;

  // Real value when known, otherwise the merge token (backend fills it on send).
  const nameVal = (ownerName && ownerName.trim()) || '{agency_owner_name}';
  const bizVal = (agencyName && agencyName.trim()) || '{agency_name}';
  const siteVal = (website && website.trim()) || '{agency_website}';
  const demoVal = (demoNumber && demoNumber.trim()) || '{agency_demo_number}';
  const showDemo = includeDemo ?? !!(demoNumber && demoNumber.trim());

  const logo = logoUrl
    ? `<div style="margin-bottom:8px"><img src="${logoUrl}" alt="${bizVal}" style="max-height:48px;max-width:200px;display:inline-block" /></div>`
    : '';
  const demo = showDemo ? `<div>Hear our AI receptionist: ${demoVal}</div>` : '';
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:#333333">`
    + logo
    + `<div style="font-weight:bold;color:#111111">${nameVal}</div>`
    + `<div>${bizVal}</div>`
    + `<div><a href="https://${siteVal}" style="color:#2563eb;text-decoration:none">${siteVal}</a></div>`
    + demo
    + `</div>`;
}
