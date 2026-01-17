import { auth } from '@clerk/nextjs/server';
import { siteApiKeys, sites, siteStatusHistory } from '@crawlready/database';
import { and, eq, isNull } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';

export async function GET(
  request: NextRequest,
  { params }: { params: { siteId: string } },
) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { siteId } = params;

    const site = await db
      .select()
      .from(sites)
      .where(
        and(
          eq(sites.id, siteId),
          orgId ? eq(sites.orgId, orgId) : eq(sites.userId, userId),
          isNull(sites.deletedAt),
        ),
      )
      .limit(1);

    if (site.length === 0) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    // Get API key info
    const apiKey = await db
      .select({
        id: siteApiKeys.id,
        keyPrefix: siteApiKeys.keyPrefix,
        keySuffix: siteApiKeys.keySuffix,
        name: siteApiKeys.name,
        lastUsedAt: siteApiKeys.lastUsedAt,
        useCount: siteApiKeys.useCount,
        isActive: siteApiKeys.isActive,
        createdAt: siteApiKeys.createdAt,
      })
      .from(siteApiKeys)
      .where(
        and(eq(siteApiKeys.siteId, siteId), eq(siteApiKeys.isActive, true)),
      )
      .limit(1);

    // Get recent status history
    const statusHistory = await db
      .select()
      .from(siteStatusHistory)
      .where(eq(siteStatusHistory.siteId, siteId))
      .orderBy(siteStatusHistory.createdAt)
      .limit(10);

    return NextResponse.json({
      site: site[0],
      apiKey: apiKey[0] || null,
      statusHistory,
    });
  } catch (error) {
    console.error('Get site error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { siteId: string } },
) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { siteId } = params;
    const body = await request.json();

    // Verify ownership
    const existing = await db
      .select({ id: sites.id })
      .from(sites)
      .where(
        and(
          eq(sites.id, siteId),
          orgId ? eq(sites.orgId, orgId) : eq(sites.userId, userId),
          isNull(sites.deletedAt),
        ),
      )
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    // Update allowed fields
    const { displayName, settings } = body;
    const updateData: Record<string, unknown> = {};

    if (displayName !== undefined) {
      updateData.displayName = displayName;
    }

    if (settings !== undefined) {
      updateData.settings = JSON.stringify(settings);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updateData.updatedAt = new Date();

    const [updated] = await db
      .update(sites)
      .set(updateData)
      .where(eq(sites.id, siteId))
      .returning();

    return NextResponse.json({ site: updated });
  } catch (error) {
    console.error('Update site error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { siteId: string } },
) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { siteId } = params;

    // Verify ownership
    const existing = await db
      .select({ id: sites.id })
      .from(sites)
      .where(
        and(
          eq(sites.id, siteId),
          orgId ? eq(sites.orgId, orgId) : eq(sites.userId, userId),
          isNull(sites.deletedAt),
        ),
      )
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    // Soft delete
    await db
      .update(sites)
      .set({
        deletedAt: new Date(),
        status: 'suspended',
        statusReason: 'Deleted by user',
        statusChangedAt: new Date(),
      })
      .where(eq(sites.id, siteId));

    // Record status history
    await db.insert(siteStatusHistory).values({
      siteId,
      toStatus: 'suspended',
      reason: 'Deleted by user',
      changedBy: userId,
      changeType: 'deleted',
    });

    return NextResponse.json({ message: 'Site deleted successfully' });
  } catch (error) {
    console.error('Delete site error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
