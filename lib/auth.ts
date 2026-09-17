import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import type { JWTPayload, AuthUser, UserRole } from '@/types/database';

// SECURITY (2026-09-17): removed the hardcoded fallback secret that used to sit
// after the `||` on this line. With a known/guessable fallback, anyone could
// forge a valid session token if JWT_SECRET were ever unset. We now fail closed.
//
// We deliberately do NOT throw at module load the way the backend does. This
// module is imported during `next build`, and a top-level throw would break the
// build in any environment where JWT_SECRET is not present at build time.
// Instead each function that needs the secret fails closed at call time:
//   - verifyToken() returns null (no secret -> no valid session; users are
//     treated as logged out, never forge-able)
//   - generateToken() throws (we must never mint a token without a real secret;
//     this only ever runs in a request handler, never at build)
//
// NOTE: this JWT_SECRET must be identical to the backend's. The frontend only
// verifies tokens the backend issued, so a mismatch would make every session
// fail to verify. Because sessions currently verify, the real secret is already
// set here, so dropping the literal fallback cannot break working auth.
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '7d';

// ============================================================================
// PASSWORD UTILITIES
// ============================================================================

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// ============================================================================
// JWT UTILITIES
// ============================================================================

export function generateToken(user: {
  id: string;
  email: string;
  role: UserRole;
  agency_id?: string;
  client_id?: string;
}): string {
  // Fail closed: never mint a token without a configured secret.
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured; refusing to mint a token.');
  }

  const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
    sub: user.id,
    email: user.email,
    role: user.role,
    agency_id: user.agency_id,
    client_id: user.client_id,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JWTPayload | null {
  // Fail closed: with no configured secret we cannot trust any token, so treat
  // every request as unauthenticated rather than fall back to a guessable key.
  if (!JWT_SECRET) {
    console.error('JWT_SECRET is not configured; cannot verify tokens.');
    return null;
  }

  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  
  cookieStore.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  
  // Also set backup cookie
  cookieStore.set('auth_token_backup', token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getAuthCookie(): Promise<string | undefined> {
  try {
    const cookieStore = await cookies();
    // Try all cookie names
    const primary = cookieStore.get('auth_token')?.value;
    if (primary) return primary;
    
    const backup = cookieStore.get('auth_token_backup')?.value;
    if (backup) return backup;
    
    const client = cookieStore.get('auth_token_client')?.value;
    return client;
  } catch (error) {
    console.error('Error reading auth cookie:', error);
    return undefined;
  }
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
  cookieStore.delete('auth_token_backup');
  cookieStore.delete('auth_token_client');
}

// ============================================================================
// Backend JWT payload type (camelCase from backend)
// ============================================================================
interface BackendJWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  agencyId?: string;
  clientId?: string;
  iat?: number;
  exp?: number;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const token = await getAuthCookie();
    
    console.log('getCurrentUser - token exists:', !!token);
    
    if (!token) {
      return null;
    }
    
    const payload = verifyToken(token);
    
    console.log('getCurrentUser - payload valid:', !!payload);
    
    if (!payload) {
      return null;
    }
    
    // Handle both backend naming (camelCase) and frontend naming (snake_case)
    const backendPayload = payload as unknown as BackendJWTPayload;
    
    return {
      id: backendPayload.userId || payload.sub,
      email: payload.email,
      role: payload.role,
      agency_id: backendPayload.agencyId || payload.agency_id,
      client_id: backendPayload.clientId || payload.client_id,
      first_name: '',
      last_name: undefined,
    };
  } catch (error) {
    console.error('getCurrentUser error:', error);
    return null;
  }
}

// ============================================================================
// AUTHORIZATION HELPERS
// ============================================================================

export function isAgencyOwner(user: AuthUser | null): boolean {
  return user?.role === 'agency_owner' || user?.role === 'super_admin';
}

export function isAgencyStaff(user: AuthUser | null): boolean {
  return user?.role === 'agency_staff' || isAgencyOwner(user);
}

export function isClient(user: AuthUser | null): boolean {
  return user?.role === 'client';
}

export function isSuperAdmin(user: AuthUser | null): boolean {
  return user?.role === 'super_admin';
}

export function canAccessAgency(user: AuthUser | null, agencyId: string): boolean {
  if (!user) return false;
  if (isSuperAdmin(user)) return true;
  return user.agency_id === agencyId;
}

export function canAccessClient(user: AuthUser | null, clientId: string, agencyId?: string): boolean {
  if (!user) return false;
  if (isSuperAdmin(user)) return true;
  if (user.client_id === clientId) return true;
  if (user.agency_id && user.agency_id === agencyId) return true;
  return false;
}