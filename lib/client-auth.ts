// ============================================================================
// CLIENT AUTH TOKEN (preview-aware)
// Location: lib/client-auth.ts
//
// The agency "Login as Client" preview opens the real client dashboard in a
// separate tab and stores the client credential in sessionStorage
// (preview_auth_token), tab-scoped so it never clobbers the agency's own
// localStorage.auth_token in their other tab. A normal client session stores
// the token in localStorage.auth_token.
//
// Any client-side fetch that hits a /api/client/:id/* endpoint must read the
// token through this helper. Reading the preview key FIRST makes every section
// (services, staff, knowledge base, hours, AI settings) load correctly inside
// the preview tab, instead of depending on the layout's localStorage shim,
// which was leaving those self-fetching sections blank in the preview.
//
// Returns '' when neither token is present (an unauthenticated request, which
// the backend already handles).
// ============================================================================
export function getClientAuthToken(): string {
  if (typeof window === 'undefined') return '';
  try {
    return (
      window.sessionStorage.getItem('preview_auth_token') ||
      window.localStorage.getItem('auth_token') ||
      ''
    );
  } catch {
    return '';
  }
}