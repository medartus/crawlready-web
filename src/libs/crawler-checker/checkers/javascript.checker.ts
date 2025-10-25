/**
 * JavaScript Dependency Checker
 * CRITICAL: Most AI crawlers (GPTBot, ClaudeBot, PerplexityBot) do NOT execute JavaScript
 */

import type { JavaScriptCheck } from '../types';

export class JavaScriptChecker {
  static check(html: string, textContent: string): JavaScriptCheck {
    const emptyRootPatterns = [
      /<div id="root">\s*<\/div>/i,
      /<div id="__next">\s*<\/div>/i,
      /<div id="app">\s*<\/div>/i,
      /<app-root>\s*<\/app-root>/i,
    ];

    const hasEmptyRoot = emptyRootPatterns.some(pattern => pattern.test(html));
    const jsRequiredPatterns = [
      /javascript is required/i,
      /please enable javascript/i,
      /this site requires javascript/i,
    ];
    const hasJSMessage = jsRequiredPatterns.some(pattern => pattern.test(html));
    const hasLowContent = textContent.length < 200;

    let framework: string | null = null;
    if (html.includes('_next')) {
      framework = 'Next.js';
    } else if (html.includes('__nuxt')) {
      framework = 'Nuxt.js';
    } else if (html.includes('ng-version')) {
      framework = 'Angular';
    } else if (html.includes('data-reactroot')) {
      framework = 'React';
    } else if (html.includes('data-v-')) {
      framework = 'Vue.js';
    }

    const requiresJS = hasEmptyRoot || hasJSMessage || (hasLowContent && framework !== null);

    return {
      requiresJS,
      hasEmptyRoot,
      hasJSMessage,
      hasLowContent,
      framework,
    };
  }
}
