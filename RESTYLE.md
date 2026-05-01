# RESTYLE.md — VoiceAI Connect Site-Wide Restyling Guide

## MISSION

The homepage (`app/page.tsx`) and global CSS (`app/globals.css`) have been redesigned with a Telnyx-inspired design system: dark/light section alternation, massive Sora display typography, bordered pill buttons, scroll reveal animations, and premium visual craft.

**Every other page on the site still uses the old design.** They need to be restyled to match the new homepage's design language. This includes marketing pages, the blog system, legal pages, and any other public-facing pages.

---

## DESIGN SYSTEM (already established in globals.css)

Reference `app/globals.css` for the full system. Key elements:

### Colors
- **Dark sections:** `#000000` background, `#fafaf9` text
- **Light sections:** `#F5F0EA` (cream) background, `#1a1a1a` text
- **Accent:** `#4AEABC` (mint/emerald)

### Typography
- **Display headlines:** `var(--font-sora)` — use `.display-xl`, `.display-lg`, `.display-md` classes
- **Body text:** `var(--font-jakarta)` — Plus Jakarta Sans
- **Labels:** `.label-uppercase` — Sora, 12px, weight 600, 0.15em letter-spacing, uppercase
- **Stats:** `.stat-number` — Sora, clamp(3.5rem, 8vw, 7rem)

### Buttons
- `.btn-pill-primary` — White fill on dark, black fill on light, uppercase, letter-spacing, rounded-full, inverts on hover
- `.btn-pill-secondary` — Border only, uppercase, letter-spacing, transparent fill

### Sections
- `.section-dark` — Black bg, white text
- `.section-light` — Cream bg, dark text
- Alternate between these. Every page should have at least one transition.

### Animations
- `.reveal` + `.visible` — Fade-up on scroll via Intersection Observer
- `.reveal-delay-1` through `.reveal-delay-4` — Staggered timing

---

## PAGES TO RESTYLE

### Priority 1 — Marketing Pages (user-facing, high traffic)

These pages currently have the OLD dark-only design with WaveformIcon SVGs, old nav, old footer. They need complete visual overhauls matching the homepage aesthetic.

**For each page: reuse the homepage's nav and footer exactly** (copy from `app/page.tsx`). Don't rebuild the nav/footer per-page — extract them into shared components if not already done, or just copy the JSX.

| Page | Path | What it is | Notes |
|------|------|-----------|-------|
| **Platform** | `app/platform/page.tsx` | Deep-dive on all features | Use dark/light alternation. Tabbed sections like homepage. Don't feature-dump — group by who benefits (agency owner vs their client) |
| **Features** | `app/features/page.tsx` | Feature grid/list | May overlap with Platform — consider merging or differentiating. Features could focus on the AI receptionist capabilities while Platform focuses on the agency tools |
| **How It Works** | `app/how-it-works/page.tsx` | Step-by-step flow | The homepage already has a "How It Works" stacking section. This page should expand on it with more detail, screenshots, and use cases |
| **Referral Program** | `app/referral-program/page.tsx` | Affiliate/referral details | Light section friendly. Clean, simple, CTA-driven |
| **Interactive Demo** | `app/interactive-demo/page.tsx` | Demo experience | If this exists, it should be polished. This is a high-conversion page |

### Priority 2 — Blog System (affects 64+ existing posts + all future posts)

**CRITICAL: You do NOT need to touch individual blog posts.** The blog uses a shared architecture:

#### How the blog works:

1. **Handcoded posts** — Individual `.tsx` files in `app/blog/[post-slug]/page.tsx` folders. They import `BlogPostLayout` from `app/blog/blog-post-layout.tsx` and their content is styled by `app/blog/article.css`.

2. **Generated posts (from blog-farm)** — Stored as HTML in Supabase. Rendered via the dynamic route `app/blog/[slug]/page.tsx` which wraps the HTML in `BlogPostLayout` and uses `dangerouslySetInnerHTML`. Styled by `app/blog/[slug]/generated-post.css`.

3. **Blog listing page** — `app/blog/page.tsx` (server component that fetches posts from Supabase and passes to a client page)

#### Files to update (this restyles ALL posts automatically):

| File | Purpose | What to change |
|------|---------|---------------|
| `app/blog/blog-post-layout.tsx` | Shared wrapper for ALL posts — nav, header, sidebar TOC, author info, CTA box, share buttons, footer | Restyle to match new design system. Use the new nav/footer. Apply dark/light sections (article body could be light cream for readability). Update CTA box styling. |
| `app/blog/article.css` | Typography and element styles for handcoded post content (`.article-content > h2`, paragraph spacing, blockquotes, lists, code blocks, etc.) | Update to match new typography scale. Consider light background for article body (cream) with dark text for readability. |
| `app/blog/[slug]/generated-post.css` | Same as article.css but for blog-farm generated HTML. Targets `.article-content div >` selectors (extra wrapper div from dangerouslySetInnerHTML). Styles tables, CTA boxes, callouts, FAQ items, stat highlights. | Mirror the article.css changes but with the extra div nesting. Keep all the generated content element styles (tables, callouts, etc.) working. |
| `app/blog/page.tsx` | Blog listing/index page | Restyle the grid of post cards, category filters, header. Use cream background. |

#### Blog-farm compatibility warning:
The blog-farm (`gibsonthompson/blog-farm` repo) generates HTML with specific class names and structures. The `generated-post.css` must continue to style these elements correctly. Key generated HTML structures to preserve support for:
- `.cta-box` — Call-to-action boxes within posts
- `.callout` / `.callout-*` — Info/warning/tip callouts
- `.faq-item` — FAQ sections within posts
- `.stat-highlight` — Stat callout boxes
- `.comparison-table` — Comparison tables
- Standard HTML: `<h2>`, `<h3>`, `<p>`, `<ul>`, `<ol>`, `<blockquote>`, `<table>`, `<code>`, `<pre>`

**DO NOT change the blog-farm repo or its templates.** Only change the VoiceAI Connect site's rendering of that content.

### Priority 3 — Legal Pages

| Page | Path | Notes |
|------|------|-------|
| **Terms** | `app/terms/page.tsx` | Long-form legal text. Use cream/light background for readability. New nav/footer. |
| **Privacy** | `app/privacy/page.tsx` | Same treatment as Terms. |

---

## PAGES ALREADY RESTYLED (DO NOT TOUCH)

These have already been updated in recent sessions:

- `app/page.tsx` — Homepage (Telnyx-inspired redesign, DONE)
- `app/globals.css` — Global styles (DONE)
- `app/signup/page.tsx` — Agency signup (zoom 0.8, actual logo, DONE)
- `app/agency/login/page.tsx` — Agency login (zoom 0.8, actual logo, DONE)
- `app/onboarding/page.tsx` — Onboarding flow (zoom 0.75, 2-step, DONE)
- `app/auth/set-password/page.tsx` — Password setup (zoom 0.8, DONE)
- `app/layout.tsx` — Root layout (DO NOT MODIFY — contains fonts, GTM, PWA config)

---

## SHARED COMPONENT STRATEGY

The current site has NO shared nav/footer component — each page rebuilds its own. This is fragile and means every page needs manual updates.

**Recommended approach:**
1. Extract the homepage nav into `components/marketing-nav.tsx`
2. Extract the homepage footer into `components/marketing-footer.tsx`
3. Use these in all marketing pages, blog layout, and legal pages
4. This prevents style drift and makes future updates trivial

If extracting shared components feels too risky mid-restyle, at minimum copy the exact nav/footer JSX from the homepage into each page to ensure visual consistency.

---

## STYLE RULES FOR ALL PAGES

1. **Dark/light alternation** — Every page must have at least one section color change. Hero can be dark, content can be light, CTA can be dark, etc.
2. **Sora for headlines** — All display text uses `var(--font-sora)`. Never use Jakarta Sans for headlines.
3. **Bordered pill buttons** — Uppercase, letter-spacing. Use `.btn-pill-primary` and `.btn-pill-secondary`. No filled rounded buttons with lowercase text.
4. **Uppercase labels** — Section eyebrows use `.label-uppercase` (e.g., "PLATFORM", "COMPETITION", "PRICING")
5. **Generous whitespace** — Sections should have `py-24 lg:py-40` padding minimum. Don't crowd elements.
6. **Scroll reveal** — Use Intersection Observer to animate sections in. Use the `reveal` / `visible` pattern from globals.css.
7. **No emerald icon grids** — The old design used emerald-colored Lucide icons in grids. Replace with more creative visual treatments.
8. **Max width** — Content area is `max-w-[1400px]` with `px-6 lg:px-12` padding, matching homepage.
9. **Mobile responsive** — Test at 375px. Bottom CTA bar on mobile. Safe area insets.

---

## BLOG-SPECIFIC STYLE GUIDANCE

The blog is where most organic traffic lands. It needs to be:

1. **Readable** — Article body on cream/light background with dark text. Good line-height (1.75+), comfortable max-width (720px for text).
2. **Professional** — Author info, published date, read time, category badge. Table of contents in sidebar on desktop.
3. **Converting** — CTA boxes within posts and at the end. "Start Your Free Trial" with the new pill button style.
4. **Consistent** — The blog listing page, individual post pages, and the post content itself should all feel like the same brand as the homepage.

### Article body typography (for article.css and generated-post.css):
- `h2`: Sora, ~1.75rem, font-weight 700, margin-top 2.5rem
- `h3`: Sora, ~1.35rem, font-weight 600, margin-top 2rem
- `p`: Jakarta Sans, 1.0625rem, line-height 1.8, color: rgba(0,0,0,0.7)
- `ul/ol`: Slight left indent, custom bullet styling
- `blockquote`: Left border (mint/emerald), subtle background tint
- `code`: Mono font, slight background, rounded
- `table`: Clean borders, alternating row shading, responsive scroll on mobile
- Links: Mint/emerald color, underline on hover

---

## WHAT SUCCESS LOOKS LIKE

When done, a user should be able to:
1. Land on the homepage → see the new Telnyx-inspired design
2. Click "Platform" → see the SAME design language, same nav, same footer, dark/light alternation
3. Click a blog post → see a clean, readable article with the same brand feel
4. Navigate to Terms → see a professional legal page with the same nav/footer
5. **Every page feels like it belongs to the same $10K website**

No page should look "old" or "different" from the homepage. The entire site should feel cohesive and premium.
