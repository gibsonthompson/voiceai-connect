# CLAUDE.md — VoiceAI Connect Homepage Redesign

## CRITICAL CONTEXT

The current homepage is unacceptable. It looks like a generic AI SaaS template — text-heavy, no real animations, no visual craft, no personality. The founder (Gibson) describes it as "the worst website I have ever seen" and wants a **complete creative overhaul** that looks like it cost $10,000+ to build. This is not a tweak. This is a ground-up rebuild of `app/page.tsx` and `app/globals.css`.

**The bar is HIGH.** Think Stripe, Linear, Vercel, Telnyx — websites where every pixel is intentional, every animation is smooth, and you can feel the craft. Generic AI slop is not acceptable. Cookie-cutter layouts with emerald icons and bullet points are not acceptable. This needs to be genuinely world-class.

---

## WHAT VOICEAI CONNECT IS

VoiceAI Connect is a **white-label SaaS platform** that lets people start an AI receptionist agency. It's NOT just another AI receptionist — it's the **entire business infrastructure** for reselling AI receptionists to local businesses.

**Three-tier model:**
- **Platform** (VoiceAI Connect) → provides the infrastructure
- **Agency** (the customer) → brands it as their own, finds clients, collects payments
- **End client** (local business) → gets an AI receptionist answering their phones 24/7

Think of it as **"Shopify for AI receptionists"** — you don't build the platform, you just plug in your brand and start selling.

**What the agency owner gets:**
- White-label branding (logo, colors, domain — VoiceAI Connect is invisible)
- Automated client onboarding (client signs up → AI + phone number provisioned in 60 seconds)
- Client-facing dashboard (each client sees their calls, recordings, transcripts, summaries)
- Agency dashboard (manage all clients, revenue, billing from one place)
- White-label marketing website with interactive AI demo phone line
- Built-in leads CRM with 13+ outreach templates and Google Maps lead finder
- Stripe Connect (client payments go directly to the agency, no middleman)
- Team members (plan-gated)

**Key differentiators vs competitors:**
- vs GoHighLevel: Client-facing dashboard (GHL has none), 60-second onboarding (GHL takes days with A2P registration), mobile-first (GHL is desktop-bound), purpose-built scalpel vs Swiss Army knife
- vs Autocalls: Built-in leads CRM, client dashboard, demo phone line, lower entry price
- vs echowin: Voice-first architecture (echowin is chat-first with voice bolt-on)

**Pricing:** $99/mo Starter, $199/mo Professional (most popular), $499/mo Enterprise. Flat fee, no per-client costs, no revenue share.

---

## TARGET AUDIENCE (ICP)

**Primary:** People who want to start a real business with AI — this includes marketing agency owners, local lead gen agencies, AND the broader "how to make money with AI" audience. BUT positioned legitimately, not as a guru/course/MLM scheme.

**Who they are:**
- May be starting their first real business
- Interested in AI and recurring revenue
- Skeptical of "make money online" promises (been burned before)
- Not necessarily technical — "if you can use Instagram, you can do this"
- Want real infrastructure, not a course that teaches them to resell ChatGPT

**How to talk to them:**
- Acknowledge the skepticism: "No courses. No upsells. No guru nonsense."
- Use specific numbers, not vague promises: "$7,251/month with 50 clients at $149"
- Position it as real work, not passive income: "This isn't passive income. It's a real service business with real margins."

---

## BRAND VOICE

**Three core traits: Honest, Empathetic, Specific**

The voice is "The Experienced Friend" — someone who's already done it, showing you the path without sugarcoating. Follows StoryBrand "guide, not hero" positioning.

**Voice spectrum:**
- 70% casual, 30% formal
- 60% approachable, 40% authoritative
- 80% simple, 20% technical
- 65% serious, 35% playful
- 60% bold, 40% humble

**DO say:**
- "Here's what 50 clients at $149/month actually looks like"
- "The AI handles calls. You handle sales. That's the split."
- "Not a course — a platform."
- Use "you" constantly

**DON'T say:**
- "Unlock unlimited earning potential" (guru language)
- "Leverage our cutting-edge AI infrastructure" (corporate jargon)
- "Join thousands of successful entrepreneurs" (unverifiable)
- "Revolutionary platform" (every SaaS says this)

---

## DESIGN INSPIRATION — TELNYX

Gibson will provide screenshots of telnyx.com in the conversation. Key elements to be **inspired by** (NOT copied):

### What to take from Telnyx:
1. **Dark/light section alternation** — Pure black (#000) hero → warm cream (#F5F0EA) middle sections → dark again. Creates visual rhythm.
2. **Massive bold typography** — Headlines at 80-100px+, tight line-height, letter-spacing -0.03em. Sora font for display.
3. **3D visual elements** — Holographic cube/diamond shapes made with CSS perspective + gradient layers. Not stock imagery.
4. **Bordered pill buttons** — Uppercase text with letter-spacing, rounded-full, border style (not filled backgrounds). "START BUILDING ↓" and "CONTACT US"
5. **Trust logo bar** — "14,000+ INDUSTRY-LEADING COMPANIES CHOOSE TELNYX" with real company logos
6. **Comparison table** — Light background, "us" column highlighted with subtle background, competitor columns plain. Checkmarks and X marks. Feature descriptions are real sentences.
7. **Tabbed interactive demos** — Light section with underline tabs, showing different product views
8. **Stats with HUGE numbers** — Like "40+", "<500", "30+" at 80-100px font size
9. **Clean structured footer** — 4 columns: Social, Company, Legal, Compare
10. **Left-aligned hero** — Text on left, visual element on right (NOT centered)
11. **Scroll animations** — Elements that reveal on scroll with smooth transitions

### What NOT to do:
- Don't copy Telnyx's content or layout exactly
- Don't use their color scheme (we use emerald/mint, not their teal)
- Don't replicate their specific 3D assets
- The inspiration is the LEVEL OF CRAFT, not the specific design

---

## SPECIFIC ANIMATIONS NEEDED

### 1. Infrastructure "Wiring" Animation
The trust section currently shows plain text logos (VAPI, Telnyx, Stripe, Supabase). This needs to be a **visual animation** showing that VoiceAI Connect is essentially a bunch of powerful tools wired together with custom infrastructure on top.

**Concept:** Show the building blocks connecting into one platform:
- ElevenLabs / VAPI → Voice AI Engine
- Telnyx → Phone Numbers & SMS
- Supabase → Database & Auth
- Stripe → Payments & Billing
- Vercel → Hosting & Edge
- All connecting/flowing into → VoiceAI Connect (the orchestration layer)

This could be a **connection diagram animation**, a **flowing pipeline**, or **stacking layers** — whatever looks most impressive. The key message: "We didn't reinvent the wheel. We wired together the best tools and built the agency layer on top."

### 2. Stacking/Scroll Animation for "How It Works"
The 4 steps (Brand it, Connect Stripe, Share link, Collect revenue) should use a genuine scroll-driven stacking animation. Cards should visibly stack on top of each other as the user scrolls, with:
- Position sticky behavior
- Scale-down on cards being covered
- Possible blur or opacity changes
- Depth/shadow effects
- Should feel satisfying and intentional

### 3. White-Label Demo Visualization
Show what the white-label experience looks like — an animated or interactive visualization demonstrating:
- Agency uploads their logo → the entire platform transforms
- Client signs up → AI goes live in 60 seconds
- Calls come in → dashboard shows recordings, transcripts, summaries

This could be a CSS-animated mock dashboard, or a before/after transformation, or a step-by-step visual walkthrough. NOT just a static screenshot.

### 4. Scroll Reveal Animations
Every section should animate in on scroll — fade up, slide in, scale in, etc. Using Intersection Observer. Staggered delays for elements within sections. Should feel premium and smooth, not janky.

---

## TECHNICAL CONTEXT

**Stack:** Next.js 14 (App Router, TypeScript) on Vercel
**Fonts loaded in layout.tsx:**
- `Plus Jakarta Sans` → `--font-jakarta` (body text)
- `Sora` → `--font-sora` (display headlines, buttons, labels)
- `Inter` → `--font-inter` (UI elements)

**Key files to modify:**
- `app/page.tsx` — Complete homepage rebuild
- `app/globals.css` — Complete CSS rebuild

**Existing hooks to use:**
- `usePrice` from `@/hooks/usePrice` — Currency formatting (returns `{ formatPrice }`)

**Important:** The layout.tsx loads fonts, GTM, PWA meta tags, and other global config. DO NOT modify layout.tsx. Only modify page.tsx and globals.css.

**Existing components:**
- `DashboardSandbox` at `@/components/dashboard-sandbox` — Interactive dashboard demo component (can be used or replaced)

**Zoom:** Previous pages used zoom (0.75-0.9) but the homepage should NOT use zoom.

---

## HOMEPAGE SECTIONS (suggested order)

1. **Hero** — Left-aligned massive headline + 3D visual on right + bordered pill CTAs + trust logo bar at bottom
2. **Infrastructure Animation** — The "wired together" visualization showing the tech stack
3. **How It Works** — Stacking scroll cards (4 steps)
4. **Platform Demo** — Tabbed interactive section on light background showing Agency Dashboard, Client Dashboard, Marketing Site, Leads CRM
5. **Comparison Table** — Light background, vs GoHighLevel/Autocalls/echowin with highlighted VoiceAI Connect column
6. **Stats** — HUGE animated numbers (60s onboarding, 97% margins, 24/7 coverage)
7. **Pricing** — Clean 3-tier on light background
8. **FAQ** — Thorough, addresses "is this another make money with AI thing" head-on
9. **Final CTA** — Dark section with 3D visual and compelling close
10. **Footer** — Light, structured 4-column layout

---

## QUALITY CHECKLIST

Before considering the homepage done, verify:

- [ ] Dark/light section alternation (at least 3 transitions)
- [ ] 3D visual element in hero (CSS perspective + gradients, NOT an image)
- [ ] Real scroll animations (Intersection Observer, elements animate in)
- [ ] Stacking cards animation that's visible and satisfying
- [ ] Infrastructure wiring animation
- [ ] Tabbed product demos with realistic mockup UIs
- [ ] Comparison table with highlighted column
- [ ] Animated stat counters
- [ ] Bordered pill buttons (uppercase, letter-spacing)
- [ ] Massive display typography (80px+ headlines)
- [ ] Trust logos section
- [ ] Mobile responsive (test at 375px)
- [ ] No generic AI aesthetics (no purple gradients on white, no Inter font for headlines)
- [ ] Would someone genuinely say "this looks like a $10K website"?

---

## COPY GUIDELINES

- Headlines under 8 words
- Sub-headlines under 20 words
- Use specific numbers ("50 clients × $149 = $7,450/month")
- Address skepticism directly in FAQ
- Every CTA says "Start Free Trial" or "Start Your Free Trial"
- Comparison copy: VoiceAI Connect is a "scalpel" vs GHL's "Swiss Army knife"
- The first FAQ should address the elephant: "Wait — is this another 'make money with AI' thing?" Answer: "No courses. No upsells. No guru nonsense."

---

## DO NOT

- Use placeholder text (Lorem ipsum)
- Use stock photography or external images
- Use generic icon grids as a substitute for visual design
- Make it all one dark color (MUST alternate dark/light)
- Ship something you wouldn't put in your portfolio
- Compromise on animation quality — if it's janky, fix it
- Ignore mobile responsiveness
