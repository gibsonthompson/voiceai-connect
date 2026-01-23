import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; redirect?: string }>;
}) {
  const params = await searchParams;
  const token = params.token;
  const redirectTo = params.redirect || '/client/dashboard';

  if (!token) {
    redirect('/client/login?error=no_token');
  }

  // Set cookies server-side
  const cookieStore = await cookies();
  
  cookieStore.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  cookieStore.set('auth_token_backup', token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  console.log('Auth callback - cookies set, redirecting to:', redirectTo);

  redirect(redirectTo);
}