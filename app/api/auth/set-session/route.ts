import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;
    
    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }
    
    const response = NextResponse.json({ success: true, token });
    
    // Set multiple cookie formats to ensure it works
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    
    // Also set a non-httpOnly version as backup
    response.cookies.set({
      name: 'auth_token_backup',
      value: token,
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    
    return response;
  } catch (error) {
    console.error('set-session error:', error);
    return NextResponse.json({ error: 'Failed to set session' }, { status: 500 });
  }
}