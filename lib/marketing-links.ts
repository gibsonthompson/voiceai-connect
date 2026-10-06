// Shared helpers for agency marketing-site links.
//
// The agency sites render a support / FAQ bot (AgencySupportWidget) that lives
// as a sibling of the template. A "Contact" link should OPEN that bot rather
// than navigate, so it fires a window event the widget listens for. Other
// placeholder links (href "#" or empty) go nowhere and just jump the page to
// the top, so we hide them instead of rendering dead links.

export const AGENCY_SUPPORT_EVENT = 'agency-support:open';

// Fired by a Contact link; caught by AgencySupportWidget to open the bot.
export function openAgencySupport(message?: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AGENCY_SUPPORT_EVENT, { detail: { message } }));
  }
}

// A support / Contact link: the new sentinel href '#support', or a legacy
// Contact link that was saved with a dead '#'/empty href. Both open the bot.
export function isSupportLink(href?: string, label?: string): boolean {
  const h = (href || '').trim().toLowerCase();
  const l = (label || '').trim().toLowerCase();
  return h === '#support' || ((h === '' || h === '#') && l === 'contact');
}

// A link that would dead-end a visitor at the top of the page: a bare '#' or
// empty href that is NOT a support link. These are hidden rather than rendered.
export function isDeadFooterLink(href?: string, label?: string): boolean {
  if (isSupportLink(href, label)) return false;
  const h = (href || '').trim();
  return h === '' || h === '#';
}

export interface FooterLinkLike { label?: string; href?: string }
export interface ResolvedFooterLink { label: string; href: string; support: boolean }

// Drop dead links and annotate the survivors with whether they open the bot.
export function visibleFooterLinks(links?: FooterLinkLike[]): ResolvedFooterLink[] {
  return (links || [])
    .filter((l) => !isDeadFooterLink(l && l.href, l && l.label))
    .map((l) => ({
      label: (l && l.label) || '',
      href: (l && l.href) || '',
      support: isSupportLink(l && l.href, l && l.label),
    }));
}