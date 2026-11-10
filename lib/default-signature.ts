// ============================================================================
// Default white-label email signature.
// ----------------------------------------------------------------------------
// The agency's own logo, name, website, and AI demo line. Text uses merge
// fields (resolved per send by the compose endpoint); the logo URL is inlined.
// The Outreach-page editor pre-fills with this when the agency has not set
// their own, and the backend compose falls back to the same template so emails
// always close with the agency's branding. Keep in sync with the backend copy
// (buildDefaultSignatureHtml in src/routes/outreach.js).
// ============================================================================

export function buildDefaultSignatureHtml(logoUrl?: string | null, includeDemo?: boolean): string {
  const logo = logoUrl
    ? `<div style="margin-bottom:8px"><img src="${logoUrl}" alt="{agency_name}" style="max-height:48px;max-width:200px;display:inline-block" /></div>`
    : '';
  const demo = includeDemo ? `<div>Hear our AI receptionist: {agency_demo_number}</div>` : '';
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:#333333">`
    + logo
    + `<div style="font-weight:bold;color:#111111">{agency_owner_name}</div>`
    + `<div>{agency_name}</div>`
    + `<div><a href="https://{agency_website}" style="color:#2563eb;text-decoration:none">{agency_website}</a></div>`
    + demo
    + `</div>`;
}
