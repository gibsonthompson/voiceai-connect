import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL;
    
    if (!backendUrl) {
      console.error('NEXT_PUBLIC_API_URL or BACKEND_URL not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const response = await fetch(`${backendUrl}/api/agency/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: body.agencyName,
        email: body.email,
        password: body.password,
        phone: body.phone,
        firstName: body.firstName,
        lastName: body.lastName,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to create agency' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      agencyId: data.agencyId || data.agency?.id,
      message: 'Agency created successfully',
    });
  } catch (error) {
    console.error('Agency creation error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}