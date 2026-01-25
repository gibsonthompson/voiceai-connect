import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyPassword, generateToken, setAuthCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Find user by email with agency relationship
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        password_hash,
        first_name,
        last_name,
        role,
        agency_id
      `)
      .eq('email', email.toLowerCase())
      .in('role', ['agency_owner', 'agency_staff', 'super_admin'])
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    if (!user.password_hash) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Fetch full agency data if user has agency_id
    let agency = null;
    if (user.agency_id) {
      const { data: agencyData } = await supabase
        .from('agencies')
        .select('*')
        .eq('id', user.agency_id)
        .single();
      
      agency = agencyData;

      // Check agency status
      if (agency && agency.status === 'suspended') {
        return NextResponse.json(
          { error: 'Your account has been suspended. Please contact support.' },
          { status: 403 }
        );
      }
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      agency_id: user.agency_id || undefined,
    });

    // Set auth cookie
    await setAuthCookie(token);

    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    if (user.agency_id) {
      await supabase
        .from('agencies')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', user.agency_id);
    }

    // Return token, user, and agency (all required for localStorage auth)
    return NextResponse.json({
      success: true,
      token, // CRITICAL: Include token for localStorage
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        agency_id: user.agency_id,
      },
      agency, // CRITICAL: Include full agency object at top level
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}