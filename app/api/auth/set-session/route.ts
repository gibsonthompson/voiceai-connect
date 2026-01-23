import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;
    
    console.log('set-session called, token exists:', !!token);
    
    if (!token) {
      console.log('No token provided');
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }
    
    const response = NextResponse.json({ success: true });
    
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    
    console.log('Cookie set in response');
    
    return response;
  } catch (error) {
    console.error('set-session error:', error);
    return NextResponse.json({ error: 'Failed to set session' }, { status: 500 });
  }
}