/**
 * Hreflang & International Support Checker
 * Critical for multi-language and international SEO
 */

export type HreflangCheckResult = {
  hasHreflangTags: boolean;
  hreflangCount: number;
  languages: string[];
  hasXDefault: boolean;
  hasBidirectionalLinks: boolean;
  conflictsWithLangAttribute: boolean;
  duplicateLanguages: string[];
  invalidFormats: string[];
  issues: string[];
};

export class HreflangChecker {
  static check(html: string, url: string): HreflangCheckResult {
    const issues: string[] = [];

    // Extract all hreflang tags
    const hreflangMatches = html.match(/<link[^>]+rel=["']alternate["'][^>]+hreflang=["']([^"']+)["'][^>]+href=["']([^"']+)["'][^>]*>/gi);

    if (!hreflangMatches || hreflangMatches.length === 0) {
      return {
        hasHreflangTags: false,
        hreflangCount: 0,
        languages: [],
        hasXDefault: false,
        hasBidirectionalLinks: false,
        conflictsWithLangAttribute: false,
        duplicateLanguages: [],
        invalidFormats: [],
        issues: [],
      };
    }

    const languages: string[] = [];
    const urls: string[] = [];
    const invalidFormats: string[] = [];
    let hasXDefault = false;

    // Parse each hreflang tag
    hreflangMatches.forEach((tag) => {
      const langMatch = tag.match(/hreflang=["']([^"']+)["']/i);
      const hrefMatch = tag.match(/href=["']([^"']+)["']/i);

      if (langMatch && hrefMatch) {
        const lang = langMatch[1];
        const href = hrefMatch[1];

        // Check for x-default
        if (lang === 'x-default') {
          hasXDefault = true;
        } else {
          languages.push(lang);
        }

        urls.push(href);

        // Validate format (should be language-REGION or just language)
        if (!/^[a-z]{2}(-[A-Z]{2})?$/.test(lang) && lang !== 'x-default') {
          invalidFormats.push(lang);
          issues.push(`Invalid hreflang format: ${lang} (should be 'en', 'en-US', etc.)`);
        }
      }
    });

    // Check for duplicates
    const duplicateLanguages = languages.filter((lang, index) => languages.indexOf(lang) !== index);

    if (duplicateLanguages.length > 0) {
      issues.push(`Duplicate hreflang tags: ${[...new Set(duplicateLanguages)].join(', ')}`);
    }

    // Check if x-default exists (recommended for international sites)
    if (!hasXDefault && languages.length > 1) {
      issues.push('Missing x-default hreflang tag (recommended for international sites)');
    }

    // Check conflict with lang attribute
    const htmlLangMatch = html.match(/<html[^>]+lang=["']([^"']+)["']/i);
    let conflictsWithLangAttribute = false;

    if (htmlLangMatch) {
      const htmlLang = htmlLangMatch[1].toLowerCase();
      const normalizedHtmlLang = htmlLang.split('-')[0]; // Get base language

      // Check if any hreflang matches the HTML lang
      const matchesHtmlLang = languages.some((lang) => {
        const baseLang = lang.split('-')[0];
        return baseLang === normalizedHtmlLang;
      });

      if (!matchesHtmlLang && languages.length > 0) {
        conflictsWithLangAttribute = true;
        issues.push(`HTML lang="${htmlLang}" doesn't match any hreflang tags`);
      }
    }

    // Check if current URL is in hreflang list (self-referencing)
    const currentUrlNormalized = url.toLowerCase();
    const hasSelfReference = urls.some((href) => {
      try {
        const hrefUrl = new URL(href, url).href.toLowerCase();
        return hrefUrl === currentUrlNormalized;
      } catch {
        return false;
      }
    });

    if (!hasSelfReference) {
      issues.push('Current page not self-referenced in hreflang tags');
    }

    // Note: Bidirectional validation requires checking target pages (not feasible in single-page check)
    const hasBidirectionalLinks = false; // Would require fetching all linked pages

    return {
      hasHreflangTags: true,
      hreflangCount: hreflangMatches.length,
      languages,
      hasXDefault,
      hasBidirectionalLinks,
      conflictsWithLangAttribute,
      duplicateLanguages: [...new Set(duplicateLanguages)],
      invalidFormats,
      issues,
    };
  }

  /**
   * Get language name from code
   */
  static getLanguageName(code: string): string {
    const languages: Record<string, string> = {
      en: 'English',
      es: 'Spanish',
      fr: 'French',
      de: 'German',
      it: 'Italian',
      pt: 'Portuguese',
      ru: 'Russian',
      ja: 'Japanese',
      zh: 'Chinese',
      ko: 'Korean',
      ar: 'Arabic',
      hi: 'Hindi',
      nl: 'Dutch',
      pl: 'Polish',
      tr: 'Turkish',
      sv: 'Swedish',
      da: 'Danish',
      fi: 'Finnish',
      no: 'Norwegian',
    };

    const baseLang = code.split('-')[0];
    return languages[baseLang] || code;
  }
}
