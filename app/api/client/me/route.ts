import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL;

    if (!backendUrl) {
      console.error('Backend URL not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Verify token and get client info from backend
    const response = await fetch(`${backendUrl}/api/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const authData = await response.json();

    if (!authData.valid || authData.role !== 'client') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get full client details with agency info
    const clientResponse = await fetch(`${backendUrl}/api/client/${authData.clientId}/details`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!clientResponse.ok) {
      // Fallback: return basic info from auth
      return NextResponse.json({
        client: {
          id: authData.clientId,
          email: authData.email,
          agency: null,
        },
      });
    }

    const clientData = await clientResponse.json();

    return NextResponse.json({
      client: {
        id: clientData.id,
        email: clientData.email,
        business_name: clientData.business_name,
        subscription_status: clientData.subscription_status,
        trial_ends_at: clientData.trial_ends_at,
        plan_type: clientData.plan_type,
        agency: clientData.agencies ? {
          id: clientData.agencies.id,
          name: clientData.agencies.name,
          logo_url: clientData.agencies.logo_url,
          primary_color: clientData.agencies.primary_color,
          support_email: clientData.agencies.support_email,
          price_starter: clientData.agencies.price_starter,
          price_pro: clientData.agencies.price_pro,
          price_growth: clientData.agencies.price_growth,
          limit_starter: clientData.agencies.limit_starter,
          limit_pro: clientData.agencies.limit_pro,
          limit_growth: clientData.agencies.limit_growth,
        } : null,
      },
    });

  } catch (error) {
    console.error('Get client error:', error);
    return NextResponse.json(
      { error: 'Failed to get client info' },
      { status: 500 }
    );
  }
}