import { schema } from '@crawlready/database';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { apiError, getClientIp, rateLimitError } from '@/lib/utils/api-helpers';
import { subscribeRateLimiter } from '@/lib/utils/rate-limit';
import { db } from '@/libs/DB';

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
    return rateLimitError(limit);
  }

  // Parse body
  let body: { email?: string; domain?: string; source?: string };
  try {
    body = await request.json();
  } catch {
    return apiError('INVALID_REQUEST', 'Request body must be valid JSON.', 400);
  }

  const { email, domain, source } = body;

  if (!email || typeof email !== 'string' || !isValidEmail(email)) {
    return apiError('INVALID_EMAIL', 'A valid email address is required.', 400);
  }

  // Check for existing subscriber, return 409 if duplicate
  const normalizedEmail = email.toLowerCase().trim();
  const normalizedDomain = domain || null;

  try {
    const existing = await db
      .select({ id: schema.subscribers.id })
      .from(schema.subscribers)
      .where(
        normalizedDomain
          ? and(
              eq(schema.subscribers.email, normalizedEmail),
              eq(schema.subscribers.domain, normalizedDomain),
            )
          : and(
              eq(schema.subscribers.email, normalizedEmail),
            ),
      )
      .limit(1);

    if (existing.length > 0) {
      return apiError('ALREADY_EXISTS', 'This email is already subscribed.', 409);
    }

    await db
      .insert(schema.subscribers)
      .values({
        email: normalizedEmail,
        domain: normalizedDomain,
        source: source || null,
      });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error('Subscribe error:', error);
    return apiError('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }
}
