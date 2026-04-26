import { schema } from '@crawlready/database';
import { NextResponse } from 'next/server';

import { subscribeRateLimiter } from '@/lib/utils/rate-limit';
import { db } from '@/libs/DB';

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]!.trim();
  }
  return '127.0.0.1';
}

function isValidEmail(email: string): boolean {
  const atIndex = email.indexOf('@');
  if (atIndex < 1) {
    return false;
  }
  const domainPart = email.slice(atIndex + 1);
  return domainPart.includes('.') && domainPart.length >= 3 && !email.includes(' ');
}

export async function POST(request: Request) {
  // Rate limit
  const ip = getClientIp(request);
  const limit = subscribeRateLimiter.check(ip);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        code: 'RATE_LIMITED',
        message: 'Too many requests. Please try again later.',
        retry_after: limit.retryAfterSeconds,
      },
      { status: 429 },
    );
  }

  // Parse body
  let body: { email?: string; domain?: string; source?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { code: 'INVALID_REQUEST', message: 'Request body must be valid JSON.' },
      { status: 400 },
    );
  }

  const { email, domain, source } = body;

  if (!email || typeof email !== 'string' || !isValidEmail(email)) {
    return NextResponse.json(
      { code: 'INVALID_EMAIL', message: 'A valid email address is required.' },
      { status: 400 },
    );
  }

  // Upsert subscriber (ignore conflict on email+domain)
  try {
    await db
      .insert(schema.subscribers)
      .values({
        email: email.toLowerCase().trim(),
        domain: domain || null,
        source: source || null,
      })
      .onConflictDoNothing();

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error('Subscribe error:', error);
    return NextResponse.json(
      { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}
