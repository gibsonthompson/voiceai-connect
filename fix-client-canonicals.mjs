#!/usr/bin/env node

/**
 * fix-client-canonicals.mjs
 * 
 * Run from your project root:
 *   node fix-client-canonicals.mjs
 * 
 * For 'use client' pages that can't export metadata, this script:
 *   1. Renames page.tsx → client-page.tsx
 *   2. Creates a new page.tsx (server component) that:
 *      - Exports metadata with alternates.canonical
 *      - Imports and renders the client component
 * 
 * It ONLY processes public marketing pages (features, SEO landing pages, etc.)
 * It SKIPS dashboard/auth/admin/agency/client routes.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.join(__dirname, 'app');

// Only process these public-facing routes that need canonical tags
// Skip: admin, agency, client, auth, onboarding (private/app routes)
const SKIP_PREFIXES = [
  '/admin',
  '/agency',
  '/client',
  '/auth',
  '/onboarding',
  '/signup',  // signup pages don't need strong SEO canonicals
];

let modified = 0;
let skipped = 0;

function getRouteFromFilePath(filePath) {
  const relative = path.relative(appDir, filePath);
  const dir = path.dirname(relative);
  if (dir === '.') return '/';
  return '/' + dir.replace(/\\/g, '/');
}

function shouldProcess(route) {
  // Skip root (handled in layout)
  if (route === '/') return false;
  
  // Skip private routes
  for (const prefix of SKIP_PREFIXES) {
    if (route.startsWith(prefix)) return false;
  }
  
  return true;
}

function extractExistingMetadata(content) {
  // Try to find any existing metadata-like info (title, description) from the component
  // We'll look for common patterns in the JSX
  let title = null;
  let description = null;
  
  // Look for <title> or document.title or <h1> patterns
  // This is best-effort — the canonical is what matters most
  
  return { title, description };
}

function getPageTitle(route) {
  // Generate a reasonable title from the route
  const parts = route.split('/').filter(Boolean);
  const last = parts[parts.length - 1];
  
  // Convert kebab-case to Title Case
  return last
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const route = getRouteFromFilePath(filePath);
  
  if (!shouldProcess(route)) {
    console.log(`  SKIP (private route): ${route}`);
    skipped++;
    return;
  }

  // Only process 'use client' files
  if (!content.includes("'use client'") && !content.includes('"use client"')) {
    console.log(`  SKIP (already server component): ${route}`);
    skipped++;
    return;
  }

  // Skip if there's already a client-page.tsx (already processed)
  const dir = path.dirname(filePath);
  if (fs.existsSync(path.join(dir, 'client-page.tsx'))) {
    console.log(`  SKIP (already split): ${route}`);
    skipped++;
    return;
  }

  // Check if this file has its own metadata export somehow
  if (content.includes('alternates') && content.includes('canonical')) {
    console.log(`  SKIP (already has canonical): ${route}`);
    skipped++;
    return;
  }

  // Find the default export name
  const defaultExportMatch = content.match(/export\s+default\s+function\s+(\w+)/);
  const componentName = defaultExportMatch ? defaultExportMatch[1] : 'ClientPage';

  // Step 1: Rename page.tsx → client-page.tsx
  const clientPagePath = path.join(dir, 'client-page.tsx');
  fs.copyFileSync(filePath, clientPagePath);
  
  // Step 2: Create new server-component page.tsx
  const serverPage = `import type { Metadata } from "next";
import ${componentName} from "./client-page";

export const metadata: Metadata = {
  alternates: {
    canonical: "${route}",
  },
};

export default function Page() {
  return <${componentName} />;
}
`;

  fs.writeFileSync(filePath, serverPage, 'utf-8');
  console.log(`  ✅ SPLIT: ${route} → page.tsx (server) + client-page.tsx`);
  modified++;
}

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      if (['node_modules', '.next', 'api'].includes(entry.name)) continue;
      walkDir(fullPath);
    } else if (entry.name === 'page.tsx' || entry.name === 'page.ts') {
      processFile(fullPath);
    }
  }
}

console.log('🔍 Processing client component pages for canonical tags...\n');
walkDir(appDir);

console.log('\n📊 Results:');
console.log(`   ✅ Split into server + client: ${modified}`);
console.log(`   ⏭  Skipped: ${skipped}`);
console.log('\n⚠️  IMPORTANT: Review the changes before committing!');
console.log('   The new page.tsx files only have metadata + canonical.');
console.log('   If any original page.tsx had metadata (title/description),');
console.log('   copy it from client-page.tsx into the new page.tsx metadata export.');
console.log('\n   Run: git diff --stat   to see all changes');
