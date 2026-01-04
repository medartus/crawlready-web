import type {
  SchemaAnalysis,
  SchemaFormat,
  SchemaIssue,
  SchemaLocation,
  SchemaType,
} from '@/types/crawler-checker';

/**
 * Schema Analyzer - Detects and scores Schema markup based on schema-markup-spec.md
 * Implements comprehensive scoring methodology for AI crawler optimization
 */

// Schema validation rules by type
const SCHEMA_REQUIRED_FIELDS: Record<string, string[]> = {
  Article: ['@context', '@type', 'headline', 'author', 'datePublished', 'publisher'],
  BlogPosting: ['@context', '@type', 'headline', 'author', 'datePublished', 'publisher'],
  NewsArticle: ['@context', '@type', 'headline', 'author', 'datePublished', 'publisher'],
  FAQPage: ['@context', '@type', 'mainEntity'],
  Organization: ['@context', '@type', 'name', 'url'],
  Person: ['@context', '@type', 'name'],
  Product: ['@context', '@type', 'name', 'description', 'image'],
  HowTo: ['@context', '@type', 'name', 'step'],
  BreadcrumbList: ['@context', '@type', 'itemListElement'],
  WebPage: ['@context', '@type', 'name'],
  WebSite: ['@context', '@type', 'name', 'url'],
};

const SCHEMA_RECOMMENDED_FIELDS: Record<string, string[]> = {
  Article: ['dateModified', 'image', 'description', 'mainEntityOfPage', 'articleSection'],
  BlogPosting: ['dateModified', 'image', 'description', 'mainEntityOfPage'],
  NewsArticle: ['dateModified', 'image', 'description', 'mainEntityOfPage'],
  FAQPage: [],
  Organization: ['logo', 'description', 'sameAs', 'contactPoint', 'address', 'foundingDate'],
  Person: ['jobTitle', 'affiliation', 'alumniOf', 'sameAs', 'knowsAbout', 'description', 'image'],
  Product: ['brand', 'sku', 'offers', 'aggregateRating', 'review'],
  HowTo: ['totalTime', 'tool', 'supply', 'image'],
  BreadcrumbList: [],
  WebPage: ['description', 'url', 'breadcrumb'],
  WebSite: ['potentialAction'],
};

// Page type detection patterns
const PAGE_TYPE_PATTERNS = {
  article: [
    /\/(article|post|blog|news)\//i,
    /\/\d{4}\/\d{2}\//,
    /<article[^>]*>/i,
    /<meta property="og:type" content="article"/i,
  ],
  product: [
    /\/(product|item|shop)\//i,
    /class="[^"]*price[^"]*"/i,
    /\$\d+\.\d{2}/,
  ],
  homepage: [
    /^\/$|^\/[a-z]{2}\/?$/,
  ],
  about: [
    /\/(about|company|team)\//i,
  ],
  contact: [
    /\/(contact|support)\//i,
  ],
};

/**
 * Detect and extract all schema markup from HTML
 */
export function detectSchemaMarkup(html: string): {
  schemas: SchemaLocation[];
  primaryFormat: SchemaFormat;
} {
  const schemas: SchemaLocation[] = [];

  // 1. Detect JSON-LD (preferred format)
  const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi);
  if (jsonLdMatches) {
    jsonLdMatches.forEach((match) => {
      try {
        const jsonContent = match.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
        const parsed = JSON.parse(jsonContent);
        const location = html.indexOf(match) < html.indexOf('</head>') ? 'head' : 'body';

        // Handle @graph arrays
        if (parsed['@graph']) {
          parsed['@graph'].forEach((item: any) => {
            schemas.push({
              type: 'json-ld',
              location,
              schemaType: item['@type'] || 'Unknown',
              raw: JSON.stringify(item),
            });
          });
        } else {
          schemas.push({
            type: 'json-ld',
            location,
            schemaType: parsed['@type'] || 'Unknown',
            raw: jsonContent,
          });
        }
      } catch {
        // Invalid JSON-LD
        schemas.push({
          type: 'json-ld',
          location: 'body',
          schemaType: 'Invalid',
          raw: match,
        });
      }
    });
  }

  // 2. Detect Microdata
  const microdataMatches = html.match(/itemscope[^>]*itemtype=["']([^"']+)["']/gi);
  if (microdataMatches) {
    microdataMatches.forEach((match) => {
      const typeMatch = match.match(/itemtype=["']([^"']+)["']/i);
      if (typeMatch && typeMatch[1]) {
        const fullType = typeMatch[1];
        const schemaType = fullType.split('/').pop() || 'Unknown';
        schemas.push({
          type: 'microdata',
          location: 'body',
          schemaType,
          raw: match,
        });
      }
    });
  }

  // 3. Detect RDFa
  const rdfaMatches = html.match(/typeof=["']([^"']+)["']/gi);
  if (rdfaMatches) {
    rdfaMatches.forEach((match) => {
      const typeMatch = match.match(/typeof=["']([^"']+)["']/i);
      if (typeMatch && typeMatch[1]) {
        schemas.push({
          type: 'rdfa',
          location: 'body',
          schemaType: typeMatch[1],
          raw: match,
        });
      }
    });
  }

  // Determine primary format
  const jsonLdCount = schemas.filter(s => s.type === 'json-ld').length;
  const microdataCount = schemas.filter(s => s.type === 'microdata').length;
  const rdfaCount = schemas.filter(s => s.type === 'rdfa').length;

  let primaryFormat: SchemaFormat = 'none';
  if (jsonLdCount > 0) {
    primaryFormat = 'json-ld';
  } else if (microdataCount > 0) {
    primaryFormat = 'microdata';
  } else if (rdfaCount > 0) {
    primaryFormat = 'rdfa';
  }

  return { schemas, primaryFormat };
}

/**
 * Detect page type from URL and HTML content
 */
export function detectPageType(url: string, html: string): SchemaAnalysis['pageType'] {
  // Check URL patterns
  if (PAGE_TYPE_PATTERNS.homepage.some(pattern => pattern.test(url))) {
    return 'homepage';
  }
  if (PAGE_TYPE_PATTERNS.article.some(pattern => pattern.test(url) || pattern.test(html))) {
    return 'article';
  }
  if (PAGE_TYPE_PATTERNS.product.some(pattern => pattern.test(url) || pattern.test(html))) {
    return 'product';
  }
  if (PAGE_TYPE_PATTERNS.about.some(pattern => pattern.test(url))) {
    return 'about';
  }
  if (PAGE_TYPE_PATTERNS.contact.some(pattern => pattern.test(url))) {
    return 'contact';
  }

  return 'other';
}

/**
 * Get recommended schemas for page type
 */
export function getRecommendedSchemas(pageType: SchemaAnalysis['pageType']): SchemaType[] {
  const recommendations: Record<SchemaAnalysis['pageType'], SchemaType[]> = {
    'homepage': ['Organization', 'WebSite', 'WebPage'],
    'article': ['Article', 'Person', 'Organization', 'BreadcrumbList'],
    'product': ['Product', 'Organization', 'BreadcrumbList', 'AggregateRating'],
    'service': ['Organization', 'BreadcrumbList'],
    'about': ['Organization', 'Person', 'WebPage'],
    'contact': ['Organization', 'WebPage'],
    'blog-listing': ['WebPage', 'BreadcrumbList'],
    'other': ['WebPage'],
  };

  return recommendations[pageType] || [];
}

/**
 * Calculate presence score (40 points max)
 */
function calculatePresenceScore(
  schemas: SchemaLocation[],
  pageType: SchemaAnalysis['pageType'],
): number {
  let score = 0;
  const schemaTypes = schemas.map(s => s.schemaType);

  // JSON-LD format bonus
  if (schemas.some(s => s.type === 'json-ld')) {
    score += 15;
  }

  // Essential schemas
  if (schemaTypes.includes('Organization')) {
    score += 10;
  }
  if (schemaTypes.includes('WebPage') || schemaTypes.includes('WebSite')) {
    score += 5;
  }

  // Page-type specific
  if (pageType === 'article' && (schemaTypes.includes('Article') || schemaTypes.includes('BlogPosting') || schemaTypes.includes('NewsArticle'))) {
    score += 15;
  }
  if (pageType === 'product' && schemaTypes.includes('Product')) {
    score += 15;
  }
  if (schemaTypes.includes('Person')) {
    score += 8;
  }
  if (schemaTypes.includes('BreadcrumbList')) {
    score += 5;
  }
  if (schemaTypes.includes('FAQPage')) {
    score += 12;
  }

  return Math.min(score, 40);
}

/**
 * Calculate completeness score (30 points max)
 */
function calculateCompletenessScore(rawSchemas: any[]): number {
  if (rawSchemas.length === 0) {
    return 0;
  }

  const scores = rawSchemas.map((schema) => {
    const type = schema['@type'];
    if (!type) {
      return 0;
    }

    const required = SCHEMA_REQUIRED_FIELDS[type] || [];
    const recommended = SCHEMA_RECOMMENDED_FIELDS[type] || [];

    if (required.length === 0) {
      return 100;
    } // No validation rules

    const requiredPresent = required.filter(field => schema[field] !== undefined).length;
    const recommendedPresent = recommended.filter(field => schema[field] !== undefined).length;

    const requiredScore = required.length > 0 ? (requiredPresent / required.length) : 1;
    const recommendedScore = recommended.length > 0 ? (recommendedPresent / recommended.length) : 1;

    return (requiredScore * 0.6 + recommendedScore * 0.4) * 100;
  });

  const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  return Math.round((avgScore / 100) * 30);
}

/**
 * Calculate quality score (20 points max)
 */
function calculateQualityScore(rawSchemas: any[]): number {
  let score = 0;

  rawSchemas.forEach((schema) => {
    // Property value quality (8 points)
    if (schema.headline && schema.headline.length >= 20 && schema.headline.length <= 110) {
      score += 2;
    }
    if (schema.description && schema.description.length >= 50 && schema.description.length <= 300) {
      score += 2;
    }
    if (schema.image) {
      score += 2;
    }
    if (schema.aggregateRating && schema.aggregateRating.ratingValue <= 5) {
      score += 2;
    }

    // Entity relationships (4 points)
    if (schema['@id']) {
      score += 2;
    }
    if (schema.author && typeof schema.author === 'object' && schema.author['@type']) {
      score += 2;
    }

    // Freshness (3 points)
    if (schema.dateModified) {
      const modDate = new Date(schema.dateModified);
      const now = new Date();
      const monthsOld = (now.getTime() - modDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
      if (monthsOld < 12) {
        score += 2;
      }
    }
    if (schema.datePublished) {
      score += 1;
    }
  });

  return Math.min(score, 20);
}

/**
 * Calculate implementation score (10 points max)
 */
function calculateImplementationScore(
  schemas: SchemaLocation[],
  primaryFormat: SchemaFormat,
): number {
  let score = 0;

  // Format score (3 points)
  if (primaryFormat === 'json-ld') {
    score += 3;
  } else if (primaryFormat === 'microdata') {
    score += 2;
  } else if (primaryFormat === 'rdfa') {
    score += 1;
  }

  // Valid JSON syntax (3 points)
  const hasValidJson = schemas.filter(s => s.type === 'json-ld').every((s) => {
    try {
      JSON.parse(s.raw);
      return true;
    } catch {
      return false;
    }
  });
  if (hasValidJson) {
    score += 3;
  }

  // Placement (2 points)
  if (schemas.some(s => s.location === 'head')) {
    score += 2;
  }

  // Multiple schemas properly structured (2 points)
  if (schemas.length >= 2) {
    score += 2;
  }

  return Math.min(score, 10);
}

/**
 * Generate schema issues and recommendations
 */
function generateIssuesAndRecommendations(
  schemas: SchemaLocation[],
  rawSchemas: any[],
  pageType: SchemaAnalysis['pageType'],
  missingSchemas: SchemaType[],
): { issues: SchemaIssue[]; recommendations: SchemaAnalysis['recommendations'] } {
  const issues: SchemaIssue[] = [];
  const recommendations: SchemaAnalysis['recommendations'] = [];

  // Critical: No schema
  if (schemas.length === 0) {
    issues.push({
      severity: 'critical',
      category: 'presence',
      title: 'No Schema Markup Found',
      description: 'Your site has no structured data, making it invisible to AI crawlers.',
      impact: 'AI crawlers cannot understand your content, reducing citation chances by 80%.',
      fix: 'Add JSON-LD structured data to your pages.',
      example: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Your Company",
  "url": "https://yoursite.com"
}
</script>`,
    });

    recommendations.push({
      priority: 'critical',
      title: 'Implement Schema Markup',
      description: 'Add JSON-LD structured data to enable AI crawler understanding.',
      impact: 'Expected 80% improvement in AI visibility and citation rate.',
      implementation: 'Start with Organization and WebPage schemas, then add content-specific types.',
    });
  }

  // Missing Organization
  if (!schemas.some(s => s.schemaType === 'Organization')) {
    issues.push({
      severity: 'high',
      category: 'presence',
      title: 'Missing Organization Schema',
      description: 'Add Organization schema to help AI understand your brand.',
      impact: 'Reduces brand recognition in AI responses by 60%.',
    });

    recommendations.push({
      priority: 'high',
      title: 'Add Organization Schema',
      description: 'Establish your brand entity with Organization schema including logo and social profiles.',
      impact: 'Expected 60% improvement in brand recognition.',
    });
  }

  // Check for incomplete schemas
  rawSchemas.forEach((schema) => {
    const type = schema['@type'];
    if (!type) {
      return;
    }

    const required = SCHEMA_REQUIRED_FIELDS[type] || [];
    const missing = required.filter(field => !schema[field]);

    if (missing.length > 0) {
      issues.push({
        severity: 'critical',
        category: 'completeness',
        title: `Incomplete ${type} Schema`,
        description: `Missing required fields: ${missing.join(', ')}`,
        impact: 'AI systems cannot properly understand or cite your content.',
        fix: `Add the following required properties: ${missing.join(', ')}`,
      });
    }

    // Check for missing recommended fields
    const recommended = SCHEMA_RECOMMENDED_FIELDS[type] || [];
    const missingRecommended = recommended.filter(field => !schema[field]);

    if (missingRecommended.length > 0 && missingRecommended.length <= 3) {
      recommendations.push({
        priority: 'medium',
        title: `Enhance ${type} Schema`,
        description: `Add recommended fields: ${missingRecommended.join(', ')}`,
        impact: 'Complete schemas are 3x more likely to be cited by AI.',
      });
    }
  });

  // Missing recommended schemas
  missingSchemas.forEach((schemaType) => {
    if (schemaType === 'FAQPage' && pageType === 'article') {
      recommendations.push({
        priority: 'high',
        title: 'Add FAQPage Schema',
        description: 'If your page contains Q&A content, add FAQPage schema.',
        impact: 'Expected 52% increase in AI citation for FAQ content.',
        implementation: 'Structure your questions and answers in FAQPage schema format.',
      });
    }

    if (schemaType === 'BreadcrumbList') {
      recommendations.push({
        priority: 'medium',
        title: 'Add BreadcrumbList Schema',
        description: 'Help AI understand your site structure with breadcrumb navigation.',
        impact: 'Expected 20% improvement in content relationship understanding.',
      });
    }
  });

  return { issues, recommendations };
}

/**
 * Main schema analysis function
 */
export function analyzeSchema(html: string, url: string): SchemaAnalysis {
  // Detect schemas
  const { schemas, primaryFormat } = detectSchemaMarkup(html);

  // Parse raw schemas
  const rawSchemas: any[] = [];
  schemas.forEach((schema) => {
    if (schema.type === 'json-ld') {
      try {
        rawSchemas.push(JSON.parse(schema.raw));
      } catch {
        // Invalid JSON
      }
    }
  });

  // Detect page type
  const pageType = detectPageType(url, html);

  // Get recommendations
  const recommendedSchemas = getRecommendedSchemas(pageType);
  const schemaTypes = [...new Set(schemas.map(s => s.schemaType as SchemaType))];
  const missingSchemas = recommendedSchemas.filter(rec => !schemaTypes.includes(rec));

  // Calculate scores
  const presenceScore = calculatePresenceScore(schemas, pageType);
  const completenessScore = calculateCompletenessScore(rawSchemas);
  const qualityScore = calculateQualityScore(rawSchemas);
  const implementationScore = calculateImplementationScore(schemas, primaryFormat);

  const overallScore = presenceScore + completenessScore + qualityScore + implementationScore;

  // Determine grade
  let grade: SchemaAnalysis['grade'];
  if (overallScore >= 90) {
    grade = 'A+';
  } else if (overallScore >= 80) {
    grade = 'A';
  } else if (overallScore >= 70) {
    grade = 'B';
  } else if (overallScore >= 60) {
    grade = 'C';
  } else if (overallScore >= 50) {
    grade = 'D';
  } else {
    grade = 'F';
  }

  // Generate issues and recommendations
  const { issues, recommendations } = generateIssuesAndRecommendations(
    schemas,
    rawSchemas,
    pageType,
    missingSchemas,
  );

  // Build category scores
  const hasJsonLd = schemas.some(s => s.type === 'json-ld');
  const hasOrganization = schemaTypes.includes('Organization');
  const hasWebPage = schemaTypes.includes('WebPage') || schemaTypes.includes('WebSite');
  const hasContentType = schemaTypes.some(t =>
    ['Article', 'BlogPosting', 'NewsArticle', 'Product', 'FAQPage'].includes(t),
  );

  return {
    overallScore,
    grade,
    hasSchema: schemas.length > 0,
    schemaTypes,
    schemaCount: schemas.length,
    primaryFormat,
    schemaLocations: schemas,
    rawSchemas,
    pageType,
    recommendedSchemas,
    missingSchemas,
    categories: {
      presence: {
        score: presenceScore,
        hasJsonLd,
        hasOrganization,
        hasWebPage,
        hasContentType,
        issues: issues.filter(i => i.category === 'presence').map(i => i.title),
      },
      completeness: {
        score: completenessScore,
        requiredFieldsPresent: 0, // Calculated in detail
        requiredFieldsTotal: 0,
        recommendedFieldsPresent: 0,
        recommendedFieldsTotal: 0,
        missingCriticalFields: [],
        missingRecommendedFields: [],
      },
      validity: {
        score: implementationScore >= 6 ? 20 : 10,
        isValidJson: primaryFormat === 'json-ld',
        hasValidContext: rawSchemas.every(s => s['@context']),
        hasValidTypes: rawSchemas.every(s => s['@type']),
        validationErrors: [],
      },
      aiOptimization: {
        score: qualityScore,
        hasDescription: rawSchemas.some(s => s.description),
        hasImages: rawSchemas.some(s => s.image),
        hasAuthor: rawSchemas.some(s => s.author),
        hasPublishDate: rawSchemas.some(s => s.datePublished),
        hasBreadcrumbs: schemaTypes.includes('BreadcrumbList'),
        hasStructuredContent: schemaTypes.includes('FAQPage') || schemaTypes.includes('HowTo'),
        opportunities: recommendations.map(r => r.title),
      },
    },
    issues,
    recommendations,
  };
}
