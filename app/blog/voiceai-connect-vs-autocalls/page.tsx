import type { Metadata } from 'next';
import ComparisonPage from '@/components/comparison-page';
import { COMPETITORS } from '@/lib/comparison-data';

const data = COMPETITORS['autocalls'];

export const metadata: Metadata = {
  title: data.metaTitle,
  description: data.metaDescription,
  alternates: { canonical: '/blog/voiceai-connect-vs-autocalls' },
};

export default function Page() {
  return <ComparisonPage data={data} />;
}
