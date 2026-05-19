import type { Metadata } from 'next';
import AgencyFAQPage from './client-page';

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Frequently asked questions about your AI receptionist — setup, call forwarding, appointments, HIPAA compliance, and more.',
};

export default function Page() {
  return <AgencyFAQPage />;
}
