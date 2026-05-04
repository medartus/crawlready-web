/**
 * In-process LRU cache for site key → site ID lookups.
 *
 * Phase 0 uses in-process LRU (100 entries, 5-min TTL).
 * Migrate to Upstash Redis in Phase 1 for global consistency.
 *
 * See docs/architecture/analytics-infrastructure.md §Site Key Caching (A2)
 */

type CacheEntry = {
  siteId: string;
  insertedAt: number;
};

type CacheNode = {
  key: string;
  entry: CacheEntry;
  prev: CacheNode | null;
  next: CacheNode | null;
};

export class SiteKeyCache {
  private readonly map = new Map<string, CacheNode>();
  private head: CacheNode | null = null;
  private tail: CacheNode | null = null;
  private readonly maxSize: number;
  private readonly ttlMs: number;

  constructor(maxSize = 100, ttlMs = 300_000) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
  }

  get(siteKey: string): { siteId: string } | undefined {
    const node = this.map.get(siteKey);
    if (!node) {
      return undefined;
    }

    // Check TTL
    if (Date.now() - node.entry.insertedAt > this.ttlMs) {
      this.removeNode(node);
      this.map.delete(siteKey);
      return undefined;
    }

    // Move to head (most recently used)
    this.moveToHead(node);
    return { siteId: node.entry.siteId };
  }

  set(siteKey: string, siteId: string): void {
    const existing = this.map.get(siteKey);
    if (existing) {
      existing.entry = { siteId, insertedAt: Date.now() };
      this.moveToHead(existing);
      return;
    }

    // Evict LRU if at capacity
    if (this.map.size >= this.maxSize && this.tail) {
      this.map.delete(this.tail.key);
      this.removeNode(this.tail);
    }

    const node: CacheNode = {
      key: siteKey,
      entry: { siteId, insertedAt: Date.now() },
      prev: null,
      next: null,
    };
    this.map.set(siteKey, node);
    this.addToHead(node);
  }

  delete(siteKey: string): void {
    const node = this.map.get(siteKey);
    if (node) {
      this.removeNode(node);
      this.map.delete(siteKey);
    }
  }

  get size(): number {
    return this.map.size;
  }

  private addToHead(node: CacheNode): void {
    node.prev = null;
    node.next = this.head;
    if (this.head) {
      this.head.prev = node;
    }
    this.head = node;
    if (!this.tail) {
      this.tail = node;
    }
  }

  private removeNode(node: CacheNode): void {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }
    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }
    node.prev = null;
    node.next = null;
  }

  private moveToHead(node: CacheNode): void {
    if (this.head === node) {
      return;
    }

    this.removeNode(node);
    this.addToHead(node);
  }
}

/**
 * Singleton cache instance for the ingest hot path.
 * Per-isolate on Vercel (not shared across instances). Acceptable for Phase 0.
 */
export const siteKeyCache = new SiteKeyCache();
