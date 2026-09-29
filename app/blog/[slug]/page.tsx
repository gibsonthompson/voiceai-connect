// app/blog/[slug]/page.tsx
//
// Dynamic catch-all for blog-farm auto-generated posts.
// Static .tsx blog posts take priority — Next.js serves those first.
// This only catches slugs without a dedicated .tsx page.

import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import BlogPostLayout from '../blog-post-layout';
import './generated-post.css';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUSINESS_SLUG = 'voiceai-connect';

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const { data: biz } = await supabase
      .from('blog_businesses').select('id').eq('slug', BUSINESS_SLUG).single();
    if (!biz) return [];

    const { data: posts } = await supabase
      .from('blog_generated_posts')
      .select('slug')
      .eq('business_id', biz.id)
      .eq('status', 'published');

    return (posts || []).map(p => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

async function getPost(slug: string) {
  try {
    const { data: biz } = await supabase
      .from('blog_businesses').select('id').eq('slug', BUSINESS_SLUG).single();
    if (!biz) return null;

    const { data: post } = await supabase
      .from('blog_generated_posts')
      .select('title, slug, html_content, meta_description, primary_keyword, secondary_keywords, category, publish_date, read_time, word_count')
      .eq('business_id', biz.id)
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    return post;
  } catch {
    return null;
  }
}

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.meta_description || post.title,
    keywords: post.primary_keyword
      ? [post.primary_keyword, ...(post.secondary_keywords || [])]
      : undefined,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title: post.title,
      description: post.meta_description || post.title,
      type: 'article',
      publishedTime: post.publish_date || undefined,
      authors: ['VoiceAI Connect'],
    },
  };
}

function mapCategory(cat: string | null): string {
  if (!cat) return 'guides';
  const map: Record<string, string> = {
    guide: 'guides', guides: 'guides', 'how-to': 'guides',
    comparison: 'industry', industry: 'industry',
    'cost-analysis': 'guides', statistics: 'industry', product: 'product',
  };
  return map[cat] || 'guides';
}

// Extract FAQ question/answer pairs from the generated HTML so we can emit
// FAQPage JSON-LD. AI answer engines lean on FAQPage schema heavily (it is the
// single most-cited schema type for direct-answer generation), and the posts
// already contain a full FAQ section — this just makes it machine-readable.
// Handles the writer's <div class="faq-section"> with h3/h4 questions followed
// by answer paragraphs, and also a definition-list style if present.
function extractFaqSchema(html: string): object | null {
  // Isolate the FAQ section if present, else scan whole doc.
  const sectionMatch = html.match(/<div[^>]*class="[^"]*faq-section[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?:<div[^>]*class="key-takeaways|$)/i);
  const scope = sectionMatch ? sectionMatch[1] : html;

  const faqs: { q: string; a: string }[] = [];

  // Pattern: a heading (h2/h3/h4) that looks like a question, followed by one or
  // more <p> answers until the next heading.
  const blockRe = /<(h[234])[^>]*>([\s\S]*?)<\/\1>\s*([\s\S]*?)(?=<h[234][^>]*>|$)/gi;
  let m;
  while ((m = blockRe.exec(scope)) !== null) {
    const qRaw = m[2].replace(/<[^>]*>/g, '').trim();
    if (!qRaw || !qRaw.includes('?')) continue; // only treat question-shaped headings as FAQs
    // Answer = strip tags from the following block, collapse whitespace.
    const aRaw = m[3].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    if (qRaw && aRaw && aRaw.length > 20) {
      faqs.push({ q: qRaw, a: aRaw.slice(0, 1200) });
    }
  }

  if (faqs.length < 2) return null;

  return {
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

export default async function GeneratedBlogPost({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post || !post.html_content) {
    notFound();
  }

  // Extract table of contents from h2 ids in the generated HTML
  const tocItems: { id: string; title: string; level: number }[] = [];
  const h2Regex = /<h2[^>]*id="([^"]*)"[^>]*>(.*?)<\/h2>/gi;
  let match;
  while ((match = h2Regex.exec(post.html_content)) !== null) {
    tocItems.push({ id: match[1], title: match[2].replace(/<[^>]*>/g, ''), level: 2 });
  }

  // Build the JSON-LD @graph: Article + Organization, plus FAQPage when the post
  // has a usable FAQ section.
  const graph: object[] = [
    {
      '@type': 'Article',
      headline: post.title,
      description: post.meta_description || post.title,
      datePublished: post.publish_date || new Date().toISOString().split('T')[0],
      dateModified: post.publish_date || new Date().toISOString().split('T')[0],
      author: { '@type': 'Organization', name: 'VoiceAI Connect', '@id': 'https://www.myvoiceaiconnect.com/#organization' },
      publisher: { '@id': 'https://www.myvoiceaiconnect.com/#organization' },
      mainEntityOfPage: `https://www.myvoiceaiconnect.com/blog/${post.slug}`,
      wordCount: post.word_count || undefined,
    },
    {
      '@type': 'Organization',
      '@id': 'https://www.myvoiceaiconnect.com/#organization',
      name: 'VoiceAI Connect',
      url: 'https://www.myvoiceaiconnect.com',
      sameAs: ['https://www.linkedin.com/company/voiceai-connect/'],
    },
  ];

  const faqSchema = extractFaqSchema(post.html_content);
  if (faqSchema) graph.push(faqSchema);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }),
        }}
      />

      <BlogPostLayout
        meta={{
          title: post.title,
          description: post.meta_description || post.title,
          category: mapCategory(post.category),
          publishedAt: post.publish_date || new Date().toISOString().split('T')[0],
          readTime: post.read_time || `${Math.ceil((post.word_count || 2000) / 200)} min read`,
          author: { name: 'VoiceAI Connect', role: 'AI Receptionist Platform for Agencies' },
          tags: post.primary_keyword
            ? [post.primary_keyword, ...(post.secondary_keywords || []).slice(0, 3)]
            : undefined,
        }}
        tableOfContents={tocItems}
      >
        <div dangerouslySetInnerHTML={{ __html: post.html_content }} />
      </BlogPostLayout>
    </>
  );
}