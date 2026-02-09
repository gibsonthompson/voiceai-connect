// ============================================================================
// Demo Data for VoiceAI Connect Agency Dashboard
// Provides realistic sample data for all dashboard pages
// when Demo Mode is toggled on.
// ============================================================================

// ---- Helpers ----
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

function hoursAgo(n: number): string {
  const d = new Date();
  d.setHours(d.getHours() - n);
  return d.toISOString();
}

function monthStr(monthsAgo: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsAgo);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// ---- Demo Agency Overrides (merged with real agency) ----
export const DEMO_AGENCY_OVERRIDES = {
  stripe_account_id: 'acct_demo_1234567890',
  subscription_status: 'active',
  status: 'active',
  plan_type: 'professional',
};

// ============================================================================
// DASHBOARD PAGE
// ============================================================================
export const DEMO_DASHBOARD = {
  clientCount: 14,
  mrr: 118500, // cents = $1,185.00
  totalCalls: 847,
  recentClients: [
    {
      id: 'demo-client-1',
      business_name: 'Pristine Plumbing Co.',
      status: 'active',
      created_at: daysAgo(2),
      plan_type: 'pro',
      subscription_status: 'active',
    },
    {
      id: 'demo-client-2',
      business_name: 'Summit Roofing & Repairs',
      status: 'active',
      created_at: daysAgo(5),
      plan_type: 'growth',
      subscription_status: 'active',
    },
    {
      id: 'demo-client-3',
      business_name: 'GreenScape Lawn Care',
      status: 'active',
      created_at: daysAgo(8),
      plan_type: 'starter',
      subscription_status: 'active',
    },
    {
      id: 'demo-client-4',
      business_name: 'BrightStar Electric',
      status: 'active',
      created_at: daysAgo(12),
      plan_type: 'pro',
      subscription_status: 'active',
    },
    {
      id: 'demo-client-5',
      business_name: 'AquaPure Pool Services',
      status: 'active',
      created_at: daysAgo(15),
      plan_type: 'starter',
      subscription_status: 'trialing',
    },
  ],
};

// ============================================================================
// CLIENTS LIST PAGE
// ============================================================================
export const DEMO_CLIENTS = [
  {
    id: 'demo-client-1',
    business_name: 'Pristine Plumbing Co.',
    email: 'info@pristineplumbing.com',
    owner_name: 'Marcus Johnson',
    owner_phone: '+14045551001',
    plan_type: 'pro',
    subscription_status: 'active',
    status: 'active',
    calls_this_month: 42,
    created_at: daysAgo(45),
    vapi_phone_number: '+14705559001',
  },
  {
    id: 'demo-client-2',
    business_name: 'Summit Roofing & Repairs',
    email: 'hello@summitroofing.com',
    owner_name: 'David Chen',
    owner_phone: '+14045551002',
    plan_type: 'growth',
    subscription_status: 'active',
    status: 'active',
    calls_this_month: 87,
    created_at: daysAgo(90),
    vapi_phone_number: '+14705559002',
  },
  {
    id: 'demo-client-3',
    business_name: 'GreenScape Lawn Care',
    email: 'service@greenscapelawn.com',
    owner_name: 'Tyler Robinson',
    owner_phone: '+14045551003',
    plan_type: 'starter',
    subscription_status: 'active',
    status: 'active',
    calls_this_month: 28,
    created_at: daysAgo(60),
    vapi_phone_number: '+14705559003',
  },
  {
    id: 'demo-client-4',
    business_name: 'BrightStar Electric',
    email: 'office@brightstarelectric.com',
    owner_name: 'James Williams',
    owner_phone: '+14045551004',
    plan_type: 'pro',
    subscription_status: 'active',
    status: 'active',
    calls_this_month: 63,
    created_at: daysAgo(120),
    vapi_phone_number: '+14705559004',
  },
  {
    id: 'demo-client-5',
    business_name: 'AquaPure Pool Services',
    email: 'contact@aquapurepools.com',
    owner_name: 'Sarah Martinez',
    owner_phone: '+14045551005',
    plan_type: 'starter',
    subscription_status: 'trialing',
    status: 'active',
    calls_this_month: 12,
    created_at: daysAgo(5),
    vapi_phone_number: '+14705559005',
  },
  {
    id: 'demo-client-6',
    business_name: 'Elite HVAC Solutions',
    email: 'support@elitehvac.com',
    owner_name: 'Robert Taylor',
    owner_phone: '+14045551006',
    plan_type: 'growth',
    subscription_status: 'active',
    status: 'active',
    calls_this_month: 105,
    created_at: daysAgo(150),
    vapi_phone_number: '+14705559006',
  },
  {
    id: 'demo-client-7',
    business_name: 'Diamond Auto Detailing',
    email: 'book@diamonddetailing.com',
    owner_name: 'Kevin Brooks',
    owner_phone: '+14045551007',
    plan_type: 'pro',
    subscription_status: 'active',
    status: 'active',
    calls_this_month: 51,
    created_at: daysAgo(75),
    vapi_phone_number: '+14705559007',
  },
  {
    id: 'demo-client-8',
    business_name: 'CleanRight Janitorial',
    email: 'service@cleanright.com',
    owner_name: 'Patricia Davis',
    owner_phone: '+14045551008',
    plan_type: 'starter',
    subscription_status: 'active',
    status: 'active',
    calls_this_month: 19,
    created_at: daysAgo(30),
    vapi_phone_number: '+14705559008',
  },
  {
    id: 'demo-client-9',
    business_name: 'Ironclad Fencing',
    email: 'quotes@ironcladfencing.com',
    owner_name: 'Michael Harris',
    owner_phone: '+14045551009',
    plan_type: 'pro',
    subscription_status: 'active',
    status: 'active',
    calls_this_month: 38,
    created_at: daysAgo(100),
    vapi_phone_number: '+14705559009',
  },
  {
    id: 'demo-client-10',
    business_name: 'TrueNorth Pest Control',
    email: 'help@truenorthpest.com',
    owner_name: 'Amanda Wilson',
    owner_phone: '+14045551010',
    plan_type: 'starter',
    subscription_status: 'active',
    status: 'active',
    calls_this_month: 33,
    created_at: daysAgo(55),
    vapi_phone_number: '+14705559010',
  },
  {
    id: 'demo-client-11',
    business_name: 'Apex Moving Co.',
    email: 'info@apexmoving.com',
    owner_name: 'Chris Anderson',
    owner_phone: '+14045551011',
    plan_type: 'growth',
    subscription_status: 'active',
    status: 'active',
    calls_this_month: 92,
    created_at: daysAgo(180),
    vapi_phone_number: '+14705559011',
  },
  {
    id: 'demo-client-12',
    business_name: 'Cascade Window Cleaning',
    email: 'book@cascadewindows.com',
    owner_name: 'Jennifer Lee',
    owner_phone: '+14045551012',
    plan_type: 'starter',
    subscription_status: 'active',
    status: 'active',
    calls_this_month: 21,
    created_at: daysAgo(40),
    vapi_phone_number: '+14705559012',
  },
  {
    id: 'demo-client-13',
    business_name: 'ProCoat Painting',
    email: 'estimates@procoatpainting.com',
    owner_name: 'Daniel Thompson',
    owner_phone: '+14045551013',
    plan_type: 'pro',
    subscription_status: 'trialing',
    status: 'active',
    calls_this_month: 8,
    created_at: daysAgo(3),
    vapi_phone_number: '+14705559013',
  },
  {
    id: 'demo-client-14',
    business_name: 'SafeGuard Locksmith',
    email: 'dispatch@safeguardlocks.com',
    owner_name: 'Brian Garcia',
    owner_phone: '+14045551014',
    plan_type: 'pro',
    subscription_status: 'active',
    status: 'active',
    calls_this_month: 56,
    created_at: daysAgo(85),
    vapi_phone_number: '+14705559014',
  },
];

// ============================================================================
// CLIENT DETAIL PAGE
// ============================================================================
export function getDemoClientDetail(clientId: string) {
  const client = DEMO_CLIENTS.find(c => c.id === clientId) || DEMO_CLIENTS[0];
  return {
    client: {
      ...client,
      business_city: 'Atlanta',
      business_state: 'GA',
      business_website: `https://www.${client.business_name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      industry: 'Home Services',
      monthly_call_limit: client.plan_type === 'growth' ? 500 : client.plan_type === 'pro' ? 150 : 50,
    },
    calls: DEMO_CLIENT_CALLS.slice(0, 10),
  };
}

// ============================================================================
// CLIENT CALLS
// ============================================================================
export const DEMO_CLIENT_CALLS = [
  {
    id: 'demo-call-1',
    caller_phone: '+14045552001',
    customer_name: 'Emily Richardson',
    duration: 245,
    created_at: hoursAgo(2),
    call_status: 'completed',
    urgency_level: 'normal',
    ai_summary: 'Customer called to schedule a routine maintenance appointment for next Tuesday. Confirmed availability and booked the 10 AM slot.',
    service_requested: 'Routine maintenance',
    customer_phone: '+14045552001',
  },
  {
    id: 'demo-call-2',
    caller_phone: '+14045552002',
    customer_name: 'Robert Lawson',
    duration: 189,
    created_at: hoursAgo(5),
    call_status: 'completed',
    urgency_level: 'high',
    ai_summary: 'Urgent request for emergency service. Water leak in basement. Dispatched technician for same-day visit. Customer very grateful for quick response.',
    service_requested: 'Emergency repair',
    customer_phone: '+14045552002',
  },
  {
    id: 'demo-call-3',
    caller_phone: '+14045552003',
    customer_name: 'Lisa Park',
    duration: 312,
    created_at: hoursAgo(8),
    call_status: 'completed',
    urgency_level: 'normal',
    ai_summary: 'New customer inquiry about pricing for a full home inspection. Provided quote range and scheduled an on-site estimate for Friday.',
    service_requested: 'Quote request',
    customer_phone: '+14045552003',
  },
  {
    id: 'demo-call-4',
    caller_phone: '+14045552004',
    customer_name: 'Mark Stevens',
    duration: 156,
    created_at: hoursAgo(12),
    call_status: 'completed',
    urgency_level: 'normal',
    ai_summary: 'Follow-up call regarding last week\'s service. Customer confirmed everything is working properly and expressed satisfaction with the work.',
    service_requested: 'Follow-up',
    customer_phone: '+14045552004',
  },
  {
    id: 'demo-call-5',
    caller_phone: '+14045552005',
    customer_name: 'Sandra Mitchell',
    duration: 278,
    created_at: daysAgo(1),
    call_status: 'completed',
    urgency_level: 'medium',
    ai_summary: 'Customer reported a recurring issue from a previous visit. Scheduled a warranty callback for Thursday morning. No additional charge discussed.',
    service_requested: 'Warranty callback',
    customer_phone: '+14045552005',
  },
  {
    id: 'demo-call-6',
    caller_phone: '+14045552006',
    customer_name: 'Jason Torres',
    duration: 198,
    created_at: daysAgo(1),
    call_status: 'completed',
    urgency_level: 'normal',
    ai_summary: 'New lead from Google search. Interested in seasonal service package. Collected contact info and sent pricing brochure via email.',
    service_requested: 'Seasonal package inquiry',
    customer_phone: '+14045552006',
  },
  {
    id: 'demo-call-7',
    caller_phone: '+14045552007',
    customer_name: 'Karen White',
    duration: 420,
    created_at: daysAgo(2),
    call_status: 'completed',
    urgency_level: 'emergency',
    ai_summary: 'Emergency call — complete system failure. Customer has elderly family members at home. Escalated to on-call technician immediately. ETA 45 minutes confirmed.',
    service_requested: 'Emergency - system failure',
    customer_phone: '+14045552007',
  },
  {
    id: 'demo-call-8',
    caller_phone: '+14045552008',
    customer_name: 'Tom Bradley',
    duration: 134,
    created_at: daysAgo(2),
    call_status: 'completed',
    urgency_level: 'normal',
    ai_summary: 'Commercial client requesting a quote for their new office location. Scheduled site visit for next Monday at 2 PM.',
    service_requested: 'Commercial quote',
    customer_phone: '+14045552008',
  },
  {
    id: 'demo-call-9',
    caller_phone: '+14045552009',
    customer_name: 'Rachel Green',
    duration: 167,
    created_at: daysAgo(3),
    call_status: 'voicemail',
    urgency_level: 'normal',
    ai_summary: 'Caller went to voicemail. Left a message requesting a callback about their upcoming annual service. Contact number confirmed.',
    service_requested: 'Annual service',
    customer_phone: '+14045552009',
  },
  {
    id: 'demo-call-10',
    caller_phone: '+14045552010',
    customer_name: 'Anthony Kim',
    duration: 223,
    created_at: daysAgo(3),
    call_status: 'completed',
    urgency_level: 'normal',
    ai_summary: 'Referred by an existing customer. Looking for a comprehensive service plan. Very interested in the premium tier. Sent follow-up email with details.',
    service_requested: 'Referral - new customer',
    customer_phone: '+14045552010',
  },
];

// ============================================================================
// CALL DETAIL PAGE
// ============================================================================
export function getDemoCallDetail(callId: string) {
  const call = DEMO_CLIENT_CALLS.find(c => c.id === callId) || DEMO_CLIENT_CALLS[0];
  return {
    ...call,
    customer_email: `${call.customer_name.toLowerCase().replace(' ', '.')}@email.com`,
    customer_address: '1234 Oak Street, Atlanta, GA 30301',
    transcript: generateDemoTranscript(call.customer_name, call.service_requested),
    recording_url: null,
    duration_seconds: call.duration,
  };
}

function generateDemoTranscript(name: string, service: string): string {
  return `AI Receptionist: Thank you for calling! How can I help you today?\n\n${name}: Hi, I'm calling about ${service.toLowerCase()}.\n\nAI Receptionist: Of course! I'd be happy to help you with that. Can I get your name and the best number to reach you?\n\n${name}: Sure, it's ${name}, and you can reach me at this number.\n\nAI Receptionist: Perfect, ${name}. Let me check our availability. We have openings this week. Would a morning or afternoon appointment work better for you?\n\n${name}: Morning would be great, if possible.\n\nAI Receptionist: Excellent! I've got you down for a morning slot. You'll receive a confirmation text shortly with all the details. Is there anything else I can help with?\n\n${name}: No, that's everything. Thank you so much!\n\nAI Receptionist: You're welcome, ${name}! We look forward to helping you. Have a great day!`;
}

// ============================================================================
// ANALYTICS PAGE
// ============================================================================
export const DEMO_ANALYTICS = {
  stats: {
    mrr: 118500,
    totalEarned: 892400,
    pendingPayout: 23700,
    activeClients: 12,
    trialClients: 2,
    totalClients: 14,
  },
  revenueByMonth: [
    { month: monthStr(5), amount: 42500 },
    { month: monthStr(4), amount: 56800 },
    { month: monthStr(3), amount: 71200 },
    { month: monthStr(2), amount: 89400 },
    { month: monthStr(1), amount: 105300 },
    { month: monthStr(0), amount: 118500 },
  ],
  revenueByPlan: {
    starter: 29400,
    pro: 49500,
    growth: 39600,
  },
  payments: [
    { id: 'demo-pay-1', client_id: 'demo-client-2', amount: 14900, status: 'paid', type: 'subscription', created_at: daysAgo(1), paid_out: true, client_name: 'Summit Roofing & Repairs' },
    { id: 'demo-pay-2', client_id: 'demo-client-6', amount: 14900, status: 'paid', type: 'subscription', created_at: daysAgo(2), paid_out: true, client_name: 'Elite HVAC Solutions' },
    { id: 'demo-pay-3', client_id: 'demo-client-1', amount: 9900, status: 'paid', type: 'subscription', created_at: daysAgo(3), paid_out: false, client_name: 'Pristine Plumbing Co.' },
    { id: 'demo-pay-4', client_id: 'demo-client-4', amount: 9900, status: 'paid', type: 'subscription', created_at: daysAgo(5), paid_out: true, client_name: 'BrightStar Electric' },
    { id: 'demo-pay-5', client_id: 'demo-client-7', amount: 9900, status: 'paid', type: 'subscription', created_at: daysAgo(5), paid_out: true, client_name: 'Diamond Auto Detailing' },
    { id: 'demo-pay-6', client_id: 'demo-client-11', amount: 14900, status: 'paid', type: 'subscription', created_at: daysAgo(7), paid_out: true, client_name: 'Apex Moving Co.' },
    { id: 'demo-pay-7', client_id: 'demo-client-9', amount: 9900, status: 'paid', type: 'subscription', created_at: daysAgo(8), paid_out: true, client_name: 'Ironclad Fencing' },
    { id: 'demo-pay-8', client_id: 'demo-client-3', amount: 4900, status: 'paid', type: 'subscription', created_at: daysAgo(10), paid_out: true, client_name: 'GreenScape Lawn Care' },
    { id: 'demo-pay-9', client_id: 'demo-client-14', amount: 9900, status: 'paid', type: 'subscription', created_at: daysAgo(12), paid_out: true, client_name: 'SafeGuard Locksmith' },
    { id: 'demo-pay-10', client_id: 'demo-client-10', amount: 4900, status: 'paid', type: 'subscription', created_at: daysAgo(14), paid_out: true, client_name: 'TrueNorth Pest Control' },
  ],
  clients: DEMO_CLIENTS.map(c => ({ id: c.id, business_name: c.business_name, plan_type: c.plan_type })),
};

// ============================================================================
// LEADS PAGE — Mutable Store
// ============================================================================

// Seed data (used to initialize the mutable array)
const _seedLeads = [
  {
    id: 'demo-lead-1',
    business_name: 'Velocity Garage Doors',
    contact_name: 'Nathan Price',
    email: 'nathan@velocitydoors.com',
    phone: '+14045553001',
    website: '',
    industry: 'Home Services',
    source: 'google_maps',
    status: 'qualified',
    estimated_value: 9900,
    next_follow_up: daysFromNow(1),
    created_at: daysAgo(7),
    updated_at: daysAgo(1),
    notes: 'Very interested in the pro plan. Currently handling 40+ calls/month manually.',
  },
  {
    id: 'demo-lead-2',
    business_name: 'Coastal Pressure Washing',
    contact_name: 'Mike Reynolds',
    email: 'mike@coastalpw.com',
    phone: '+14045553002',
    website: '',
    industry: 'Home Services',
    source: 'referral',
    status: 'proposal',
    estimated_value: 14900,
    next_follow_up: daysFromNow(0),
    created_at: daysAgo(14),
    updated_at: daysAgo(2),
    notes: 'Referred by Summit Roofing. Wants growth plan for his 3-truck operation.',
  },
  {
    id: 'demo-lead-3',
    business_name: 'AllStar Appliance Repair',
    contact_name: 'Diana Cooper',
    email: 'diana@allstarappliance.com',
    phone: '+14045553003',
    website: '',
    industry: 'Home Services',
    source: 'google_search',
    status: 'contacted',
    estimated_value: 9900,
    next_follow_up: daysFromNow(2),
    created_at: daysAgo(3),
    updated_at: daysAgo(1),
    notes: 'Found us through Google. Wants to see a demo first.',
  },
  {
    id: 'demo-lead-4',
    business_name: 'Precision Tree Service',
    contact_name: 'Greg Hoffman',
    email: 'greg@precisiontree.com',
    phone: '+14045553004',
    website: '',
    industry: 'Home Services',
    source: 'facebook',
    status: 'new',
    estimated_value: 4900,
    next_follow_up: daysFromNow(0),
    created_at: daysAgo(1),
    updated_at: daysAgo(1),
    notes: '',
  },
  {
    id: 'demo-lead-5',
    business_name: 'Metro Carpet Cleaning',
    contact_name: 'Angela Foster',
    email: 'angela@metrocarpet.com',
    phone: '+14045553005',
    website: '',
    industry: 'Home Services',
    source: 'instagram',
    status: 'new',
    estimated_value: 4900,
    next_follow_up: null,
    created_at: daysAgo(0),
    updated_at: daysAgo(0),
    notes: '',
  },
  {
    id: 'demo-lead-6',
    business_name: 'Heritage Home Inspections',
    contact_name: 'Walter Reed',
    email: 'walter@heritageinspect.com',
    phone: '+14045553006',
    website: '',
    industry: 'Real Estate',
    source: 'linkedin',
    status: 'won',
    estimated_value: 9900,
    next_follow_up: null,
    created_at: daysAgo(30),
    updated_at: daysAgo(5),
    notes: 'Closed! Signed up for pro plan.',
  },
  {
    id: 'demo-lead-7',
    business_name: 'Budget Movers LLC',
    contact_name: 'Tony Sanchez',
    email: 'tony@budgetmovers.com',
    phone: '+14045553007',
    website: '',
    industry: 'Home Services',
    source: 'google_maps',
    status: 'lost',
    estimated_value: 4900,
    next_follow_up: null,
    created_at: daysAgo(21),
    updated_at: daysAgo(10),
    notes: 'Went with a competitor. Price was the main concern.',
  },
  {
    id: 'demo-lead-8',
    business_name: 'SunState Solar Cleaning',
    contact_name: 'Rachel Adams',
    email: 'rachel@sunstatesolar.com',
    phone: '+14045553008',
    website: '',
    industry: 'Home Services',
    source: 'referral',
    status: 'qualified',
    estimated_value: 14900,
    next_follow_up: daysAgo(1), // overdue
    created_at: daysAgo(10),
    updated_at: daysAgo(2),
    notes: 'High-value lead. Runs a team of 8. Needs growth plan.',
  },
];

// Mutable in-memory leads store (resets on page refresh — intentional)
let _demoLeads = [..._seedLeads];
let _demoLeadIdCounter = 100;

/** Get the current list of demo leads (includes user-added ones). */
export function getDemoLeads() {
  return _demoLeads;
}

/** Calculate stats from the current mutable leads array. */
export function getDemoLeadStats() {
  const all = _demoLeads;

  function isToday(dateStr: string): boolean {
    const date = new Date(dateStr);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  function isOverdue(dateStr: string): boolean {
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  }

  return {
    total: all.length,
    new: all.filter(l => l.status === 'new').length,
    contacted: all.filter(l => l.status === 'contacted').length,
    qualified: all.filter(l => l.status === 'qualified').length,
    proposal: all.filter(l => l.status === 'proposal').length,
    won: all.filter(l => l.status === 'won').length,
    lost: all.filter(l => l.status === 'lost').length,
    totalEstimatedValue: all
      .filter(l => l.status !== 'lost')
      .reduce((sum, l) => sum + (l.estimated_value || 0), 0),
    followUpsToday: all.filter(l => l.next_follow_up ? isToday(l.next_follow_up) : false).length,
    overdueFollowUps: all.filter(l => {
      if (!l.next_follow_up) return false;
      if (['won', 'lost'].includes(l.status)) return false;
      return isOverdue(l.next_follow_up);
    }).length,
  };
}

/** Add a new demo lead and return it (with generated id + timestamps). */
export function addDemoLead(data: {
  business_name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  website?: string | null;
  industry?: string;
  source?: string;
  status?: string;
  notes?: string;
  estimated_value?: number | null;
  next_follow_up?: string | null;
}): typeof _demoLeads[0] {
  _demoLeadIdCounter++;
  const now = new Date().toISOString();
  const newLead = {
    id: `demo-lead-new-${_demoLeadIdCounter}`,
    business_name: data.business_name,
    contact_name: data.contact_name || '',
    email: data.email || '',
    phone: data.phone || '',
    website: data.website || '',
    industry: data.industry || '',
    source: data.source || '',
    status: data.status || 'new',
    estimated_value: data.estimated_value ?? 0,
    next_follow_up: data.next_follow_up || null,
    created_at: now,
    updated_at: now,
    notes: data.notes || '',
  };
  _demoLeads = [newLead, ..._demoLeads];
  return newLead;
}

// Legacy static exports — kept for any other files still importing them.
export const DEMO_LEADS = _seedLeads;

export const DEMO_LEAD_STATS = {
  total: 8,
  new: 2,
  contacted: 1,
  qualified: 2,
  proposal: 1,
  won: 1,
  lost: 1,
  totalEstimatedValue: 73400,
  followUpsToday: 2,
  overdueFollowUps: 1,
};

// ============================================================================
// LEAD DETAIL PAGE
// ============================================================================
export function getDemoLeadDetail(leadId: string) {
  // Look up from the mutable store so user-added leads are found too
  const lead = _demoLeads.find(l => l.id === leadId) || _demoLeads[0];
  return {
    lead,
    outreachStats: {
      email_count: lead.status === 'new' ? 0 : lead.status === 'contacted' ? 1 : 2,
      sms_count: lead.status === 'new' ? 0 : 1,
      total_count: lead.status === 'new' ? 0 : lead.status === 'contacted' ? 2 : 3,
      last_email: lead.status === 'new' ? null : daysAgo(3),
      last_sms: lead.status === 'new' ? null : daysAgo(2),
      last_outreach: lead.status === 'new' ? null : daysAgo(2),
      next_email_number: lead.status === 'new' ? 1 : lead.status === 'contacted' ? 2 : 3,
      next_sms_number: lead.status === 'new' ? 1 : 2,
      history: [],
    },
    activities: [
      { id: 'a1', type: 'status_change', description: `Status changed to ${lead.status}`, created_at: daysAgo(1) },
      { id: 'a2', type: 'note', description: 'Added initial notes', created_at: lead.created_at },
      { id: 'a3', type: 'created', description: 'Lead created', created_at: lead.created_at },
    ],
  };
}

// ============================================================================
// OUTREACH — Demo Templates & Composer
// ============================================================================

interface DemoTemplate {
  id: string;
  name: string;
  type: 'email' | 'sms';
  subject: string;
  body: string;
  description: string;
}

const _demoEmailTemplates: DemoTemplate[] = [
  {
    id: 'demo-tpl-email-1',
    name: 'Initial Outreach',
    type: 'email',
    subject: 'Stop losing customers to voicemail — {{business_name}}',
    body: `Hi {{contact_name}},

I noticed {{business_name}} is growing fast — congrats! I wanted to reach out because many businesses like yours are losing 30-40% of inbound calls to voicemail, especially after hours.

We built an AI receptionist that answers every call 24/7, books appointments, and sends you a summary — all for a fraction of the cost of a full-time receptionist.

Would you be open to a quick 10-minute demo this week? I think you'd be impressed.

Best,
{{agency_name}}`,
    description: 'First-touch cold email for new leads',
  },
  {
    id: 'demo-tpl-email-2',
    name: 'Follow-Up Email',
    type: 'email',
    subject: 'Quick follow-up — AI receptionist for {{business_name}}',
    body: `Hi {{contact_name}},

Just circling back on my previous email. I know things get busy, so I'll keep this short:

• Every missed call = a lost customer (industry average: $250+ per missed lead)
• Our AI receptionist answers in under 2 seconds, 24/7
• No contracts — cancel anytime

One of our clients, a plumbing company your size, went from missing 12 calls/week to zero within the first month.

Worth a quick chat? I can show you exactly how it works in 10 minutes.

{{agency_name}}`,
    description: 'Second-touch follow-up with social proof',
  },
  {
    id: 'demo-tpl-email-3',
    name: 'Break-Up Email',
    type: 'email',
    subject: 'Closing the loop — {{business_name}}',
    body: `Hi {{contact_name}},

I've reached out a couple of times and haven't heard back, so I don't want to keep bugging you.

If now isn't the right time, totally understand. But if you ever want to explore how an AI receptionist could help {{business_name}} capture more leads and book more jobs, just reply to this email and we'll pick it up.

Wishing you continued success!

{{agency_name}}`,
    description: 'Final follow-up before closing the lead',
  },
];

const _demoSmsTemplates: DemoTemplate[] = [
  {
    id: 'demo-tpl-sms-1',
    name: 'Initial SMS',
    type: 'sms',
    subject: '',
    body: `Hey {{contact_name}}, this is {{agency_name}}. I help businesses like {{business_name}} stop missing calls with an AI receptionist that answers 24/7. Worth a quick chat this week?`,
    description: 'First-touch SMS outreach',
  },
  {
    id: 'demo-tpl-sms-2',
    name: 'Follow-Up SMS',
    type: 'sms',
    subject: '',
    body: `Hi {{contact_name}} — following up on my last message. Our AI receptionist has helped similar businesses capture 30%+ more leads. Happy to do a free 10-min demo whenever works for you. — {{agency_name}}`,
    description: 'Second-touch SMS follow-up',
  },
  {
    id: 'demo-tpl-sms-3',
    name: 'Quick Value SMS',
    type: 'sms',
    subject: '',
    body: `{{contact_name}}, quick question — how many calls does {{business_name}} miss per week? Most of our clients were surprised to find out it was 10-15+. We can fix that overnight. Interested? — {{agency_name}}`,
    description: 'Pain-point focused SMS',
  },
];

/** Get demo templates filtered by type. */
export function getDemoTemplates(type: 'email' | 'sms'): DemoTemplate[] {
  return type === 'email' ? _demoEmailTemplates : _demoSmsTemplates;
}

/** Compose a demo message by filling in template variables. */
export function composeDemoMessage(
  templateId: string,
  lead: { business_name?: string; contact_name?: string },
  agencyName?: string,
): { subject: string; body: string } {
  const allTemplates = [..._demoEmailTemplates, ..._demoSmsTemplates];
  const tpl = allTemplates.find(t => t.id === templateId);
  if (!tpl) return { subject: '', body: '' };

  const replacements: Record<string, string> = {
    '{{business_name}}': lead.business_name || 'your business',
    '{{contact_name}}': lead.contact_name || 'there',
    '{{agency_name}}': agencyName || 'Our Team',
  };

  let subject = tpl.subject;
  let body = tpl.body;

  for (const [token, value] of Object.entries(replacements)) {
    subject = subject.replaceAll(token, value);
    body = body.replaceAll(token, value);
  }

  return { subject, body };
}

// Mutable outreach log (resets on refresh — intentional)
const _demoOutreachLog: Array<{
  id: string;
  leadId: string;
  type: 'email' | 'sms';
  subject: string | null;
  body: string;
  sentAt: string;
}> = [];

/** Log a demo outreach event (in-memory only). */
export function logDemoOutreach(entry: {
  leadId: string;
  type: 'email' | 'sms';
  subject?: string | null;
  body: string;
}): void {
  _demoOutreachLog.push({
    id: `demo-outreach-${Date.now()}`,
    leadId: entry.leadId,
    type: entry.type,
    subject: entry.subject ?? null,
    body: entry.body,
    sentAt: new Date().toISOString(),
  });
}

// ============================================================================
// REFERRALS PAGE
// ============================================================================
export const DEMO_REFERRALS = {
  referralCode: 'demo-agency',
  referralLink: 'https://myvoiceaiconnect.com/signup?ref=demo-agency',
  canReceivePayouts: true,
  stats: {
    totalReferrals: 3,
    activeReferrals: 2,
    lifetimeEarnings: 47600,
    availableBalance: 15800,
    thisMonthEarnings: 7900,
  },
  referrals: [
    {
      id: 'demo-ref-1',
      name: 'Bright Ideas Marketing',
      slug: 'bright-ideas',
      status: 'active',
      subscription_status: 'active',
      plan_type: 'professional',
      created_at: daysAgo(60),
    },
    {
      id: 'demo-ref-2',
      name: 'Digital Edge Agency',
      slug: 'digital-edge',
      status: 'active',
      subscription_status: 'active',
      plan_type: 'starter',
      created_at: daysAgo(30),
    },
    {
      id: 'demo-ref-3',
      name: 'Nova Media Group',
      slug: 'nova-media',
      status: 'active',
      subscription_status: 'trialing',
      plan_type: 'professional',
      created_at: daysAgo(5),
    },
  ],
  commissions: [
    {
      id: 'demo-comm-1',
      commission_amount_cents: 7960,
      status: 'pending',
      created_at: daysAgo(2),
      transferred_at: null,
      referred: { name: 'Bright Ideas Marketing', slug: 'bright-ideas' },
    },
    {
      id: 'demo-comm-2',
      commission_amount_cents: 3960,
      status: 'pending',
      created_at: daysAgo(5),
      transferred_at: null,
      referred: { name: 'Digital Edge Agency', slug: 'digital-edge' },
    },
    {
      id: 'demo-comm-3',
      commission_amount_cents: 7960,
      status: 'transferred',
      created_at: daysAgo(32),
      transferred_at: daysAgo(28),
      referred: { name: 'Bright Ideas Marketing', slug: 'bright-ideas' },
    },
    {
      id: 'demo-comm-4',
      commission_amount_cents: 3960,
      status: 'transferred',
      created_at: daysAgo(35),
      transferred_at: daysAgo(28),
      referred: { name: 'Digital Edge Agency', slug: 'digital-edge' },
    },
    {
      id: 'demo-comm-5',
      commission_amount_cents: 7960,
      status: 'transferred',
      created_at: daysAgo(62),
      transferred_at: daysAgo(58),
      referred: { name: 'Bright Ideas Marketing', slug: 'bright-ideas' },
    },
  ],
};