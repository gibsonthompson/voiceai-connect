'use client';

import ComparisonPage from '@/components/comparison-page';
import { COMPETITORS } from '@/lib/comparison-data';

export default function VsynthflowPage() {
  return <ComparisonPage data={COMPETITORS['synthflow']} />;
}
