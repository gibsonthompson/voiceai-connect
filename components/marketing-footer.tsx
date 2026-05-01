import Link from 'next/link';

const COLUMNS: { t: string; l: [string, string][] }[] = [
  {
    t: 'PRODUCT',
    l: [
      ['Platform', '/platform'],
      ['How it works', '/how-it-works'],
      ['Features', '/features'],
      ['Pricing', '/#pricing'],
      ['Earnings', '/#earnings'],
    ],
  },
  {
    t: 'COMPARE',
    l: [
      ['vs GoHighLevel', '/gohighlevel-ai-receptionist'],
      ['vs Autocalls', '/blog/voiceai-connect-vs-autocalls'],
      ['vs echowin', '/blog/voiceai-connect-vs-echowin'],
      ['vs Bland AI', '/voiceai-connect-vs-bland-ai'],
      ['vs Synthflow', '/voiceai-connect-vs-synthflow'],
    ],
  },
  {
    t: 'RESOURCES',
    l: [
      ['Blog', '/blog'],
      ['FAQ', '/faq'],
      ['Interactive demo', '/interactive-demo'],
      ['Get started', '/get-started'],
    ],
  },
  {
    t: 'LEGAL',
    l: [
      ['Terms', '/terms'],
      ['Privacy', '/privacy'],
      ['Referral', '/referral-program'],
      ['Contact', 'mailto:support@myvoiceaiconnect.com'],
    ],
  },
];

export default function MarketingFooter() {
  return (
    <footer className="bg-paper py-16 border-t border-black/[0.05]">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-10 mb-12">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <img src="/icon-512x512.png" alt="VoiceAI Connect" className="w-7 h-7 rounded-md" />
              <span className="font-display font-medium text-black tracking-tight">VoiceAI Connect</span>
            </Link>
            <p className="text-[13px] text-black/55 max-w-xs leading-relaxed">
              The white-label AI receptionist platform purpose-built for agencies and resellers.
            </p>
            <p className="font-mono text-[11px] text-black/30 mt-7">© 2026 VoiceAI Connect</p>
          </div>
          {COLUMNS.map(c => (
            <div key={c.t}>
              <p className="font-mono text-[10px] tracking-[0.16em] text-black/45 mb-4">{c.t}</p>
              <div className="space-y-2.5">
                {c.l.map(([n, h]) => (
                  <Link key={n} href={h} className="block text-[13px] text-black/60 hover:text-black transition-colors">
                    {n}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
