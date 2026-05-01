'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ArrowUpRight, Menu, X } from 'lucide-react';

const NAV_LINKS: [string, string][] = [
  ['Platform', '/platform'],
  ['How it works', '/how-it-works'],
  ['Demo', '/interactive-demo'],
  ['Pricing', '/#pricing'],
  ['Blog', '/blog'],
];

export default function MarketingNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 30);
    h();
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-black/85 backdrop-blur-xl border-b border-white/[0.05]' : ''}`}>
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <img src="/icon-512x512.png" alt="VoiceAI Connect" className="w-8 h-8 rounded-md" />
          <span className="font-display font-medium text-[15px] text-white tracking-tight">VoiceAI Connect</span>
        </Link>
        <div className="hidden lg:flex items-center gap-9 text-[13px] text-white/60">
          {NAV_LINKS.map(([n, h]) => (
            <Link key={n} href={h} className="hover:text-white transition-colors">{n}</Link>
          ))}
        </div>
        <div className="hidden lg:flex items-center gap-4">
          <Link href="/agency/login" className="text-[13px] text-white/60 hover:text-white">Log in</Link>
          <Link href="/signup" className="btn btn-em">Start trial <ArrowUpRight className="w-3.5 h-3.5" /></Link>
        </div>
        <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden text-white/70" aria-label="Menu">
          <Menu className="w-5 h-5" />
        </button>
      </div>
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black z-50 flex flex-col">
          <div className="flex items-center justify-between px-6 h-16 border-b border-white/5">
            <div className="flex items-center gap-2.5">
              <img src="/icon-512x512.png" alt="VoiceAI Connect" className="w-7 h-7 rounded-md" />
              <span className="font-display font-medium text-white">VoiceAI Connect</span>
            </div>
            <button onClick={() => setMenuOpen(false)} className="text-white" aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 flex flex-col px-6 py-10 gap-5">
            {[...NAV_LINKS, ['Log in', '/agency/login'] as [string, string]].map(([n, h]) => (
              <Link key={n} href={h} onClick={() => setMenuOpen(false)} className="font-display text-2xl text-white/85 hover:text-white">
                {n}
              </Link>
            ))}
            <Link href="/signup" onClick={() => setMenuOpen(false)} className="btn btn-em justify-center mt-6">
              Start trial <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
