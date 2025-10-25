/**
 * Meta Robots Checker
 * Critical - can block indexing entirely
 */

import type { MetaRobotsCheck } from '../types';

export class MetaRobotsChecker {
  /**
   * Check meta robots and X-Robots-Tag
   */
  static check(html: string, headers: Headers): MetaRobotsCheck {
    const metaRobotsMatch = html.match(/<meta\s+name=["']robots["']\s+content=["']([^"']+)["']/i);
    const metaRobots = metaRobotsMatch ? metaRobotsMatch[1] : null;
    const xRobotsTag = headers.get('x-robots-tag');

    const hasNoIndex = Boolean(metaRobots?.includes('noindex') || xRobotsTag?.includes('noindex'));
    const hasNoFollow = Boolean(metaRobots?.includes('nofollow') || xRobotsTag?.includes('nofollow'));
    const hasNoSnippet = Boolean(metaRobots?.includes('nosnippet'));

    const blockedBy: string[] = [];
    if (metaRobots?.includes('noindex')) {
      blockedBy.push('meta robots');
    }
    if (xRobotsTag?.includes('noindex')) {
      blockedBy.push('X-Robots-Tag header');
    }

    return { hasNoIndex, hasNoFollow, hasNoSnippet, blockedBy };
  }
}
