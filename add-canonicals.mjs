#!/usr/bin/env node

/**
 * add-canonicals.mjs
 * 
 * Run from your project root:
 *   node add-canonicals.mjs
 * 
 * This script scans all page.tsx files in your app/ directory and adds
 * alternates.canonical to their metadata export if it's missing.
 * 
 * It handles two patterns:
 *   1. `export const metadata: Metadata = { ... }` (static metadata)
 *   2. Files with 'use client' are SKIPPED (can't export metadata)
 * 
 * The canonical URL is derived from the file path:
 *   app/features/ai-demo/page.tsx → "/features/ai-demo"
 *   app/blog/my-post/page.tsx → "/blog/my-post"
 *   app/page.tsx → "/" (handled in layout.tsx)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.join(__dirname, 'app');

let modified = 0;
let skipped = 0;
let alreadyHas = 0;
let clientComponents = 0;

function getRouteFromFilePath(filePath) {
  // app/features/ai-demo/page.tsx → /features/ai-demo
  const relative = path.relative(appDir, filePath);
  const dir = path.dirname(relative);
  if (dir === '.') return '/';
  return '/' + dir.replace(/\\/g, '/');
}

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const route = getRouteFromFilePath(filePath);
  
  // Skip root page.tsx (canonical is in layout.tsx)
  if (route === '/') {
    console.log(`  SKIP (root - handled in layout.tsx): ${route}`);
    skipped++;
    return;
  }

  // Skip 'use client' components
  if (content.includes("'use client'") || content.includes('"use client"')) {
    console.log(`  SKIP (client component): ${route}`);
    clientComponents++;
    return;
  }

  // Skip if already has alternates
  if (content.includes('alternates')) {
    console.log(`  ALREADY HAS canonical: ${route}`);
    alreadyHas++;
    return;
  }

  // Skip if no metadata export
  if (!content.includes('export const metadata') && !content.includes('export function generateMetadata')) {
    console.log(`  SKIP (no metadata export): ${route}`);
    skipped++;
    return;
  }

  // For static metadata: add alternates after the opening of metadata object
  // Handles both: `export const metadata: Metadata = {` and `export const metadata = {`
  const metadataRegex = /(export\s+const\s+metadata\s*(?::\s*Metadata\s*)?=\s*\{)/;
  const match = content.match(metadataRegex);
  
  if (match) {
    const canonicalLine = `\n  alternates: {\n    canonical: "${route}",\n  },`;
    const newContent = content.replace(metadataRegex, `$1${canonicalLine}`);
    fs.writeFileSync(filePath, newContent, 'utf-8');
    console.log(`  ✅ ADDED canonical: ${route}`);
    modified++;
    return;
  }

  console.log(`  SKIP (unrecognized metadata pattern): ${route}`);
  skipped++;
}

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // Skip node_modules, .next, agency (dashboard routes), etc.
      if (['node_modules', '.next', 'api'].includes(entry.name)) continue;
      walkDir(fullPath);
    } else if (entry.name === 'page.tsx' || entry.name === 'page.ts') {
      processFile(fullPath);
    }
  }
}

console.log('🔍 Scanning app/ directory for pages without canonical tags...\n');
walkDir(appDir);

console.log('\n📊 Results:');
console.log(`   ✅ Modified: ${modified}`);
console.log(`   ✓  Already had canonical: ${alreadyHas}`);
console.log(`   ⏭  Skipped (client/root/no metadata): ${skipped + clientComponents}`);
console.log(`\n💡 Remember: root page canonical is set in layout.tsx`);
console.log(`   Deploy and resubmit sitemap in Google Search Console.`);
