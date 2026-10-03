import type { TourStep } from './TourProvider';

// One entry per tab. The tour only includes tabs the agency can actually reach
// (passed in already filtered by plan + permissions), so locked tabs are skipped
// and the tour never navigates into a route that would bounce to an upgrade wall.
const COPY: Record<string, { title: string; body: string }> = {
  '/agency/dashboard': { title: 'Your home base', body: 'Quick stats, your live demo number, and the "I need to..." bar that jumps you anywhere fast. Start here every day.' },
  '/agency/clients': { title: 'Clients', body: 'Every business you set up lives here. Add a client and we provision their AI phone number in minutes.' },
  '/agency/inbox': { title: 'Inbox', body: 'Two-way messages with your clients, and with us. Nothing gets lost.' },
  '/agency/leads': { title: 'Leads', body: 'Find local businesses that need an AI receptionist, right from inside the dashboard.' },
  '/agency/outreach': { title: 'Outreach', body: 'Turn those leads into clients with automated email and text sequences.' },
  '/agency/analytics': { title: 'Analytics', body: 'Calls answered, appointments booked, and spam caught, across all of your clients at once.' },
  '/agency/payments': { title: 'Payments', body: 'Connect payouts so you actually get paid, and watch your recurring revenue grow.' },
  '/agency/marketing': { title: 'Your website', body: 'Your white-label marketing site. Add your logo and colors and it is fully yours.' },
  '/agency/demo-phone': { title: 'Demo phone', body: 'A live demo number you can hand prospects so they hear the AI for themselves before they sign up.' },
  '/agency/templates': { title: 'AI Lab', body: 'Where you shape the AI: voice, greeting, knowledge base, even custom industries built for you on the fly.' },
  '/agency/branding': { title: 'Branding', body: 'White-label everything your clients see, logos, colors, and your own domains.' },
  '/agency/referrals': { title: 'Referrals', body: 'Earn by referring other agencies to the platform.' },
  '/agency/settings': { title: 'Settings', body: 'Your account, your team seats, and your plan. Manage it all here.' },
};

// Tabs that have a content anchor (data-tour="tour-<slug>") on the page itself,
// so the tour spotlights real page content there instead of the sidebar item.
const CONTENT_ANCHORS: Record<string, true> = {
  '/agency/clients': true,
  '/agency/templates': true,
  '/agency/marketing': true,
  '/agency/analytics': true,
};
const slug = (href: string) => href.replace('/agency/', '');

export function buildAgencyTourSteps(navItems: { href: string }[]): TourStep[] {
  const welcome: TourStep = {
    id: 'welcome',
    route: '/agency/dashboard',
    target: null,
    placement: 'center',
    title: 'Welcome, let me show you around',
    body: 'A quick walk through your dashboard so you know where everything lives. About a minute, and you can skip or replay it anytime.',
  };
  const tabSteps: TourStep[] = navItems
    .filter((n) => COPY[n.href])
    .map((n) => {
      const hasContent = !!CONTENT_ANCHORS[n.href];
      return {
        id: n.href,
        route: n.href,
        target: hasContent ? `tour-${slug(n.href)}` : `nav-${slug(n.href)}`,
        placement: (hasContent ? 'bottom' : 'right') as TourStep['placement'],
        title: COPY[n.href].title,
        body: COPY[n.href].body,
      };
    });
  const finish: TourStep = {
    id: 'finish',
    route: null,
    target: null,
    placement: 'center',
    title: "You're all set",
    body: 'That is the tour. Replay it anytime from the "Take a tour" link in the sidebar. Now go set up your first client.',
  };
  return [welcome, ...tabSteps, finish];
}
