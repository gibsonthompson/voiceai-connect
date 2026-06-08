// app/get-started/page.tsx
// /get-started is the canonical public URL for the signup wizard. The
// actual implementation lives at /signup so that /signup/plan and
// /signup/success can stay sibling routes. This file just re-exports.
export { default } from '../signup/page';