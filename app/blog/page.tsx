// app/blog/page.tsx
import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import BlogPage from './client-page';

export const revalidate = 3600;

export const metadata: Metadata = {
  alternates: { canonical: '/blog' },
};

async function getGeneratedPosts() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return [];

  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { data: biz } = await supabase
      .from('blog_businesses').select('id').eq('slug', 'voiceai-connect').single();
    if (!biz) return [];

    const { data: posts } = await supabase
      .from('blog_generated_posts')
      .select('slug, title, meta_description, category, publish_date, read_time, word_count')
      .eq('business_id', biz.id)
      .eq('status', 'published')
      .order('publish_date', { ascending: false });

    return (posts || []).map(p => ({
      slug: p.slug,
      title: p.title,
      excerpt: p.meta_description || '',
      category: mapCategory(p.category),
      publishedAt: p.publish_date || new Date().toISOString().split('T')[0],
      readTime: p.read_time || `${Math.ceil((p.word_count || 2000) / 200)} min`,
      featured: false,
      generated: true,
    }));
  } catch { return []; }
}

function mapCategory(cat: string | null): string {
  if (!cat) return 'guides';
  const m: Record<string, string> = { guide: 'guides', guides: 'guides', 'how-to': 'guides', comparison: 'comparison', industry: 'industry', 'cost-analysis': 'guides', statistics: 'industry', product: 'product' };
  return m[cat] || 'guides';
}

export default async function Page() {
  const generatedPosts = await getGeneratedPosts();
  return <BlogPage generatedPosts={generatedPosts} />;
}