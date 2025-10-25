/**
 * Navigation & Internal Linking Checker
 */

import type { NavigationCheck } from '../types';
import { HTMLParser } from '../utils/html-parser';

export class NavigationChecker {
  static check(html: string): NavigationCheck {
    const hasNav = HTMLParser.hasPattern(html, /<nav/i);
    const links = HTMLParser.extractLinks(html);
    const linkCount = links.length;
    const hasGoodStructure = hasNav && linkCount > 5;

    return {
      linkCount,
      hasGoodStructure,
      hasNav,
    };
  }
}
