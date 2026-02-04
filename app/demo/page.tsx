'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { ArrowLeft, Calendar, Clock, Video } from 'lucide-react';

export default function DemoPage() {
  // Load Calendly widget script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup script on unmount
      const existingScript = document.querySelector('script[src="https://assets.calendly.com/assets/external/widget.js"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-[#fafaf9]">
      {/* Premium grain overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.02] z-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/[0.05] rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 sm:h-20 items-center justify-between">
            <Link 
              href="/" 
              className="flex items-center gap-2 text-[#fafaf9]/60 hover:text-[#fafaf9] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Back to Home</span>
            </Link>
            
            <Link href="/" className="flex items-center gap-2.5">
              <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center bg-white/5">
                <WaveformIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-base sm:text-lg font-semibold tracking-tight">VoiceAI Connect</span>
            </Link>
            
            <div className="w-24" /> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          {/* Header Section */}
          <div className="text-center mb-10 sm:mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-1.5 text-sm mb-6">
              <Calendar className="h-4 w-4 text-emerald-400" />
              <span className="text-emerald-300/90">Schedule a Call</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight">
              Let's talk about your
              <span className="block mt-1 bg-gradient-to-r from-emerald-400 to-white bg-clip-text text-transparent">
                AI receptionist agency
              </span>
            </h1>
            
            <p className="mt-4 sm:mt-6 text-base sm:text-lg text-[#fafaf9]/50 max-w-2xl mx-auto">
              Book a quick call to see how VoiceAI Connect can help you launch and scale 
              your AI receptionist business.
            </p>
            
            {/* Quick info */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm text-[#fafaf9]/40">
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-400" />
                30 minutes
              </span>
              <span className="flex items-center gap-2">
                <Video className="h-4 w-4 text-emerald-400" />
                Zoom call
              </span>
            </div>
          </div>

          {/* Calendly Embed Container */}
          <div className="relative rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
            {/* Subtle glow behind */}
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/[0.03] to-transparent pointer-events-none" />
            
            {/* Calendly Widget */}
            <div 
              className="calendly-inline-widget" 
              data-url="https://calendly.com/gibsonthompson1/30min?hide_gdpr_banner=1&background_color=0a0a0a&text_color=fafaf9&primary_color=10b981"
              style={{ 
                minWidth: '320px', 
                height: '700px',
              }}
            />
          </div>

          {/* Bottom note */}
          <p className="mt-8 text-center text-sm text-[#fafaf9]/30">
            Can't find a time that works? Email us at{' '}
            <a 
              href="mailto:gibson@voiceaiconnect.com" 
              className="text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              gibson@voiceaiconnect.com
            </a>
          </p>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-[#fafaf9]/30">
            © 2026 VoiceAI Connect. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

// Waveform icon component
function WaveformIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="2" y="9" width="2" height="6" rx="1" fill="currentColor" opacity="0.6" />
      <rect x="5" y="7" width="2" height="10" rx="1" fill="currentColor" opacity="0.8" />
      <rect x="8" y="4" width="2" height="16" rx="1" fill="currentColor" />
      <rect x="11" y="6" width="2" height="12" rx="1" fill="currentColor" />
      <rect x="14" y="3" width="2" height="18" rx="1" fill="currentColor" />
      <rect x="17" y="7" width="2" height="10" rx="1" fill="currentColor" opacity="0.8" />
      <rect x="20" y="9" width="2" height="6" rx="1" fill="currentColor" opacity="0.6" />
    </svg>
  );
}