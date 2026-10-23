#!/usr/bin/env node
/* VoiceAI Connect: swap marketing NAV brand lockups to the wordmark logo.
   Run from the repo root:  node navlogo-codemod.wordmark-k4t8.js
   Idempotent + deterministic. Touches NAV logos only (footers unchanged). */
const fs = require('fs');
const path = require('path');

const LOGO = '<img src="/voiceai-connect-logo.png" alt="VoiceAI Connect" className="h-8 sm:h-9 w-auto" />';

// Standard inline nav lockup (single line, 30 pages)
const STD_OLD = '<div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl border border-white/10 flex items-center justify-center bg-white/5"><WaveformIcon className="w-5 h-5 sm:w-6 sm:h-6" /></div><span className="text-base sm:text-lg font-semibold">VoiceAI Connect</span>';

// Fancy inline nav lockup lives inside the Link with the unique "group" signature (12 pages)
const FANCY = /(<Link href="\/" className="flex items-center gap-2\.5 sm:gap-3 group">)\s*[\s\S]*?(\s*<\/Link>)/;

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.tsx')) out.push(p);
  }
  return out;
}

let std = 0, fancy = 0, shared = 0;

// 1) Inline marketing-page navs under app/
for (const fp of walk('app', [])) {
  let s = fs.readFileSync(fp, 'utf8');
  if (!s.includes('WaveformIcon')) continue;
  const before = s;
  if (s.includes(STD_OLD)) { s = s.split(STD_OLD).join(LOGO); std++; }
  if (FANCY.test(s)) { s = s.replace(FANCY, `$1\n              ${LOGO}$2`); fancy++; }
  if (s !== before) fs.writeFileSync(fp, s);
}

// 2) Shared marketing nav component (covers home + ~11 core pages)
const navFile = 'components/marketing-nav.tsx';
if (fs.existsSync(navFile)) {
  let s = fs.readFileSync(navFile, 'utf8');
  const before = s;
  s = s.replace(
    /<img src="\/icon-512x512\.png" alt="VoiceAI Connect" className="w-8 h-8 rounded-md" \/>\s*<span className="font-display font-medium text-\[15px\] text-white tracking-tight">VoiceAI Connect<\/span>/,
    '<img src="/voiceai-connect-logo.png" alt="VoiceAI Connect" className="h-8 w-auto" />');
  s = s.replace(
    /<img src="\/icon-512x512\.png" alt="VoiceAI Connect" className="w-7 h-7 rounded-md" \/>\s*<span className="font-display font-medium text-white">VoiceAI Connect<\/span>/,
    '<img src="/voiceai-connect-logo.png" alt="VoiceAI Connect" className="h-7 w-auto" />');
  if (s !== before) { fs.writeFileSync(navFile, s); shared = 1; }
}

console.log(`Standard navs: ${std}, Fancy navs: ${fancy}, Shared component: ${shared}`);
console.log(`Total files changed: ${std + fancy + shared}`);
