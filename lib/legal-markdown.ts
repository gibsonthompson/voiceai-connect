// ============================================================================
// SHARED LEGAL-PAGE RENDERER
// ----------------------------------------------------------------------------
// The hosted Terms/Privacy pages (components/LegalPage) and the agency
// dashboard editor (components/agency/LegalEditor) both render the same legal
// markdown, so the renderer lives here and is imported by both. That way the
// editor's live preview is guaranteed to match what the hosted page shows.
// Placeholders ({{AGENCY_NAME}}, {{SUPPORT_EMAIL}}, etc.) are resolved from the
// agency, so an agency can keep using them in custom text.
// ============================================================================

export interface LegalAgencyFields {
  name?: string | null;
  support_email?: string | null;
  support_phone?: string | null;
  display_currency?: string | null;
  price_starter?: number | null;
}

export function replacePlaceholders(content: string, agency: LegalAgencyFields): string {
  const cs = agency.display_currency === 'GBP' ? '£' : agency.display_currency === 'EUR' ? '€' : '$';
  const lowestPrice = agency.price_starter ? Math.round(agency.price_starter / 100) : 49;
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return content
    .replace(/\{\{AGENCY_NAME\}\}/g, agency.name || '')
    .replace(/\{\{SUPPORT_EMAIL\}\}/g, agency.support_email || 'support@myvoiceaiconnect.com')
    .replace(/\{\{SUPPORT_PHONE\}\}/g, agency.support_phone || '')
    .replace(/\{\{CURRENCY_SYMBOL\}\}/g, cs)
    .replace(/\{\{LOWEST_PRICE\}\}/g, String(lowestPrice))
    .replace(/\{\{EFFECTIVE_DATE\}\}/g, today);
}

// ============================================================================
// SIMPLE MARKDOWN -> HTML RENDERER
// Handles: headings, bold, italic, lists, tables, horizontal rules, links,
//          paragraphs. Safe for controlled content (not end-user input).
// ============================================================================
export function markdownToHtml(md: string): string {
  const lines = md.split('\n');
  const html: string[] = [];
  // Track the OPEN list type so ordered and unordered lists close with the
  // correct tag and consecutive same-type items stay in ONE list.
  let listType: 'ul' | 'ol' | null = null;
  let inTable = false;
  let tableHeaderDone = false;
  let inParagraph = false;

  function closeParagraph() {
    if (inParagraph) { html.push('</p>'); inParagraph = false; }
  }
  function closeList() {
    if (listType) { html.push(`</${listType}>`); listType = null; }
  }
  function closeTable() {
    if (inTable) { html.push('</tbody></table></div>'); inTable = false; tableHeaderDone = false; }
  }

  function inlineFormat(text: string): string {
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
    text = text.replace(/`(.+?)`/g, '<code>$1</code>');
    text = text.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
    return text;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === '') {
      closeParagraph();
      closeList();
      closeTable();
      continue;
    }

    if (/^-{3,}$/.test(trimmed)) {
      closeParagraph(); closeList(); closeTable();
      html.push('<hr/>');
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      closeParagraph(); closeList(); closeTable();
      const level = headingMatch[1].length;
      const text = inlineFormat(headingMatch[2]);
      const id = headingMatch[2].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      html.push(`<h${level} id="${id}">${text}</h${level}>`);
      continue;
    }

    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      closeParagraph(); closeList();
      const cells = trimmed.slice(1, -1).split('|').map(c => c.trim());

      if (cells.every(c => /^-+$/.test(c))) {
        tableHeaderDone = true;
        continue;
      }

      if (!inTable) {
        html.push('<div class="legal-table-wrapper"><table class="legal-table"><thead><tr>');
        cells.forEach(c => html.push(`<th>${inlineFormat(c)}</th>`));
        html.push('</tr></thead><tbody>');
        inTable = true;
        continue;
      }

      html.push('<tr>');
      cells.forEach(c => html.push(`<td>${inlineFormat(c)}</td>`));
      html.push('</tr>');
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      closeParagraph(); closeTable();
      if (listType !== 'ul') { closeList(); html.push('<ul>'); listType = 'ul'; }
      const text = inlineFormat(trimmed.replace(/^[-*]\s+/, ''));
      html.push(`<li>${text}</li>`);
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      closeParagraph(); closeTable();
      if (listType !== 'ol') { closeList(); html.push('<ol>'); listType = 'ol'; }
      const text = inlineFormat(trimmed.replace(/^\d+\.\s+/, ''));
      html.push(`<li>${text}</li>`);
      continue;
    }

    closeList(); closeTable();
    if (!inParagraph) {
      html.push('<p>');
      inParagraph = true;
    } else {
      html.push(' ');
    }
    html.push(inlineFormat(trimmed));
  }

  closeParagraph();
  closeList();
  closeTable();

  return html.join('\n');
}