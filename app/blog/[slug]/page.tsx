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
  params: { slug: string };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const post = await getPost(params.slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.meta_description || post.title,
    keywords: post.primary_keyword
      ? [post.primary_keyword, ...(post.secondary_keywords || [])]
      : undefined,
    alternates: { canonical: `/blog/${params.slug}` },
    openGraph: {
      title: post.title,
      description: post.meta_description || post.title,
      type: 'article',
      publishedTime: post.publish_date || undefined,
      authors: ['Gibson Thompson'],
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

export default async function GeneratedBlogPost({ params }: PageProps) {
  const post = await getPost(params.slug);

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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'Article',
                headline: post.title,
                description: post.meta_description || post.title,
                datePublished: post.publish_date || new Date().toISOString().split('T')[0],
                dateModified: post.publish_date || new Date().toISOString().split('T')[0],
                author: { '@type': 'Person', name: 'Gibson Thompson', jobTitle: 'Founder, VoiceAI Connect' },
                publisher: { '@id': 'https://myvoiceaiconnect.com/#organization' },
                mainEntityOfPage: `https://myvoiceaiconnect.com/blog/${post.slug}`,
                wordCount: post.word_count || undefined,
              },
              {
                '@type': 'Organization',
                '@id': 'https://myvoiceaiconnect.com/#organization',
                name: 'VoiceAI Connect',
                url: 'https://myvoiceaiconnect.com',
                sameAs: ['https://www.linkedin.com/company/voiceai-connect/'],
              },
            ],
          }),
        }}
      />

      <BlogPostLayout
        meta={{
          title: post.title,
          description: post.meta_description || post.title,
          category: mapCategory(post.category),
          publishedAt: post.publish_date || new Date().toISOString().split('T')[0],
          readTime: post.read_time || `${Math.ceil((post.word_count || 2000) / 200)} min read`,
          author: { name: 'Gibson Thompson', role: 'Founder, VoiceAI Connect' },
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