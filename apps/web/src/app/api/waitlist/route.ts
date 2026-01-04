import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, website } = body;

    // Validate inputs
    if (!email || !website) {
      return NextResponse.json(
        { error: 'Email and website are required' },
        { status: 400 },
      );
    }

    // Validate email format
    const emailRegex = /^[\w.-]+@[\w.-]+\.\w+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 },
      );
    }

    // Google Sheets Web App URL (you'll need to set this up)
    const GOOGLE_SHEETS_URL = process.env.GOOGLE_SHEETS_WEBHOOK_URL;

    if (!GOOGLE_SHEETS_URL) {
      console.error('GOOGLE_SHEETS_WEBHOOK_URL is not configured');
      return NextResponse.json(
        { error: 'Service configuration error' },
        { status: 500 },
      );
    }

    // Send data to Google Sheets
    const timestamp = new Date().toISOString();
    const response = await fetch(GOOGLE_SHEETS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        website,
        timestamp,
        source: 'waitlist',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save to Google Sheets');
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully joined the waitlist!',
    });
  } catch (error) {
    console.error('Waitlist submission error:', error);
    return NextResponse.json(
      { error: 'Failed to process request. Please try again.' },
      { status: 500 },
    );
  }
}
