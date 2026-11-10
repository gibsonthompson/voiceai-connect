// Reports the current deployed build id. Served uncached so a running (possibly
// stale, home-screen PWA) client can compare it against the build baked into its
// own bundle and reload when a newer version has shipped.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const build = process.env.NEXT_PUBLIC_BUILD_ID || 'dev';
  return new Response(JSON.stringify({ build }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
    },
  });
}
