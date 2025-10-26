import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Cache for 60 seconds

export async function GET() {
  try {
    const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;

    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'Service configuration error' },
        { status: 500 },
      );
    }

    // Fetch count from Google Sheets (GET request)
    const response = await fetch(webhookUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch count from Google Sheets');
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to get waitlist count');
    }

    return NextResponse.json({
      success: true,
      count: data.count || 0,
      spotsLeft: data.spotsLeft || 100,
    });
  } catch (error) {
    console.error('Error fetching waitlist count:', error);

    // Return fallback data instead of error
    return NextResponse.json({
      success: true,
      count: 0,
      spotsLeft: 100,
    });
  }
}
