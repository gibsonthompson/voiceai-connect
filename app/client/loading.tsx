'use client';

import { useClientTheme } from '@/hooks/useClientTheme';

export default function ClientLoading() {
  let bg = 'transparent';
  let spinColor = 'rgba(0,0,0,0.15)';
  let spinTop = 'rgba(0,0,0,0.4)';

  try {
    const hint = localStorage.getItem('voiceai_ui_theme');
    if (hint === 'dark') {
      spinColor = 'rgba(255,255,255,0.1)';
      spinTop = 'rgba(255,255,255,0.4)';
    }
  } catch {}

  return (
    <div className="min-h-[60vh] flex items-center justify-center" style={{ background: bg }}>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes cSpin{to{transform:rotate(360deg)}}.c-sp{width:24px;height:24px;border-radius:50%;border:2.5px solid ${spinColor};border-top-color:${spinTop};animation:cSpin .7s linear infinite}` }} />
      <div className="c-sp" />
    </div>
  );
}