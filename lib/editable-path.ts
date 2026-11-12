// lib/editable-path.ts
// -----------------------------------------------------------------------------
// Dot-path get/set used by the in-context website editor.
//
// The full-page editor (app/agency/marketing/editor) renders the real agency
// site in an iframe with every text node wrapped in <Editable field="...">.
// When a region is edited, the iframe posts { field, value } up to the editor,
// which applies it to its working marketing_config with setByPath(). A "field"
// is a dot-path address into the config object, e.g.
//
//   "hero.badge"            -> config.hero.badge            (string)
//   "hero.headline"         -> config.hero.headline         (string[])
//   "features.2.title"      -> config.features[2].title     (string)
//   "faqs.0.answer"         -> config.faqs[0].answer         (string)
//
// Numeric path segments index into arrays. Everything here is immutable: only
// the nodes along the path are cloned, so React state updates stay cheap and
// referential-equality checks elsewhere keep working.
// -----------------------------------------------------------------------------

/** Read the value at `path` in `obj`, or undefined if any step is missing. */
export function getByPath(obj: any, path: string): any {
  if (obj == null || !path) return undefined;
  const parts = path.split('.');
  let cur: any = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

/**
 * Immutably set `value` at `path` in `obj`, returning a new object. Containers
 * along the path are shallow-cloned; missing intermediate containers are
 * created as arrays when the next segment is numeric, otherwise plain objects.
 *
 * Multiline round-trip: when the existing leaf is a string[] (e.g.
 * hero.headline, hero.trustItems, solution.paragraphs) and the incoming value
 * is a plain string, it is split on newlines so a multiline contentEditable
 * region maps back onto the array the templates expect. An existing array leaf
 * that receives an array value is set as-is.
 */
export function setByPath(obj: any, path: string, value: any): any {
  if (!path) return obj;
  const parts = path.split('.');
  const root: any = Array.isArray(obj) ? obj.slice() : { ...(obj || {}) };
  let cur: any = root;

  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    const nextKey = parts[i + 1];
    const existing = cur[key];
    let clone: any;
    if (Array.isArray(existing)) clone = existing.slice();
    else if (existing && typeof existing === 'object') clone = { ...existing };
    else clone = /^\d+$/.test(nextKey) ? [] : {};
    cur[key] = clone;
    cur = clone;
  }

  const leafKey = parts[parts.length - 1];
  const prev = cur[leafKey];
  if (Array.isArray(prev) && typeof value === 'string') {
    cur[leafKey] = value.split('\n');
  } else {
    cur[leafKey] = value;
  }
  return root;
}

/** Deep structural clone for plain JSON-ish config values (no functions/dates). */
export function clone<T>(v: T): T {
  if (v == null || typeof v !== 'object') return v;
  if (typeof structuredClone === 'function') {
    try { return structuredClone(v); } catch { /* fall through */ }
  }
  return JSON.parse(JSON.stringify(v));
}
