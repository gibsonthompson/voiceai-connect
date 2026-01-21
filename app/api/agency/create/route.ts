import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { hashPassword } from '@/lib/auth';
import { generateSlug } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agencyName, email, password, phone } = body;

    // Validation
    if (!agencyName || !email || !password) {
      return NextResponse.json(
        { error: 'Agency name, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Check if email already exists
    const { data: existingAgency } = await supabase
      .from('agencies')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingAgency) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Generate unique slug
    let slug = generateSlug(agencyName);
    let slugSuffix = 0;
    
    while (true) {
      const testSlug = slugSuffix === 0 ? slug : `${slug}-${slugSuffix}`;
      const { data: existingSlug } = await supabase
        .from('agencies')
        .select('id')
        .eq('slug', testSlug)
        .single();
      
      if (!existingSlug) {
        slug = testSlug;
        break;
      }
      slugSuffix++;
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create agency record
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .insert({
        name: agencyName,
        email: email.toLowerCase(),
        password_hash: passwordHash,
        phone: phone || null,
        slug: slug,
        status: 'pending_payment',
        subscription_status: 'pending',
        plan_type: 'starter',
        onboarding_step: 0,
        onboarding_completed: false,
      })
      .select('id, name, email, slug')
      .single();

    if (agencyError) {
      console.error('Error creating agency:', agencyError);
      return NextResponse.json(
        { error: 'Failed to create agency' },
        { status: 500 }
      );
    }

    // Create user record for the agency owner
    const { error: userError } = await supabase
      .from('users')
      .insert({
        agency_id: agency.id,
        email: email.toLowerCase(),
        password_hash: passwordHash,
        first_name: agencyName.split(' ')[0],
        role: 'agency_owner',
      });

    if (userError) {
      console.error('Error creating user:', userError);
      // Don't fail the request, agency was created successfully
    }

    return NextResponse.json({
      success: true,
      agencyId: agency.id,
      slug: agency.slug,
      message: 'Agency created successfully',
    });
  } catch (error) {
    console.error('Agency creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
