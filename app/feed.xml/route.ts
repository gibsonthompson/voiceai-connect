// app/feed.xml/route.ts
import { createClient } from '@supabase/supabase-js';

export const revalidate = 3600;

export async function GET() {
  const siteUrl = 'https://myvoiceaiconnect.com';
  const now = new Date().toUTCString();

  // Static posts (hand-coded .tsx pages)
  const staticPosts = [
    { slug: 'white-label-ai-receptionist-pricing-breakdown', title: 'White-Label AI Receptionist Pricing: What Agencies Actually Pay (2026)', date: '2026-04-09', desc: 'Full pricing breakdown of every major white-label AI receptionist platform.' },
    { slug: 'best-white-label-ai-receptionist-platforms-ranked', title: 'Best White-Label AI Receptionist Platforms Ranked (2026)', date: '2026-04-10', desc: '8 platforms compared on pricing, branding, voice quality, and agency economics.' },
    { slug: 'how-to-resell-ai-receptionist-services', title: 'How to Resell AI Receptionist Services: Complete Agency Guide', date: '2026-04-11', desc: 'Step-by-step guide to reselling AI receptionist services under your own brand.' },
    { slug: 'how-to-start-ai-receptionist-agency', title: 'How to Start an AI Receptionist Agency in 2026', date: '2026-01-28', desc: 'Complete guide from first clients to $50k/month recurring revenue.' },
    { slug: 'white-label-ai-receptionist-platform', title: 'White Label AI Receptionist Platform: Complete Guide', date: '2026-01-30', desc: 'Everything about white label AI receptionist platforms.' },
    { slug: 'how-to-choose-white-label-ai-receptionist-platform', title: 'How to Choose a White-Label AI Receptionist Platform', date: '2026-03-21', desc: '9 evaluation criteria that separate real platforms from noise.' },
  ];

  // Auto-generated posts from Supabase
  let dbPosts: typeof staticPosts = [];
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
      const { data: biz } = await supabase.from('blog_businesses').select('id').eq('slug', 'voiceai-connect').single();
      if (biz) {
        const { data: posts } = await supabase.from('blog_generated_posts')
          .select('slug, title, meta_description, publish_date')
          .eq('business_id', biz.id).eq('status', 'published')
          .order('publish_date', { ascending: false });
        dbPosts = (posts || []).map(p => ({ slug: p.slug, title: p.title, date: p.publish_date || new Date().toISOString().split('T')[0], desc: p.meta_description || p.title }));
      }
    }
  } catch { /* non-critical */ }

  const slugSet = new Set<string>();
  const allPosts = [...dbPosts, ...staticPosts].filter(p => { if (slugSet.has(p.slug)) return false; slugSet.add(p.slug); return true; });

  const items = allPosts.map(p => `    <item>
      <title>${esc(p.title)}</title>
      <link>${siteUrl}/blog/${p.slug}</link>
      <guid isPermaLink="true">${siteUrl}/blog/${p.slug}</guid>
      <pubDate>${new Date(p.date).toUTCString()}</pubDate>
      <description>${esc(p.desc)}</description>
      <author>support@voiceaiconnect.com (Gibson Thompson)</author>
    </item>`).join('\n');

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>VoiceAI Connect Blog</title>
    <link>${siteUrl}/blog</link>
    <description>White-label AI receptionist platform for agencies. Guides, comparisons, and strategies.</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(feed, { headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=3600, s-maxage=3600' } });
}

function esc(s: string): string { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }