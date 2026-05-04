/**
 * In-process dedup cache for ingest beacons.
 *
 * Prevents duplicate writes when the same (siteKey, path, bot) triple
 * arrives within a 1-second window. Uses a time-bucketed Map with
 * periodic cleanup.
 *
 * See docs/architecture/analytics-infrastructure.md §Dedup (A3)
 */

const DEDUP_WINDOW_MS = 1_000; // 1 second
const CLEANUP_INTERVAL_MS = 10_000; // Purge stale entries every 10s
const MAX_ENTRIES = 10_000; // Safety cap

class DedupCache {
  private readonly entries = new Map<string, number>();
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  /**
   * Returns true if this beacon is a duplicate (already seen within window).
   * If not a duplicate, marks it as seen.
   */
  isDuplicate(siteKey: string, path: string, bot: string): boolean {
    const key = `${siteKey}|${path}|${bot}`;
    const now = Date.now();
    const lastSeen = this.entries.get(key);

    if (lastSeen && now - lastSeen < DEDUP_WINDOW_MS) {
      return true;
    }

    // Mark as seen
    this.entries.set(key, now);

    // Start cleanup timer if needed
    if (!this.cleanupTimer) {
      this.startCleanup();
    }

    // Safety: hard cap on entries
    if (this.entries.size > MAX_ENTRIES) {
      this.purgeStale(now);
    }

    return false;
  }

  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.purgeStale(Date.now());
    }, CLEANUP_INTERVAL_MS);

    // Allow process to exit even if timer is running
    if (this.cleanupTimer && typeof this.cleanupTimer === 'object' && 'unref' in this.cleanupTimer) {
      this.cleanupTimer.unref();
    }
  }

  private purgeStale(now: number): void {
    for (const [key, ts] of this.entries) {
      if (now - ts >= DEDUP_WINDOW_MS) {
        this.entries.delete(key);
      }
    }

    // Stop timer if empty
    if (this.entries.size === 0 && this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  get size(): number {
    return this.entries.size;
  }
}

/**
 * Singleton dedup cache instance.
 * Per-isolate on Vercel (not shared across instances). Acceptable for Phase 0.
 */
export const dedupCache = new DedupCache();
