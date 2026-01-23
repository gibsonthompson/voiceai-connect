import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import type { JWTPayload, AuthUser, UserRole } from '@/types/database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
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