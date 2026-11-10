'use client';

import ComparisonPage from '@/components/comparison-page';
import { COMPETITORS } from '@/lib/comparison-data';

export default function VsBlandAIPage() {
  return <ComparisonPage data={COMPETITORS['bland-ai']} />;
}
