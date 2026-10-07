// ============================================================================
// SAMPLE BUSINESS SITES - reusable, industry-agnostic demo websites.
//
// Purpose: a believable local-business website per industry that renders as
// plain server HTML (headings, lists, a real hours table) so the VoiceAI
// Connect scraper (Jina Reader) reliably picks up services, hours, staff,
// service area, and contact info. Use it in demos/videos and to test scraping.
//
// Reusable: add an industry by adding one entry to SAMPLE_SITES. Each page
// lives at /sample-site/<slug> and contains everything a real site would.
// ============================================================================

export interface SampleHours {
  day: string;
  open?: string;
  close?: string;
  closed?: boolean;
}

export interface SampleService {
  name: string;
  description: string;
  price: string;
}

export interface SampleStaff {
  name: string;
  role: string;
  bio: string;
}

export interface SampleFaq {
  q: string;
  a: string;
}

export interface SampleTestimonial {
  name: string;
  location: string;
  quote: string;
}

export interface SampleSite {
  slug: string;
  industry: string;
  name: string;
  tagline: string;
  accent: string; // hex, drives the template accent color
  phone: string;
  email: string;
  address: string;
  established: string;
  about: string[];
  emergencyLine?: string;
  hours: SampleHours[];
  serviceAreas: string[];
  services: SampleService[];
  team: SampleStaff[];
  testimonials: SampleTestimonial[];
  faqs: SampleFaq[];
}

// Monday-Saturday standard, closed Sunday. Reused where hours are typical.
const STD_HOURS: SampleHours[] = [
  { day: 'Monday', open: '8:00 AM', close: '6:00 PM' },
  { day: 'Tuesday', open: '8:00 AM', close: '6:00 PM' },
  { day: 'Wednesday', open: '8:00 AM', close: '6:00 PM' },
  { day: 'Thursday', open: '8:00 AM', close: '6:00 PM' },
  { day: 'Friday', open: '8:00 AM', close: '6:00 PM' },
  { day: 'Saturday', open: '9:00 AM', close: '2:00 PM' },
  { day: 'Sunday', closed: true },
];

export const SAMPLE_SITES: SampleSite[] = [
  {
    slug: 'plumbing',
    industry: 'Plumbing',
    name: 'Ridgeline Plumbing Co.',
    tagline: 'Honest, on-time plumbing for homes and businesses.',
    accent: '#2563eb',
    phone: '(555) 019-4823',
    email: 'service@ridgelineplumbing.com',
    address: '1420 Maple Avenue, Springfield, OH 45504',
    established: '2009',
    emergencyLine: '24/7 emergency service available for burst pipes, major leaks, and no-hot-water calls.',
    about: [
      'Ridgeline Plumbing Co. is a family-owned plumbing company serving Springfield and the surrounding area since 2009. We handle everything from a dripping faucet to a full repipe, and we show up when we say we will.',
      'Every technician is licensed, background-checked, and insured. We give upfront flat-rate pricing before any work starts, so there are no surprises on the invoice.',
    ],
    hours: [
      { day: 'Monday', open: '7:00 AM', close: '6:00 PM' },
      { day: 'Tuesday', open: '7:00 AM', close: '6:00 PM' },
      { day: 'Wednesday', open: '7:00 AM', close: '6:00 PM' },
      { day: 'Thursday', open: '7:00 AM', close: '6:00 PM' },
      { day: 'Friday', open: '7:00 AM', close: '6:00 PM' },
      { day: 'Saturday', open: '8:00 AM', close: '4:00 PM' },
      { day: 'Sunday', closed: true },
    ],
    serviceAreas: ['Springfield', 'Dayton', 'Fairborn', 'Beavercreek', 'Xenia', 'Huber Heights'],
    services: [
      { name: 'Drain Cleaning', description: 'Clear slow or clogged drains with camera inspection included.', price: 'From $129' },
      { name: 'Water Heater Repair & Install', description: 'Tank and tankless repair, replacement, and maintenance.', price: 'From $249' },
      { name: 'Leak Detection', description: 'Non-invasive detection for slab, wall, and underground leaks.', price: 'From $189' },
      { name: 'Repiping', description: 'Whole-home repipe in copper or PEX with a 10-year warranty.', price: 'Free estimate' },
      { name: 'Toilet & Faucet Repair', description: 'Running toilets, dripping faucets, and fixture replacement.', price: 'From $99' },
      { name: 'Sewer Line Service', description: 'Trenchless sewer repair and full line replacement.', price: 'Free estimate' },
    ],
    team: [
      { name: 'Marcus Reilly', role: 'Owner & Master Plumber', bio: 'Licensed master plumber with 20 years in the trade. Founded Ridgeline in 2009.' },
      { name: 'Danielle Cho', role: 'Service Manager', bio: 'Runs dispatch and makes sure every job is scheduled and followed up on.' },
      { name: 'Tyrese Okafor', role: 'Lead Technician', bio: 'Specializes in water heaters and whole-home repipes. 12 years experience.' },
    ],
    testimonials: [
      { name: 'Karen M.', location: 'Springfield', quote: 'Showed up within the hour for a burst pipe and had it fixed before it flooded the basement. Lifesavers.' },
      { name: 'Doug P.', location: 'Beavercreek', quote: 'Flat-rate quote was exactly what I paid. No upsell, no surprises.' },
    ],
    faqs: [
      { q: 'Do you offer emergency service?', a: 'Yes, we have technicians on call 24/7 for emergencies like burst pipes, major leaks, and loss of hot water.' },
      { q: 'Are your estimates free?', a: 'Estimates for larger jobs like repipes and sewer lines are free. Standard service calls have a flat diagnostic fee applied to the repair.' },
      { q: 'Are you licensed and insured?', a: 'Yes. Every technician is licensed, background-checked, and fully insured.' },
    ],
  },
  {
    slug: 'hvac',
    industry: 'HVAC',
    name: 'TrueComfort Heating & Air',
    tagline: 'Keeping your home comfortable in every season.',
    accent: '#ea580c',
    phone: '(555) 274-6610',
    email: 'hello@truecomforthvac.com',
    address: '805 Commerce Drive, Round Rock, TX 78664',
    established: '2014',
    emergencyLine: 'Same-day and after-hours service available when your system goes down.',
    about: [
      'TrueComfort Heating & Air installs, repairs, and maintains residential and light-commercial HVAC systems across the greater Austin area. We are a Carrier Factory Authorized Dealer with NATE-certified technicians.',
      'We believe in fixing what can be fixed and only recommending replacement when it genuinely saves you money. Every install comes with a satisfaction guarantee.',
    ],
    hours: STD_HOURS,
    serviceAreas: ['Round Rock', 'Austin', 'Cedar Park', 'Pflugerville', 'Georgetown', 'Leander'],
    services: [
      { name: 'AC Repair', description: 'Diagnosis and repair for all makes and models, usually same day.', price: 'From $89' },
      { name: 'AC & Furnace Installation', description: 'High-efficiency system design and install with financing available.', price: 'Free estimate' },
      { name: 'Seasonal Tune-Up', description: 'Precision tune-up to keep your system efficient and under warranty.', price: '$119' },
      { name: 'Indoor Air Quality', description: 'Air purifiers, humidifiers, and duct cleaning.', price: 'From $199' },
      { name: 'Heat Pump Service', description: 'Repair and replacement for heat pump systems.', price: 'From $129' },
      { name: 'Maintenance Plan', description: 'Two visits a year, priority scheduling, and 15% off repairs.', price: '$199/yr' },
    ],
    team: [
      { name: 'Brian Alvarez', role: 'Owner', bio: 'Second-generation HVAC contractor. NATE-certified and EPA Universal licensed.' },
      { name: 'Priya Nair', role: 'Office Manager', bio: 'Handles scheduling, financing, and warranty registration for every customer.' },
      { name: 'Sam Whitfield', role: 'Install Lead', bio: 'Leads the install crew. Specializes in high-efficiency and zoned systems.' },
    ],
    testimonials: [
      { name: 'Rhonda T.', location: 'Cedar Park', quote: 'AC died in July. They were out the same afternoon and had us cool again by dinner.' },
      { name: 'Miguel S.', location: 'Austin', quote: 'Did not try to sell me a new unit. Fixed the capacitor and I was good. Honest shop.' },
    ],
    faqs: [
      { q: 'How often should I service my system?', a: 'Twice a year is ideal, once before cooling season and once before heating season. Our maintenance plan covers both.' },
      { q: 'Do you offer financing on new systems?', a: 'Yes, we offer financing with approved credit, including options with no interest if paid in full within the promo period.' },
      { q: 'What brands do you service?', a: 'We service all makes and models, and install Carrier, Trane, and Lennox systems.' },
    ],
  },
  {
    slug: 'dental',
    industry: 'Dental',
    name: 'Brightwater Family Dental',
    tagline: 'Gentle, modern dentistry for the whole family.',
    accent: '#0891b2',
    phone: '(555) 882-3047',
    email: 'smile@brightwaterdental.com',
    address: '240 Lakeside Boulevard, Suite 3, Naperville, IL 60540',
    established: '2011',
    about: [
      'Brightwater Family Dental is a full-service family and cosmetic dental practice. We see patients of all ages, from first checkups to full smile makeovers, in a calm, modern office.',
      'We are in-network with most major PPO insurance plans and offer a membership plan for patients without insurance. New patients are always welcome.',
    ],
    hours: [
      { day: 'Monday', open: '8:00 AM', close: '5:00 PM' },
      { day: 'Tuesday', open: '8:00 AM', close: '5:00 PM' },
      { day: 'Wednesday', open: '10:00 AM', close: '7:00 PM' },
      { day: 'Thursday', open: '8:00 AM', close: '5:00 PM' },
      { day: 'Friday', open: '8:00 AM', close: '2:00 PM' },
      { day: 'Saturday', closed: true },
      { day: 'Sunday', closed: true },
    ],
    serviceAreas: ['Naperville', 'Aurora', 'Wheaton', 'Lisle', 'Bolingbrook'],
    services: [
      { name: 'Cleanings & Checkups', description: 'Routine exams, cleanings, and digital X-rays.', price: 'From $95' },
      { name: 'Teeth Whitening', description: 'In-office and take-home professional whitening.', price: 'From $299' },
      { name: 'Invisalign', description: 'Clear aligner treatment with free consultation.', price: 'Free consult' },
      { name: 'Crowns & Bridges', description: 'Same-day crowns available with CEREC technology.', price: 'From $950' },
      { name: 'Dental Implants', description: 'Single-tooth and full-arch implant restoration.', price: 'Free consult' },
      { name: 'Emergency Dentistry', description: 'Same-day appointments for toothaches and broken teeth.', price: 'From $120' },
    ],
    team: [
      { name: 'Dr. Allison Brightwater, DDS', role: 'Lead Dentist', bio: 'Practicing since 2007. Member of the American Dental Association and AACD.' },
      { name: 'Dr. Omar Haddad, DMD', role: 'Associate Dentist', bio: 'Focuses on implants and cosmetic dentistry.' },
      { name: 'Jenna Ruiz, RDH', role: 'Lead Hygienist', bio: 'Keeps patients comfortable and makes cleanings easy.' },
      { name: 'Monica Lee', role: 'Office Coordinator', bio: 'Handles scheduling, insurance, and new-patient paperwork.' },
    ],
    testimonials: [
      { name: 'Steph R.', location: 'Naperville', quote: 'My kids actually like coming here. The whole team is so gentle and patient.' },
      { name: 'Alan V.', location: 'Lisle', quote: 'Got a same-day crown. Walked in with a broken tooth, walked out fixed.' },
    ],
    faqs: [
      { q: 'Are you accepting new patients?', a: 'Yes, we welcome new patients of all ages and usually have openings within the week.' },
      { q: 'Do you take my insurance?', a: 'We are in-network with most major PPO plans. Call us with your plan details and we will confirm your coverage.' },
      { q: 'What if I have a dental emergency?', a: 'Call us as early as you can and we will do everything we can to see you the same day.' },
    ],
  },
  {
    slug: 'law',
    industry: 'Law Firm',
    name: 'Hartwell & Associates',
    tagline: 'Experienced representation when it matters most.',
    accent: '#1e3a8a',
    phone: '(555) 441-9200',
    email: 'intake@hartwelllaw.com',
    address: '1100 Montgomery Street, 4th Floor, Savannah, GA 31401',
    established: '2003',
    about: [
      'Hartwell & Associates is a boutique law firm handling personal injury, family law, and estate planning for clients across coastal Georgia. We have recovered millions for injury clients and guided hundreds of families through difficult transitions.',
      'Consultations are free and confidential. On injury matters, you pay nothing unless we win your case.',
    ],
    hours: [
      { day: 'Monday', open: '9:00 AM', close: '5:30 PM' },
      { day: 'Tuesday', open: '9:00 AM', close: '5:30 PM' },
      { day: 'Wednesday', open: '9:00 AM', close: '5:30 PM' },
      { day: 'Thursday', open: '9:00 AM', close: '5:30 PM' },
      { day: 'Friday', open: '9:00 AM', close: '4:00 PM' },
      { day: 'Saturday', closed: true },
      { day: 'Sunday', closed: true },
    ],
    serviceAreas: ['Savannah', 'Pooler', 'Richmond Hill', 'Hinesville', 'Statesboro'],
    services: [
      { name: 'Personal Injury', description: 'Car accidents, slip-and-fall, and wrongful death claims.', price: 'No fee unless we win' },
      { name: 'Family Law', description: 'Divorce, custody, and child support representation.', price: 'Free consult' },
      { name: 'Estate Planning', description: 'Wills, trusts, and powers of attorney.', price: 'From $450' },
      { name: 'Probate', description: 'Guidance through estate administration and probate court.', price: 'Free consult' },
      { name: 'Business Formation', description: 'LLC and corporation setup and operating agreements.', price: 'From $750' },
    ],
    team: [
      { name: 'Vivian Hartwell, Esq.', role: 'Founding Partner', bio: 'Trial attorney with over 20 years of experience in personal injury and family law.' },
      { name: 'Daniel Okoye, Esq.', role: 'Partner', bio: 'Leads the estate planning and probate practice.' },
      { name: 'Rebecca Sloan', role: 'Client Intake Coordinator', bio: 'The first person you talk to. Gets your case in front of the right attorney fast.' },
    ],
    testimonials: [
      { name: 'Teresa B.', location: 'Savannah', quote: 'They handled my accident claim start to finish and got far more than the insurance first offered.' },
      { name: 'Marcus D.', location: 'Pooler', quote: 'Made a hard custody situation feel manageable. Always returned my calls.' },
    ],
    faqs: [
      { q: 'Is the first consultation really free?', a: 'Yes, your initial consultation is always free and confidential.' },
      { q: 'How much does a personal injury case cost?', a: 'Injury cases are handled on contingency, which means you pay nothing unless we recover money for you.' },
      { q: 'How soon should I call after an accident?', a: 'As soon as possible. Evidence and deadlines matter, so earlier is always better.' },
    ],
  },
  {
    slug: 'salon',
    industry: 'Salon & Spa',
    name: 'Luster Hair & Skin Studio',
    tagline: 'Look good, feel better.',
    accent: '#be185d',
    phone: '(555) 330-7788',
    email: 'book@lusterstudio.com',
    address: '58 Pearl Street, Burlington, VT 05401',
    established: '2016',
    about: [
      'Luster is a full-service hair and skin studio in downtown Burlington. Our stylists and estheticians specialize in color, cuts, facials, and waxing in a relaxed, welcoming space.',
      'Walk-ins are welcome when we have availability, but booking ahead is recommended, especially for color and weekend appointments.',
    ],
    hours: [
      { day: 'Monday', closed: true },
      { day: 'Tuesday', open: '9:00 AM', close: '7:00 PM' },
      { day: 'Wednesday', open: '9:00 AM', close: '7:00 PM' },
      { day: 'Thursday', open: '9:00 AM', close: '8:00 PM' },
      { day: 'Friday', open: '9:00 AM', close: '8:00 PM' },
      { day: 'Saturday', open: '8:00 AM', close: '6:00 PM' },
      { day: 'Sunday', open: '10:00 AM', close: '4:00 PM' },
    ],
    serviceAreas: ['Burlington', 'South Burlington', 'Winooski', 'Essex', 'Shelburne'],
    services: [
      { name: 'Haircut & Style', description: 'Consultation, cut, and finish for all hair types.', price: 'From $55' },
      { name: 'Color & Highlights', description: 'Single-process, balayage, and full highlights.', price: 'From $120' },
      { name: 'Facials', description: 'Custom facials for hydration, acne, and anti-aging.', price: 'From $85' },
      { name: 'Waxing', description: 'Brow, face, and body waxing.', price: 'From $15' },
      { name: 'Keratin Treatment', description: 'Smoothing treatment for frizz-free hair.', price: 'From $200' },
      { name: 'Bridal & Event Styling', description: 'Hair and makeup for weddings and special events.', price: 'Free consult' },
    ],
    team: [
      { name: 'Nadia Petrov', role: 'Owner & Master Stylist', bio: 'Color specialist with 15 years behind the chair.' },
      { name: 'Chloe Barnes', role: 'Senior Stylist', bio: 'Known for lived-in blonde and balayage.' },
      { name: 'Aisha Rahman', role: 'Lead Esthetician', bio: 'Licensed esthetician focused on custom facials and skincare.' },
    ],
    testimonials: [
      { name: 'Jordan K.', location: 'Burlington', quote: 'Best balayage I have ever had. Nadia really listens to what you want.' },
      { name: 'Emily W.', location: 'Winooski', quote: 'The facials here are unreal. I leave glowing every time.' },
    ],
    faqs: [
      { q: 'Do you take walk-ins?', a: 'We take walk-ins when we have availability, but we recommend booking ahead, especially for color and weekends.' },
      { q: 'What is your cancellation policy?', a: 'We ask for 24 hours notice to cancel or reschedule so we can offer the spot to another guest.' },
      { q: 'Do you do bridal parties?', a: 'Yes, we offer on-site and in-studio bridal hair and makeup. Book a free consultation to plan your day.' },
    ],
  },
  {
    slug: 'auto-repair',
    industry: 'Auto Repair',
    name: 'Summit Auto Care',
    tagline: 'Dealer-quality repair without the dealer price.',
    accent: '#b91c1c',
    phone: '(555) 612-0405',
    email: 'shop@summitautocare.com',
    address: '3312 Industrial Parkway, Boise, ID 83704',
    established: '2008',
    about: [
      'Summit Auto Care is a full-service independent auto repair shop. Our ASE-certified technicians work on all makes and models, foreign and domestic, with a 3-year/36,000-mile warranty on most repairs.',
      'We explain what your car actually needs in plain language, send photos of what we find, and never do work you did not approve.',
    ],
    hours: STD_HOURS,
    serviceAreas: ['Boise', 'Meridian', 'Nampa', 'Eagle', 'Garden City', 'Kuna'],
    services: [
      { name: 'Oil Change', description: 'Full-synthetic oil change with multi-point inspection.', price: 'From $59' },
      { name: 'Brake Service', description: 'Pads, rotors, and full brake system inspection.', price: 'From $179' },
      { name: 'Check Engine Diagnostics', description: 'Computer diagnostics with a clear explanation of the fix.', price: '$109' },
      { name: 'Tire Mount & Alignment', description: 'Tire sales, mounting, balancing, and 4-wheel alignment.', price: 'From $89' },
      { name: 'Transmission Service', description: 'Fluid service and transmission repair.', price: 'Free estimate' },
      { name: 'Pre-Purchase Inspection', description: 'Full inspection before you buy a used car.', price: '$129' },
    ],
    team: [
      { name: 'Greg Donovan', role: 'Owner & Master Technician', bio: 'ASE Master Certified with 25 years turning wrenches.' },
      { name: 'Lena Fischer', role: 'Service Advisor', bio: 'Translates car problems into plain English and keeps you updated.' },
      { name: 'Carlos Mendez', role: 'Lead Technician', bio: 'Diagnostics and drivability specialist.' },
    ],
    testimonials: [
      { name: 'Pat H.', location: 'Meridian', quote: 'They sent me photos of the worn brakes before touching anything. Fair price, fast turnaround.' },
      { name: 'Dana L.', location: 'Boise', quote: 'Dealer wanted $1,200. Summit found the real problem and fixed it for a third of that.' },
    ],
    faqs: [
      { q: 'Do you work on my make and model?', a: 'Yes, our ASE-certified techs service all makes and models, both foreign and domestic.' },
      { q: 'Do your repairs come with a warranty?', a: 'Most repairs are backed by a 3-year/36,000-mile warranty on parts and labor.' },
      { q: 'Do I need an appointment?', a: 'Appointments are recommended, but we take walk-ins for quick services like oil changes when the bay is open.' },
    ],
  },
];

export function getSampleSite(slug: string): SampleSite | undefined {
  return SAMPLE_SITES.find((s) => s.slug === slug);
}