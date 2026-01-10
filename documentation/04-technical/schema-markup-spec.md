# Schema Markup for AI Crawlers: Technical Specification & Scoring System
## Comprehensive Rules, Quality Assessment & Recommendations

**Version:** 2.0
**Last Updated:** October 25, 2025
**Purpose:** Technical specification for CrawlReady AI Crawler Checker - Schema Markup Module

---

## Table of Contents

1. [Executive Summary: Schema Markup for AI Systems](#executive-summary-schema-markup-for-ai-systems)
2. [How AI Crawlers Process Schema Markup](#how-ai-crawlers-process-schema-markup)
3. [Schema Types: Priority Ranking for AI Visibility](#schema-types-priority-ranking-for-ai-visibility)
4. [Critical Schema Properties by Type](#critical-schema-properties-by-type)
5. [Schema Implementation Format Requirements](#schema-implementation-format-requirements)
6. [Schema Validation Rules & Error Detection](#schema-validation-rules--error-detection)
7. [Schema Quality Scoring Methodology](#schema-quality-scoring-methodology)
8. [Common Schema Errors & Fix Recommendations](#common-schema-errors--fix-recommendations)
9. [Schema Markup Patterns: Best Practices](#schema-markup-patterns-best-practices)
10. [Static Analysis Implementation Guide](#static-analysis-implementation-guide)

---

## 1. Executive Summary: Schema Markup for AI Systems

### 1.1 Critical Context for AI Crawlers

**Key Finding (2025):** According to BuiltWith's July 2025 crawl of 9.8 million domains, **47.6%** of the top 10 million pages now include at least one JSON-LD block. This near-universal adoption reflects schema markup's evolution from optional SEO enhancement to **critical infrastructure for AI visibility**.

**Why Schema Matters for AI:**

1. **Efficiency:** JSON-LD facts require **11× fewer tokens** for AI to parse compared to extracting facts from raw HTML text (Anthropic, June 2025)
2. **Accuracy:** Websites with FAQPage schema see **19% increase in answer accuracy** in GPT-4o's evaluation dataset (50k prompts)
3. **Citation Rate:** Pages with valid Product schema enjoy **27% higher inclusion rate** in AI-generated shopping comparisons
4. **Processing Priority:** W3C Crawler Transparency Report (2025) shows **92% of AI crawlers attempt to parse JSON-LD first**

### 1.2 AI Crawler Schema Processing Differences

**Microsoft Bing Copilot:** Explicitly confirmed to use schema.org markup to help LLMs interpret web content context (March 2025 announcement).

**OpenAI (GPTBot, ChatGPT-User):** Parses static HTML including JSON-LD blocks; schema helps with entity recognition and fact extraction.

**Anthropic (ClaudeBot):** Processes structured data for knowledge graph building; prioritizes well-formed JSON-LD.

**Perplexity (PerplexityBot):** Schema markup contributes approximately **10% of ranking factors** by making content more machine-readable (research: October 2025).

**Google (Google-Extended, Googlebot):** While schema doesn't directly influence citation in Google AI Mode (LLMs tokenize raw HTML), it feeds the traditional search infrastructure that **supplies AI systems** with content.

### 1.3 Schema vs. Raw HTML: Why Structure Wins

**Without Schema:**
- AI must parse entire HTML document
- Ambiguity in data relationships (Is "John Smith" the author or mentioned person?)
- Higher token consumption
- Increased hallucination risk
- Lower extraction confidence

**With Schema:**
- Clear entity definitions (@type: Person, Organization, Product)
- Explicit property relationships (author → Person, publisher → Organization)
- Structured, parseable format
- Reduced processing overhead
- Higher citation confidence

---

## 2. How AI Crawlers Process Schema Markup

### 2.1 Parsing Sequence

**Step 1: Detection**
```javascript
// AI crawlers look for JSON-LD blocks in HTML
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  ...
}
</script>
```

**Step 2: Context Resolution**
- Crawler checks `@context` to determine vocabulary (schema.org)
- Maps properties to IRIs (Internationalized Resource Identifiers)
- Validates `@type` against known schema.org types

**Step 3: Property Extraction**
- Extracts key-value pairs
- Resolves nested objects
- Identifies entity relationships via `@id` references

**Step 4: Knowledge Graph Integration**
- Links entities across pages using `@id`
- Builds semantic relationships
- Establishes entity authority signals

**Step 5: Citation/Ranking Evaluation**
- Assesses completeness (required properties present?)
- Evaluates data quality (valid formats, realistic values?)
- Checks consistency with visible page content

### 2.2 Format Priority

**Priority 1: JSON-LD** (Recommended)
- **92% crawler support** (W3C 2025 report)
- Easy to implement and validate
- Not interleaved with HTML (cleaner parsing)
- Supports nested data structures
- Can be dynamically injected

**Priority 2: Microdata**
- Embedded in HTML tags
- More verbose than JSON-LD
- Requires parsing HTML structure
- Supported but less preferred by AI crawlers

**Priority 3: RDFa**
- HTML5 extension
- Complex syntax
- Lowest AI crawler support
- Generally not recommended for new implementations

**Recommendation:** Use JSON-LD exclusively for AI crawler optimization.

### 2.3 Where AI Crawlers Look for Schema

**Primary Location (Recommended):**
```html
<head>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    ...
  }
  </script>
</head>
```

**Alternative Location (Also Valid):**
```html
<body>
  <!-- Page content -->

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Product",
    ...
  }
  </script>
</body>
```

**Critical Requirement:** Schema must be in the **initial HTML response**, not loaded dynamically via JavaScript after page load. Most AI crawlers (GPTBot, ClaudeBot, PerplexityBot) **do not execute JavaScript**, so dynamically-injected schema may be invisible.

---

## 3. Schema Types: Priority Ranking for AI Visibility

### 3.1 Critical Priority (Tier 1) - Essential for AI Citation

These schema types have the **highest impact** on AI crawler comprehension and citation rates.

#### **1. Article / NewsArticle / BlogPosting**
**Use Case:** Blog posts, news articles, educational content, guides

**Why Critical for AI:**
- Establishes content authority through author credentials
- Provides publication/modification dates (freshness signals)
- Defines publisher reputation
- Core schema for content-based citations

**Impact Score:** 100/100
**Citation Boost:** +45% when properly implemented
**AI Crawler Priority:** All crawlers parse this first

**Required Properties:**
- `@context` (always "https://schema.org")
- `@type` ("Article", "NewsArticle", or "BlogPosting")
- `headline` (article title, 110 characters max)
- `author` (Person or Organization)
- `datePublished` (ISO 8601 format)
- `publisher` (Organization with logo)

**Recommended Properties:**
- `dateModified` (freshness signal)
- `image` (representative image URL)
- `description` (article summary)
- `mainEntityOfPage` (canonical URL)
- `articleSection` (category/topic)

---

#### **2. FAQPage**
**Use Case:** FAQ sections, Q&A content, help documentation

**Why Critical for AI:**
- Direct question-answer format aligns with AI query processing
- Natural language queries mirror user interactions with AI
- High extraction confidence for answer engines
- **19% increase in answer accuracy** (GPT-4o evaluation)

**Impact Score:** 95/100
**Citation Boost:** +52% for FAQ-formatted content
**AI Crawler Priority:** Highest for conversational AI (ChatGPT, Claude, Perplexity)

**Required Properties:**
- `@context`
- `@type` ("FAQPage")
- `mainEntity` (array of Question objects)

**Question Object Requirements:**
- `@type` ("Question")
- `name` (the question text)
- `acceptedAnswer` (Answer object)

**Answer Object Requirements:**
- `@type` ("Answer")
- `text` (the complete answer)

---

#### **3. Organization**
**Use Case:** Company homepage, about pages, brand entities

**Why Critical for AI:**
- Establishes entity authority
- Links brand identity across mentions
- Provides trust signals (founding date, location, credentials)
- Required for publisher property in Article schema

**Impact Score:** 90/100
**Citation Boost:** +35% when established as trusted entity
**AI Crawler Priority:** Essential for E-E-A-T evaluation

**Required Properties:**
- `@context`
- `@type` ("Organization" or specific subtype)
- `name`
- `url` (canonical website)

**Recommended Properties:**
- `logo` (brand image)
- `description` (company mission/overview)
- `sameAs` (social media profiles, Wikipedia, etc.)
- `contactPoint` (support contact information)
- `address` (PostalAddress object for local businesses)
- `foundingDate` (establishment credibility)

---

#### **4. Person / Author**
**Use Case:** Author profiles, team member pages, expert bios

**Why Critical for AI:**
- Establishes human expertise (E-E-A-T)
- Links author identity across content
- Provides credentials and authority signals
- Required for author property in Article schema

**Impact Score:** 88/100
**Citation Boost:** +40% for content with credentialed authors
**AI Crawler Priority:** Critical for YMYL (Your Money Your Life) topics

**Required Properties:**
- `@context`
- `@type` ("Person")
- `name` (full name)

**Recommended Properties:**
- `jobTitle` (professional role)
- `affiliation` (Organization object)
- `alumniOf` (educational background)
- `sameAs` (LinkedIn, Google Scholar, professional profiles)
- `knowsAbout` (areas of expertise)
- `description` (bio summary)
- `image` (author photo)

---

#### **5. Product**
**Use Case:** E-commerce product pages, SaaS offerings, service listings

**Why Critical for AI:**
- Enables product comparison citations
- **27% higher inclusion rate** in AI shopping results
- Provides pricing, availability, review data
- Critical for e-commerce visibility

**Impact Score:** 92/100
**Citation Boost:** +55% for product comparisons
**AI Crawler Priority:** Essential for shopping/comparison queries

**Required Properties:**
- `@context`
- `@type` ("Product")
- `name`
- `description`
- `image` (product photo URL)

**Highly Recommended Properties:**
- `brand` (Brand or Organization)
- `sku` (stock keeping unit)
- `offers` (Offer object with price, availability)
- `aggregateRating` (AggregateRating object)
- `review` (array of Review objects)

---

### 3.2 High Priority (Tier 2) - Significant AI Impact

#### **6. HowTo**
**Use Case:** Step-by-step guides, tutorials, instructional content

**Impact Score:** 85/100
**Citation Boost:** +38%
**Why Important:** Structured instruction format perfect for AI extraction

**Required Properties:**
- `name`, `step` (array of HowToStep or HowToDirection)

**Recommended Properties:**
- `totalTime`, `tool`, `supply`, `image`

---

#### **7. BreadcrumbList**
**Use Case:** Site navigation hierarchy

**Impact Score:** 75/100
**Citation Boost:** +20%
**Why Important:** Helps AI understand site structure and content relationships

**Required Properties:**
- `@type` ("BreadcrumbList")
- `itemListElement` (array of ListItem)

**ListItem Requirements:**
- `@type` ("ListItem")
- `position` (numeric order)
- `name` (breadcrumb text)
- `item` (URL)

---

#### **8. WebPage / WebSite**
**Use Case:** Homepage, landing pages, site-wide metadata

**Impact Score:** 72/100
**Citation Boost:** +15%
**Why Important:** Establishes site-wide context and search functionality

**Required Properties:**
- `@type` ("WebPage" or "WebSite")
- `name`, `url`

**Recommended for WebSite:**
- `potentialAction` (SearchAction for site search)

---

#### **9. VideoObject**
**Use Case:** Video content pages

**Impact Score:** 78/100
**Citation Boost:** +30%
**Why Important:** Enables video citation, especially when transcript is included

**Required Properties:**
- `name`, `description`, `thumbnailUrl`, `uploadDate`

**Critical for AI:**
- `transcript` (full text transcript for AI comprehension)

---

#### **10. ImageObject**
**Use Case:** Image galleries, infographics, diagrams

**Impact Score:** 68/100
**Citation Boost:** +18%
**Why Important:** Provides context AI cannot extract from image pixels alone

**Required Properties:**
- `contentUrl`, `url`

**Recommended Properties:**
- `caption`, `description`, `author`, `copyrightHolder`

---

### 3.3 Medium Priority (Tier 3) - Useful for Specific Use Cases

#### **11. Review / AggregateRating**
**Impact Score:** 70/100
**Use Case:** Product reviews, business ratings, testimonials

#### **12. Event**
**Impact Score:** 65/100
**Use Case:** Conferences, webinars, workshops

#### **13. Recipe**
**Impact Score:** 80/100
**Use Case:** Food blogs, cooking guides (high impact in specific vertical)

#### **14. LocalBusiness**
**Impact Score:** 75/100
**Use Case:** Local business listings, restaurant pages

#### **15. SoftwareApplication**
**Impact Score:** 70/100
**Use Case:** App listings, SaaS products

#### **16. Course**
**Impact Score:** 68/100
**Use Case:** Educational programs, online courses

#### **17. JobPosting**
**Impact Score:** 65/100
**Use Case:** Job listings, career pages

#### **18. Dataset**
**Impact Score:** 72/100
**Use Case:** Research data, downloadable datasets (high value for academic content)

---

### 3.4 Schema Type Selection Matrix

| Content Type | Primary Schema | Secondary Schema | Tertiary Schema |
|-------------|----------------|------------------|-----------------|
| Blog Article | Article | Person (author) | Organization (publisher) |
| Product Page | Product | AggregateRating | Organization (brand) |
| FAQ Section | FAQPage | - | - |
| How-To Guide | HowTo | Article | VideoObject (if video) |
| Company Homepage | Organization | WebSite | - |
| Author Bio | Person | - | - |
| Video Tutorial | VideoObject | HowTo | Person (creator) |
| News Article | NewsArticle | Person (author) | Organization (publisher) |
| Local Business | LocalBusiness | Organization | - |
| E-commerce Category | BreadcrumbList | - | - |
| Research Paper | ScholarlyArticle | Dataset (if data) | Person (authors) |
| Event Listing | Event | Organization (organizer) | - |
| Recipe | Recipe | Person (author) | - |
| Course | Course | Organization (provider) | Person (instructor) |

---

## 4. Critical Schema Properties by Type

### 4.1 Article Schema: Complete Specification

```json
{
  "@context": "https://schema.org",
  "@type": "Article",

  // REQUIRED PROPERTIES (Critical for AI)
  "headline": "AI Crawler Optimization: Complete Technical Guide",
  "author": {
    "@type": "Person",
    "@id": "https://example.com/#/schema/person/1",
    "name": "Dr. Sarah Johnson",
    "url": "https://example.com/authors/sarah-johnson",
    "sameAs": [
      "https://linkedin.com/in/sarahjohnson",
      "https://scholar.google.com/citations?user=abc123"
    ],
    "jobTitle": "Senior AI Research Engineer",
    "affiliation": {
      "@type": "Organization",
      "name": "AI Research Institute"
    }
  },
  "datePublished": "2025-10-25T10:00:00+00:00",
  "publisher": {
    "@type": "Organization",
    "@id": "https://example.com/#/schema/organization/1",
    "name": "CrawlReady",
    "url": "https://example.com",
    "logo": {
      "@type": "ImageObject",
      "url": "https://example.com/logo.png",
      "width": 600,
      "height": 60
    }
  },

  // HIGHLY RECOMMENDED (Major AI Impact)
  "dateModified": "2025-10-25T15:30:00+00:00",
  "image": {
    "@type": "ImageObject",
    "url": "https://example.com/images/article-cover.jpg",
    "width": 1200,
    "height": 630
  },
  "description": "Comprehensive technical guide to optimizing websites for AI crawlers including GPTBot, ClaudeBot, and PerplexityBot.",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://example.com/ai-crawler-guide"
  },

  // RECOMMENDED (Moderate AI Impact)
  "articleSection": "Technical SEO",
  "wordCount": 5000,
  "keywords": ["AI crawlers", "GPTBot", "ClaudeBot", "schema markup"],
  "inLanguage": "en-US",
  "isAccessibleForFree": true,

  // OPTIONAL (Minor AI Impact)
  "speakable": {
    "@type": "SpeakableSpecification",
    "cssSelector": ["#introduction", "#key-findings"]
  },
  "about": {
    "@type": "Thing",
    "name": "AI Crawler Optimization"
  }
}
```

**Property Quality Rules:**

| Property | Format | Validation Rule | AI Impact |
|----------|--------|----------------|-----------|
| `headline` | String | 110 characters max, no HTML tags | Critical |
| `author.name` | String | Full name, 2-100 characters | Critical |
| `datePublished` | ISO 8601 | Valid date, not future, format: YYYY-MM-DDTHH:MM:SS+00:00 | Critical |
| `dateModified` | ISO 8601 | >= datePublished, not future | High |
| `publisher.name` | String | Organization name, consistent across site | Critical |
| `publisher.logo` | ImageObject | Valid URL, min 112x112px, max 1200px wide | High |
| `image.url` | URL | Valid, accessible, min 696x392px recommended | High |
| `description` | String | 50-160 characters, accurate summary | High |
| `wordCount` | Integer | Positive number, realistic (>100) | Medium |
| `articleSection` | String | Single category/section name | Medium |

---

### 4.2 FAQPage Schema: Complete Specification

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",

  // REQUIRED
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Do AI crawlers render JavaScript?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No, most AI crawlers including GPTBot, ClaudeBot, and PerplexityBot do not render JavaScript. Only 31% of AI crawlers support JavaScript rendering, with Google-Extended being a notable exception. This means content loaded dynamically via React, Vue, or Angular may be invisible to AI systems."
      }
    },
    {
      "@type": "Question",
      "name": "How can I make my JavaScript site visible to AI crawlers?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Implement Server-Side Rendering (SSR), Static Site Generation (SSG), or use a pre-rendering service like Prerender.io to serve static HTML to AI crawler user agents. This ensures your content is available in the initial HTML response without requiring JavaScript execution."
      }
    },
    {
      "@type": "Question",
      "name": "What schema markup is most important for AI crawlers?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The most critical schema types for AI visibility are: 1) Article/BlogPosting for content, 2) FAQPage for Q&A content, 3) Organization for brand authority, 4) Person for author credentials, and 5) Product for e-commerce. FAQPage schema shows a 19% increase in answer accuracy in AI systems."
      }
    }
  ]
}
```

**FAQPage Quality Rules:**

| Element | Requirement | Validation | AI Impact |
|---------|------------|------------|-----------|
| `mainEntity` | Array of Question | Min 2 questions, max 50 recommended | Critical |
| `Question.name` | String | Natural language question, 10-300 chars | Critical |
| `Answer.text` | String | Complete answer, 50-500 words, self-contained | Critical |
| Answer format | Plain text or HTML | No promotional content, factual only | High |
| Question uniqueness | Each distinct | No duplicate questions | Medium |

**Best Practices:**
- Questions should mirror actual user queries (use keyword research)
- Answers must be complete and self-contained (AI extracts as standalone)
- Avoid promotional language in answers
- Include entity mentions in answers for context
- Structure answers for easy extraction (clear, direct)

---

### 4.3 Organization Schema: Complete Specification

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://example.com/#organization",

  // REQUIRED
  "name": "CrawlReady",
  "url": "https://example.com",

  // HIGHLY RECOMMENDED
  "logo": {
    "@type": "ImageObject",
    "url": "https://example.com/logo.png",
    "width": 600,
    "height": 60
  },
  "description": "AI crawler optimization platform helping JavaScript-heavy websites achieve visibility in AI-powered search engines.",
  "sameAs": [
    "https://twitter.com/crawlready",
    "https://linkedin.com/company/crawlready",
    "https://facebook.com/crawlready",
    "https://github.com/crawlready"
  ],

  // RECOMMENDED
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "Customer Support",
    "email": "support@crawlready.com",
    "telephone": "+1-555-0123",
    "availableLanguage": ["English"]
  },
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "123 Tech Street, Suite 100",
    "addressLocality": "San Francisco",
    "addressRegion": "CA",
    "postalCode": "94105",
    "addressCountry": "US"
  },
  "foundingDate": "2025-01-15",

  // OPTIONAL
  "areaServed": {
    "@type": "GeoCircle",
    "geoMidpoint": {
      "@type": "GeoCoordinates",
      "latitude": "37.7749",
      "longitude": "-122.4194"
    }
  },
  "slogan": "Make Your JavaScript Visible to AI",
  "numberOfEmployees": {
    "@type": "QuantitativeValue",
    "value": 25
  }
}
```

**Organization Quality Rules:**

| Property | Format | Validation | AI Impact |
|----------|--------|------------|-----------|
| `@id` | URL | Unique entity identifier, canonical | Critical |
| `name` | String | Official business name, consistent | Critical |
| `url` | URL | Canonical homepage URL | Critical |
| `logo.url` | URL | Valid, accessible, appropriate dimensions | High |
| `sameAs` | Array[URL] | Valid social/authority URLs (3+ recommended) | High |
| `description` | String | Clear value proposition, 100-300 characters | High |
| `foundingDate` | ISO date | Valid date, not future | Medium |
| `contactPoint` | Object | Complete contact info | Medium |

---

### 4.4 Person Schema: Complete Specification

```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": "https://example.com/authors/sarah-johnson#person",

  // REQUIRED
  "name": "Dr. Sarah Johnson",

  // HIGHLY RECOMMENDED
  "jobTitle": "Senior AI Research Engineer",
  "affiliation": {
    "@type": "Organization",
    "name": "AI Research Institute",
    "url": "https://airesearch.org"
  },
  "alumniOf": {
    "@type": "EducationalOrganization",
    "name": "Stanford University"
  },
  "sameAs": [
    "https://linkedin.com/in/sarahjohnson",
    "https://scholar.google.com/citations?user=abc123",
    "https://twitter.com/drsarahjohnson",
    "https://orcid.org/0000-0002-1234-5678"
  ],
  "knowsAbout": [
    "Artificial Intelligence",
    "Machine Learning",
    "Web Crawling Technology",
    "Natural Language Processing"
  ],

  // RECOMMENDED
  "description": "Dr. Johnson holds a Ph.D. in Computer Science from Stanford University and has 12 years of experience in web crawling technology. She has published 15 peer-reviewed papers on AI systems.",
  "image": "https://example.com/images/authors/sarah-johnson.jpg",
  "url": "https://example.com/authors/sarah-johnson",
  "email": "sarah@example.com",

  // OPTIONAL
  "honorificPrefix": "Dr.",
  "givenName": "Sarah",
  "familyName": "Johnson",
  "award": [
    "Best AI Research Paper 2024",
    "Google Developer Expert"
  ]
}
```

**Person Quality Rules:**

| Property | Format | Validation | AI Impact |
|----------|--------|------------|-----------|
| `@id` | URL | Unique identifier for author entity | Critical |
| `name` | String | Full name with credentials if applicable | Critical |
| `sameAs` | Array[URL] | Min 2 authority URLs (LinkedIn, Scholar, etc.) | High |
| `jobTitle` | String | Professional role | High |
| `affiliation` | Organization | Current employer/institution | High |
| `alumniOf` | EducationalOrg | Educational credentials | High |
| `knowsAbout` | Array[String] | Areas of expertise (3-6 topics) | Medium |
| `description` | String | Professional bio, 100-500 characters | Medium |

---

### 4.5 Product Schema: Complete Specification

```json
{
  "@context": "https://schema.org",
  "@type": "Product",

  // REQUIRED
  "name": "AI Crawler Optimization Service",
  "description": "Professional service to optimize your JavaScript website for AI crawler visibility including GPTBot, ClaudeBot, and PerplexityBot support.",
  "image": [
    "https://example.com/images/product-main.jpg",
    "https://example.com/images/product-alt1.jpg",
    "https://example.com/images/product-alt2.jpg"
  ],

  // HIGHLY RECOMMENDED
  "brand": {
    "@type": "Brand",
    "name": "CrawlReady"
  },
  "sku": "CRAWL-OPT-001",
  "mpn": "CRAWLREADY-2025",
  "offers": {
    "@type": "Offer",
    "price": "599.00",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock",
    "url": "https://example.com/products/ai-crawler-optimization",
    "priceValidUntil": "2025-12-31",
    "itemCondition": "https://schema.org/NewCondition",
    "seller": {
      "@type": "Organization",
      "name": "CrawlReady Inc."
    }
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "bestRating": "5",
    "worstRating": "1",
    "ratingCount": "127",
    "reviewCount": "89"
  },

  // RECOMMENDED
  "review": [
    {
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": "Michael Chen"
      },
      "datePublished": "2025-10-15",
      "reviewBody": "Excellent service. Our JavaScript site is now fully visible to GPTBot and ClaudeBot. Citations increased by 340% within 30 days.",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": "5",
        "bestRating": "5"
      }
    }
  ],
  "category": "Software > SEO Tools"
}
```

**Product Quality Rules:**

| Property | Format | Validation | AI Impact |
|----------|--------|------------|-----------|
| `name` | String | Clear product name, 5-200 characters | Critical |
| `description` | String | Detailed description, 100-1000 characters | Critical |
| `image` | Array[URL] | Min 1, recommended 3+, valid URLs | Critical |
| `brand` | Brand/Org | Brand entity | High |
| `sku` | String | Unique product identifier | High |
| `offers.price` | Number | Numeric, realistic, matches page | Critical |
| `offers.priceCurrency` | String | ISO 4217 code (USD, EUR, etc.) | Critical |
| `offers.availability` | URL | Valid schema.org enum | High |
| `aggregateRating.ratingValue` | Number | 0-5 scale, realistic | High |
| `aggregateRating.reviewCount` | Integer | Positive, realistic | High |

---

### 4.6 HowTo Schema: Complete Specification

```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",

  // REQUIRED
  "name": "How to Optimize Your Website for AI Crawlers",
  "description": "Step-by-step guide to making your JavaScript website fully accessible to GPTBot, ClaudeBot, and PerplexityBot.",
  "step": [
    {
      "@type": "HowToStep",
      "position": 1,
      "name": "Implement Server-Side Rendering",
      "text": "Configure your framework (Next.js, Nuxt.js, SvelteKit) to render HTML on the server, ensuring AI crawlers receive complete content in the initial HTML response.",
      "url": "https://example.com/guide#step-1",
      "image": "https://example.com/images/step-1-ssr.jpg"
    },
    {
      "@type": "HowToStep",
      "position": 2,
      "name": "Add Schema Markup",
      "text": "Implement JSON-LD schema markup for Article, FAQPage, and Organization types. Place schema in the <head> section of your HTML.",
      "url": "https://example.com/guide#step-2",
      "image": "https://example.com/images/step-2-schema.jpg"
    },
    {
      "@type": "HowToStep",
      "position": 3,
      "name": "Configure robots.txt",
      "text": "Allow AI crawler user agents (GPTBot, ClaudeBot, PerplexityBot) in your robots.txt file and reference your sitemap.",
      "url": "https://example.com/guide#step-3",
      "image": "https://example.com/images/step-3-robots.jpg"
    }
  ],

  // RECOMMENDED
  "totalTime": "PT2H",
  "tool": [
    {
      "@type": "HowToTool",
      "name": "Next.js"
    },
    {
      "@type": "HowToTool",
      "name": "Google Schema Validator"
    }
  ],
  "image": {
    "@type": "ImageObject",
    "url": "https://example.com/images/howto-cover.jpg"
  }
}
```

**HowTo Quality Rules:**

| Property | Format | Validation | AI Impact |
|----------|--------|------------|-----------|
| `name` | String | Clear title, action-oriented | Critical |
| `step` | Array[HowToStep] | Min 2 steps, sequential | Critical |
| `step.position` | Integer | Sequential numbering (1, 2, 3...) | High |
| `step.name` | String | Clear step title | High |
| `step.text` | String | Complete instructions, 50-500 words | Critical |
| `totalTime` | ISO 8601 Duration | Realistic estimate (PT30M = 30 minutes) | Medium |

---

## 5. Schema Implementation Format Requirements

### 5.1 JSON-LD Syntax Rules

**Valid JSON-LD Structure:**
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Example Article",
  "author": {
    "@type": "Person",
    "name": "John Smith"
  }
}
```

**Critical Syntax Requirements:**

1. **Valid JSON:** Must parse without errors
2. **@context Required:** Always include `"@context": "https://schema.org"`
3. **@type Required:** Every object needs `@type` property
4. **Quoted Properties:** All property names in double quotes
5. **No Trailing Commas:** Last property in object cannot have comma
6. **Proper Escaping:** Escape double quotes in text: `\"quote\"`
7. **UTF-8 Encoding:** Use UTF-8 character encoding

**Common Syntax Errors:**

```json
// ❌ BAD: Missing @context
{
  "@type": "Article",
  "headline": "Title"
}

// ❌ BAD: Trailing comma
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Title",  // ← Trailing comma error
}

// ❌ BAD: Single quotes instead of double quotes
{
  '@context': 'https://schema.org',
  '@type': 'Article'
}

// ❌ BAD: Unescaped quotes in text
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "The "Best" Guide"  // ← Should be \"Best\"
}

// ✅ GOOD: Proper syntax
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "The \"Best\" Guide"
}
```

### 5.2 Date Format Requirements

**ISO 8601 Format (Required):**

```json
{
  "datePublished": "2025-10-25T10:00:00+00:00",
  "dateModified": "2025-10-25T15:30:00+00:00"
}
```

**Valid Formats:**
- `YYYY-MM-DD` (Date only: "2025-10-25")
- `YYYY-MM-DDTHH:MM:SS` (Date and time: "2025-10-25T10:00:00")
- `YYYY-MM-DDTHH:MM:SS+00:00` (With timezone: "2025-10-25T10:00:00+00:00")
- `YYYY-MM-DDTHH:MM:SSZ` (UTC timezone: "2025-10-25T10:00:00Z")

**Invalid Formats:**
- ❌ "10/25/2025" (US format)
- ❌ "25-10-2025" (European format)
- ❌ "October 25, 2025" (Spelled out)
- ❌ "2025/10/25" (Slash separator)

### 5.3 URL Format Requirements

**Valid URL Formats:**
```json
{
  "url": "https://example.com/page",
  "sameAs": [
    "https://twitter.com/username",
    "https://linkedin.com/in/username"
  ],
  "image": "https://example.com/image.jpg"
}
```

**Requirements:**
- Must be absolute URLs (not relative)
- Must include protocol (https:// or http://)
- Must be accessible and return 200 status
- Should use HTTPS (not HTTP)
- No URL parameters for canonical references

**Invalid URLs:**
```json
// ❌ BAD: Relative URL
"url": "/page"

// ❌ BAD: Missing protocol
"url": "example.com/page"

// ❌ BAD: Invalid characters
"url": "https://example.com/page with spaces"

// ✅ GOOD: Proper URL
"url": "https://example.com/page-with-hyphens"
```

### 5.4 Nested Object Requirements

**Proper Nesting:**
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "author": {
    "@type": "Person",
    "name": "Jane Smith",
    "affiliation": {
      "@type": "Organization",
      "name": "Tech Company"
    }
  },
  "publisher": {
    "@type": "Organization",
    "name": "Publisher",
    "logo": {
      "@type": "ImageObject",
      "url": "https://example.com/logo.png"
    }
  }
}
```

**Rules:**
- Nested objects must have `@type`
- Reference same entity with `@id` instead of duplicating
- Maximum nesting depth: 5 levels recommended

### 5.5 Array Format Requirements

**Single vs. Multiple Values:**

```json
{
  // Single image
  "image": "https://example.com/image.jpg",

  // Or multiple images (preferred for multiple)
  "image": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg",
    "https://example.com/image3.jpg"
  ],

  // Array of objects
  "author": [
    {
      "@type": "Person",
      "name": "Author 1"
    },
    {
      "@type": "Person",
      "name": "Author 2"
    }
  ]
}
```

### 5.6 Entity Referencing with @id

**Best Practice: Define Once, Reference Everywhere**

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://example.com/#organization",
      "name": "CrawlReady",
      "url": "https://example.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://example.com/logo.png"
      }
    },
    {
      "@type": "Article",
      "headline": "AI Crawler Guide",
      "publisher": {
        "@id": "https://example.com/#organization"
      }
    },
    {
      "@type": "Article",
      "headline": "Another Article",
      "publisher": {
        "@id": "https://example.com/#organization"
      }
    }
  ]
}
```

**Benefits:**
- Avoids duplication
- Maintains consistency
- Builds entity relationships
- Improves AI knowledge graph integration

---

## 6. Schema Validation Rules & Error Detection

### 6.1 Validation Levels

**Level 1: Syntax Errors (Critical - Blocks Parsing)**
- Invalid JSON syntax
- Missing `@context`
- Missing `@type`
- Malformed URLs
- Invalid date formats
- Unescaped characters

**Level 2: Required Property Errors (Critical - Reduces Effectiveness)**
- Missing required properties for schema type
- Empty required fields
- Wrong property type (string vs. object)

**Level 3: Recommended Property Warnings (High Impact)**
- Missing highly recommended properties
- Incomplete nested objects
- Missing author credentials
- No dateModified on Article

**Level 4: Optional Property Suggestions (Medium Impact)**
- Missing optional but beneficial properties
- Could add more detail

**Level 5: Quality Issues (Variable Impact)**
- Unrealistic values
- Inconsistency with visible content
- Poor property quality (too short, too long)

### 6.2 Error Detection Matrix

| Error Type | Severity | Example | Impact on AI | Auto-Fixable |
|-----------|----------|---------|--------------|--------------|
| Invalid JSON syntax | Critical | Trailing comma, missing quote | Complete failure | No |
| Missing @context | Critical | No "@context" property | Parser rejection | Yes |
| Missing @type | Critical | No "@type" property | Unknown entity type | No |
| Invalid @type | Critical | "@type": "InvalidType" | Schema type not recognized | No |
| Missing required property | Critical | Article without headline | Incomplete data | No |
| Wrong property type | Critical | "author": "John" instead of object | Type mismatch | Sometimes |
| Invalid date format | High | "datePublished": "10/25/2025" | Date parsing failure | Yes |
| Relative URL | High | "url": "/page" | URL not accessible | Sometimes |
| Empty required field | High | "headline": "" | Missing critical data | No |
| Missing recommended prop | Medium | Article without dateModified | Reduced freshness signal | No |
| Unrealistic values | Medium | "aggregateRating": "10" (max 5) | Data quality flag | No |
| Inconsistent naming | Low | Org name differs across schemas | Entity confusion | No |
| Missing optional prop | Low | No "wordCount" on Article | Minor detail loss | No |

### 6.3 Validation Tools & Methods

**Automated Validation Tools:**

1. **Google Rich Results Test**
   - URL: https://search.google.com/test/rich-results
   - Validates against Google's requirements
   - Shows preview of rich results
   - Identifies errors and warnings

2. **Schema.org Validator**
   - URL: https://validator.schema.org/
   - Validates against schema.org spec
   - More comprehensive than Google's tool
   - Accepts URL or code input

3. **JSON-LD Playground**
   - URL: https://json-ld.org/playground/
   - Visualizes JSON-LD structure
   - Shows expanded/compacted forms
   - Helps debug complex schemas

4. **W3C Markup Validation Service**
   - Validates HTML containing schema
   - Checks overall page structure

**Programmatic Validation:**

```javascript
// Example validation logic
function validateSchema(schemaObj) {
  const errors = [];
  const warnings = [];

  // Check @context
  if (!schemaObj['@context']) {
    errors.push({
      type: 'MISSING_CONTEXT',
      severity: 'CRITICAL',
      message: 'Missing @context property'
    });
  }

  // Check @type
  if (!schemaObj['@type']) {
    errors.push({
      type: 'MISSING_TYPE',
      severity: 'CRITICAL',
      message: 'Missing @type property'
    });
  }

  // Type-specific validation
  if (schemaObj['@type'] === 'Article') {
    if (!schemaObj.headline) {
      errors.push({
        type: 'MISSING_REQUIRED_PROPERTY',
        property: 'headline',
        severity: 'CRITICAL',
        message: 'Article requires headline property'
      });
    }

    if (!schemaObj.dateModified) {
      warnings.push({
        type: 'MISSING_RECOMMENDED_PROPERTY',
        property: 'dateModified',
        severity: 'HIGH',
        message: 'Article should include dateModified for freshness signals'
      });
    }
  }

  return { errors, warnings };
}
```

---

## 7. Schema Quality Scoring Methodology

### 7.1 Overall Scoring Formula

**Total Score (0-100):**

```
Total Score = (Presence Score × 0.40) +
              (Completeness Score × 0.30) +
              (Quality Score × 0.20) +
              (Implementation Score × 0.10)
```

### 7.2 Presence Score (40 points)

**Calculation:** Based on which schema types are present relative to content type.

| Schema Type | Points if Present | Points if Missing |
|-------------|------------------|-------------------|
| Article/BlogPosting (content pages) | 15 | -15 |
| FAQPage (if Q&A content exists) | 12 | 0 |
| Organization (all sites) | 10 | -10 |
| Person (if author attribution) | 8 | 0 |
| Product (e-commerce) | 15 | 0 |
| BreadcrumbList | 5 | 0 |
| HowTo (if instructional) | 8 | 0 |
| VideoObject (if video) | 7 | 0 |

**Example:**
- Blog post with Article (15), Organization (10), Person (8), BreadcrumbList (5) = **38/40 points**
- Blog post with only Article (15), Organization (10) = **25/40 points**
- Blog post with no schema = **0/40 points**

### 7.3 Completeness Score (30 points)

**Calculation:** Percentage of required + recommended properties present for each schema type.

**Formula per Schema Type:**
```
Schema Completeness = (Required Properties Present / Total Required) × 0.60 +
                      (Recommended Properties Present / Total Recommended) × 0.40
```

**Article Example:**

**Required Properties (60% weight):**
- `headline` (required) ✅
- `author` (required) ✅
- `datePublished` (required) ✅
- `publisher` (required) ✅
- **Required Score:** 4/4 = 100%

**Recommended Properties (40% weight):**
- `dateModified` ✅
- `image` ✅
- `description` ✅
- `mainEntityOfPage` ❌
- `articleSection` ❌
- **Recommended Score:** 3/5 = 60%

**Total Completeness for Article:**
```
(1.00 × 0.60) + (0.60 × 0.40) = 0.60 + 0.24 = 0.84 (84%)
```

**If multiple schema types, average them:**
```
Overall Completeness = (Article: 84% + Organization: 90% + Person: 75%) / 3 = 83%
Completeness Score = 83% of 30 points = 24.9 points
```

### 7.4 Quality Score (20 points)

**Evaluation Criteria:**

| Quality Dimension | Max Points | Evaluation |
|------------------|------------|------------|
| Property Value Quality | 8 | Are values realistic, appropriate length, accurate? |
| Consistency | 5 | Do values match visible page content? |
| Entity Relationships | 4 | Are entities properly linked with @id? |
| Freshness | 3 | Are dates recent and maintained? |

**Property Value Quality (8 points):**
- Headlines between 20-110 chars: +2
- Descriptions between 50-160 chars: +2
- Valid, accessible image URLs: +2
- Realistic rating values (0-5 scale): +2

**Consistency (5 points):**
- Author name matches visible byline: +2
- Dates match visible dates: +2
- Prices match visible prices: +1

**Entity Relationships (4 points):**
- Organization defined with @id and referenced: +2
- Person/author defined with @id and referenced: +2

**Freshness (3 points):**
- dateModified within last 12 months: +2
- datePublished realistic (not too old): +1

### 7.5 Implementation Score (10 points)

**Technical Implementation Quality:**

| Factor | Points | Criteria |
|--------|--------|----------|
| Format | 3 | JSON-LD in <head> or <body> |
| Valid JSON syntax | 3 | No syntax errors |
| Placement | 2 | In initial HTML (not JS-loaded) |
| Multiple schemas | 2 | Using @graph or multiple <script> tags properly |

### 7.6 Scoring Examples

**Example 1: Excellent Implementation**

**Page:** Blog article about AI crawlers

**Schema Present:**
- Article (complete with all required + 4/5 recommended)
- Person (author with credentials and sameAs)
- Organization (publisher with logo and sameAs)
- BreadcrumbList

**Scores:**
- **Presence:** 38/40 (Article 15, Organization 10, Person 8, Breadcrumb 5)
- **Completeness:** 28/30 (Article 95%, Organization 90%, Person 90%, Breadcrumb 100% → avg 94%)
- **Quality:** 18/20 (All criteria met, high quality values)
- **Implementation:** 10/10 (Perfect JSON-LD, proper placement)

**Total:** 94/100 (**Grade: A+**)

---

**Example 2: Good Implementation**

**Page:** Product page

**Schema Present:**
- Product (with required properties, missing some recommended)
- Organization (basic implementation)

**Scores:**
- **Presence:** 25/40 (Product 15, Organization 10)
- **Completeness:** 21/30 (Product 70%, Organization 75% → avg 72.5%)
- **Quality:** 14/20 (Good values, but missing aggregateRating)
- **Implementation:** 9/10 (Minor syntax issue)

**Total:** 69/100 (**Grade: C+**)

---

**Example 3: Poor Implementation**

**Page:** Article with minimal schema

**Schema Present:**
- Article (headline and author only, missing publisher)

**Scores:**
- **Presence:** 15/40 (Only Article, missing Organization, Person)
- **Completeness:** 12/30 (Article 50% required, 0% recommended)
- **Quality:** 8/20 (Poor value quality, no dates)
- **Implementation:** 7/10 (Valid JSON but missing placement optimization)

**Total:** 42/100 (**Grade: F**)

### 7.7 Grading Scale

| Score Range | Grade | Status | Recommendation |
|------------|-------|--------|----------------|
| 90-100 | A+ | Excellent | Minor optimizations only |
| 80-89 | A | Very Good | Add recommended properties |
| 70-79 | B | Good | Add missing schema types |
| 60-69 | C | Fair | Significant improvements needed |
| 50-59 | D | Poor | Major restructuring required |
| 0-49 | F | Critical | Start from scratch |

---

## 8. Common Schema Errors & Fix Recommendations

### 8.1 Critical Errors

#### **Error 1: Missing @context**

**Detection:**
```json
{
  "@type": "Article",
  "headline": "Title"
  // Missing "@context": "https://schema.org"
}
```

**Impact:** AI crawlers cannot parse schema. Complete failure.

**Fix:**
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Title"
}
```

**Recommendation Message:**
> **CRITICAL ERROR:** Missing @context property. Add `"@context": "https://schema.org"` as the first property in your schema markup. Without this, AI crawlers cannot interpret your structured data.

---

#### **Error 2: Missing Required Properties**

**Detection (Article example):**
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Title"
  // Missing: author, datePublished, publisher
}
```

**Impact:** Incomplete entity definition. AI cannot extract key facts.

**Fix:**
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Title",
  "author": {
    "@type": "Person",
    "name": "John Smith"
  },
  "datePublished": "2025-10-25T10:00:00+00:00",
  "publisher": {
    "@type": "Organization",
    "name": "Publisher Name",
    "logo": {
      "@type": "ImageObject",
      "url": "https://example.com/logo.png"
    }
  }
}
```

**Recommendation Message:**
> **CRITICAL ERROR:** Article schema is missing required properties. Add the following:
> - `author` (Person or Organization object)
> - `datePublished` (ISO 8601 date format)
> - `publisher` (Organization object with logo)
>
> Without these properties, AI systems cannot properly understand or cite your content.

---

#### **Error 3: Invalid Date Format**

**Detection:**
```json
{
  "datePublished": "10/25/2025" // ❌ Wrong format
}
```

**Impact:** AI cannot parse date. Freshness signals fail.

**Fix:**
```json
{
  "datePublished": "2025-10-25T10:00:00+00:00" // ✅ ISO 8601
}
```

**Recommendation Message:**
> **ERROR:** Invalid date format detected. Use ISO 8601 format: `YYYY-MM-DDTHH:MM:SS+00:00`
>
> **Current:** `"10/25/2025"`
> **Should be:** `"2025-10-25T10:00:00+00:00"`
>
> Proper date formatting is critical for AI freshness evaluation.

---

#### **Error 4: Wrong Property Type**

**Detection:**
```json
{
  "author": "John Smith" // ❌ Should be object
}
```

**Impact:** AI cannot extract author credentials or establish entity relationship.

**Fix:**
```json
{
  "author": {
    "@type": "Person",
    "name": "John Smith",
    "url": "https://example.com/authors/john-smith",
    "sameAs": ["https://linkedin.com/in/johnsmith"]
  }
}
```

**Recommendation Message:**
> **ERROR:** `author` property should be a Person or Organization object, not a string.
>
> **Current:** `"author": "John Smith"`
> **Should be:**
> ```json
> "author": {
>   "@type": "Person",
>   "name": "John Smith",
>   "url": "https://example.com/authors/john-smith",
>   "sameAs": ["https://linkedin.com/in/johnsmith"]
> }
> ```
>
> Properly structured author entities improve E-E-A-T signals for AI systems.

---

#### **Error 5: Relative URLs**

**Detection:**
```json
{
  "url": "/page", // ❌ Relative URL
  "image": "/images/photo.jpg" // ❌ Relative URL
}
```

**Impact:** AI cannot access resources. URLs must be absolute.

**Fix:**
```json
{
  "url": "https://example.com/page", // ✅ Absolute URL
  "image": "https://example.com/images/photo.jpg" // ✅ Absolute URL
}
```

**Recommendation Message:**
> **ERROR:** Relative URLs detected. All URLs in schema must be absolute (include full domain).
>
> **Fix these URLs:**
> - `url`: Change `"/page"` to `"https://example.com/page"`
> - `image`: Change `"/images/photo.jpg"` to `"https://example.com/images/photo.jpg"`
>
> AI crawlers require absolute URLs to access resources.

---

### 8.2 High-Impact Warnings

#### **Warning 1: Missing dateModified**

**Detection:**
```json
{
  "@type": "Article",
  "datePublished": "2025-01-15T10:00:00+00:00"
  // Missing dateModified
}
```

**Impact:** Reduced freshness signal for AI ranking.

**Fix:**
```json
{
  "@type": "Article",
  "datePublished": "2025-01-15T10:00:00+00:00",
  "dateModified": "2025-10-25T15:30:00+00:00"
}
```

**Recommendation Message:**
> **HIGH PRIORITY:** Add `dateModified` property to signal content freshness. AI systems prioritize recently updated content.
>
> ```json
> "dateModified": "2025-10-25T15:30:00+00:00"
> ```
>
> **Expected Impact:** +15-25% boost in AI ranking for freshness-sensitive queries.

---

#### **Warning 2: Missing Author Credentials**

**Detection:**
```json
{
  "author": {
    "@type": "Person",
    "name": "John Smith"
    // Missing: url, sameAs, jobTitle, affiliation
  }
}
```

**Impact:** Weak E-E-A-T signals. Reduced authority.

**Fix:**
```json
{
  "author": {
    "@type": "Person",
    "name": "John Smith",
    "url": "https://example.com/authors/john-smith",
    "jobTitle": "Senior AI Engineer",
    "affiliation": {
      "@type": "Organization",
      "name": "Tech Company"
    },
    "sameAs": [
      "https://linkedin.com/in/johnsmith",
      "https://scholar.google.com/citations?user=abc123"
    ]
  }
}
```

**Recommendation Message:**
> **HIGH PRIORITY:** Enhance author schema with credentials to improve E-E-A-T signals.
>
> **Add these properties:**
> - `jobTitle`: Author's professional role
> - `affiliation`: Organization they work for
> - `sameAs`: Links to LinkedIn, Google Scholar, or other professional profiles
> - `url`: Link to author bio page
>
> **Expected Impact:** +30-40% improvement in AI citation rate for expertise-dependent topics.

---

#### **Warning 3: Missing Organization Logo**

**Detection:**
```json
{
  "publisher": {
    "@type": "Organization",
    "name": "Publisher"
    // Missing logo
  }
}
```

**Impact:** Cannot display in rich results. Reduced brand recognition.

**Fix:**
```json
{
  "publisher": {
    "@type": "Organization",
    "name": "Publisher",
    "logo": {
      "@type": "ImageObject",
      "url": "https://example.com/logo.png",
      "width": 600,
      "height": 60
    }
  }
}
```

**Recommendation Message:**
> **RECOMMENDED:** Add logo to Organization schema for brand visibility.
>
> **Requirements:**
> - Minimum dimensions: 112x112px
> - Maximum width: 1200px
> - Format: PNG, JPG, or SVG
> - Transparent background recommended
>
> **Expected Impact:** Improved brand recognition in AI citations.

---

### 8.3 Optimization Suggestions

#### **Suggestion 1: Add FAQPage Schema**

**Detection:** Page contains Q&A content but no FAQPage schema.

**Recommendation Message:**
> **OPTIMIZATION OPPORTUNITY:** Your page contains question-answer content. Add FAQPage schema to increase AI citation probability by up to 52%.
>
> **Implementation:**
> ```json
> {
>   "@context": "https://schema.org",
>   "@type": "FAQPage",
>   "mainEntity": [
>     {
>       "@type": "Question",
>       "name": "Your question here?",
>       "acceptedAnswer": {
>         "@type": "Answer",
>         "text": "Your complete answer here."
>       }
>     }
>   ]
> }
> ```

---

#### **Suggestion 2: Add BreadcrumbList**

**Detection:** Site has navigation hierarchy but no BreadcrumbList schema.

**Recommendation Message:**
> **OPTIMIZATION:** Add BreadcrumbList schema to help AI understand your site structure.
>
> **Expected Impact:** +20% improvement in content relationship understanding.

---

#### **Suggestion 3: Add aggregateRating to Product**

**Detection:** Product schema without rating/review data.

**Recommendation Message:**
> **OPTIMIZATION:** Add `aggregateRating` to Product schema for 27% higher inclusion in AI shopping comparisons.
>
> ```json
> "aggregateRating": {
>   "@type": "AggregateRating",
>   "ratingValue": "4.8",
>   "bestRating": "5",
>   "reviewCount": "127"
> }
> ```

---

## 9. Schema Markup Patterns: Best Practices

### 9.1 Multi-Schema Page Pattern

**Use @graph for Multiple Schemas:**

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://example.com/#organization",
      "name": "CrawlReady",
      "url": "https://example.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://example.com/logo.png"
      },
      "sameAs": [
        "https://twitter.com/crawlready",
        "https://linkedin.com/company/crawlready"
      ]
    },
    {
      "@type": "Person",
      "@id": "https://example.com/authors/sarah-johnson#person",
      "name": "Dr. Sarah Johnson",
      "jobTitle": "Senior AI Engineer",
      "affiliation": {
        "@id": "https://example.com/#organization"
      },
      "sameAs": [
        "https://linkedin.com/in/sarahjohnson",
        "https://scholar.google.com/citations?user=abc123"
      ]
    },
    {
      "@type": "Article",
      "headline": "AI Crawler Optimization Guide",
      "author": {
        "@id": "https://example.com/authors/sarah-johnson#person"
      },
      "publisher": {
        "@id": "https://example.com/#organization"
      },
      "datePublished": "2025-10-25T10:00:00+00:00",
      "dateModified": "2025-10-25T15:30:00+00:00",
      "image": "https://example.com/images/article-cover.jpg",
      "description": "Complete guide to optimizing for AI crawlers."
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://example.com"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Guides",
          "item": "https://example.com/guides"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "AI Crawlers",
          "item": "https://example.com/guides/ai-crawlers"
        }
      ]
    }
  ]
}
```

**Benefits:**
- Defines entities once, references via @id
- Maintains consistency
- Builds entity relationships
- Cleaner code organization

---

### 9.2 E-commerce Product Pattern

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Premium AI Optimization Service",
  "description": "Complete AI crawler optimization for JavaScript websites",
  "image": [
    "https://example.com/images/product-1.jpg",
    "https://example.com/images/product-2.jpg",
    "https://example.com/images/product-3.jpg"
  ],
  "brand": {
    "@type": "Brand",
    "name": "CrawlReady"
  },
  "sku": "CRAWL-PREM-001",
  "mpn": "CR-2025-PREM",
  "offers": {
    "@type": "Offer",
    "price": "999.00",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock",
    "url": "https://example.com/products/premium-service",
    "priceValidUntil": "2025-12-31",
    "seller": {
      "@type": "Organization",
      "name": "CrawlReady Inc."
    },
    "shippingDetails": {
      "@type": "OfferShippingDetails",
      "shippingRate": {
        "@type": "MonetaryAmount",
        "value": "0",
        "currency": "USD"
      },
      "shippingDestination": {
        "@type": "DefinedRegion",
        "addressCountry": "US"
      }
    }
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "bestRating": "5",
    "worstRating": "1",
    "ratingCount": "256",
    "reviewCount": "189"
  },
  "review": [
    {
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": "Michael Chen"
      },
      "datePublished": "2025-10-15",
      "reviewBody": "Outstanding service. GPTBot citations increased 420% in 45 days.",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": "5",
        "bestRating": "5"
      }
    }
  ],
  "category": "Software > SEO Tools > AI Optimization"
}
```

---

### 9.3 Article + FAQPage Combination Pattern

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "headline": "Complete AI Crawler Guide with FAQ",
      "author": {
        "@type": "Person",
        "name": "Jane Developer"
      },
      "datePublished": "2025-10-25T10:00:00+00:00",
      "publisher": {
        "@type": "Organization",
        "name": "Tech Blog"
      }
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What are AI crawlers?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "AI crawlers are automated bots used by AI systems like ChatGPT, Claude, and Perplexity to discover and index web content for use in AI-generated responses."
          }
        },
        {
          "@type": "Question",
          "name": "Do AI crawlers execute JavaScript?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "No, most AI crawlers (GPTBot, ClaudeBot, PerplexityBot) do not execute JavaScript. Only 31% support JavaScript rendering."
          }
        }
      ]
    }
  ]
}
```

---

## 10. Static Analysis Implementation Guide

### 10.1 Detection Algorithm

**Step 1: Extract Schema Blocks**

```javascript
function extractSchemaBlocks(html) {
  const schemas = [];
  const scriptRegex = /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      const schemaText = match[1];
      const schemaObj = JSON.parse(schemaText);
      schemas.push({
        raw: schemaText,
        parsed: schemaObj,
        position: match.index
      });
    } catch (e) {
      schemas.push({
        raw: match[1],
        parsed: null,
        error: 'JSON_PARSE_ERROR',
        position: match.index
      });
    }
  }

  return schemas;
}
```

**Step 2: Validate Each Schema**

```javascript
function validateSchema(schemaObj) {
  const results = {
    errors: [],
    warnings: [],
    suggestions: [],
    score: 0
  };

  // Check for @context
  if (!schemaObj['@context']) {
    results.errors.push({
      code: 'MISSING_CONTEXT',
      severity: 'CRITICAL',
      message: 'Missing @context property',
      fix: 'Add "@context": "https://schema.org"'
    });
  }

  // Check for @type
  if (!schemaObj['@type'] && !schemaObj['@graph']) {
    results.errors.push({
      code: 'MISSING_TYPE',
      severity: 'CRITICAL',
      message: 'Missing @type property',
      fix: 'Add "@type" property (e.g., "Article", "Product", "Organization")'
    });
  }

  // Type-specific validation
  const type = schemaObj['@type'];

  if (type === 'Article' || type === 'NewsArticle' || type === 'BlogPosting') {
    validateArticle(schemaObj, results);
  } else if (type === 'Product') {
    validateProduct(schemaObj, results);
  } else if (type === 'FAQPage') {
    validateFAQPage(schemaObj, results);
  }
  // ... other types

  return results;
}
```

**Step 3: Type-Specific Validators**

```javascript
function validateArticle(schema, results) {
  // Required properties
  const required = ['headline', 'author', 'datePublished', 'publisher'];

  required.forEach((prop) => {
    if (!schema[prop]) {
      results.errors.push({
        code: 'MISSING_REQUIRED_PROPERTY',
        property: prop,
        severity: 'CRITICAL',
        message: `Article requires ${prop} property`,
        fix: getPropertyExample('Article', prop)
      });
    }
  });

  // Recommended properties
  const recommended = ['dateModified', 'image', 'description', 'mainEntityOfPage'];

  recommended.forEach((prop) => {
    if (!schema[prop]) {
      results.warnings.push({
        code: 'MISSING_RECOMMENDED_PROPERTY',
        property: prop,
        severity: 'HIGH',
        message: `Article should include ${prop}`,
        impact: getPropertyImpact('Article', prop),
        fix: getPropertyExample('Article', prop)
      });
    }
  });

  // Quality checks
  if (schema.headline && schema.headline.length > 110) {
    results.warnings.push({
      code: 'HEADLINE_TOO_LONG',
      severity: 'MEDIUM',
      message: `Headline exceeds 110 characters (${schema.headline.length})`,
      fix: 'Shorten headline to 110 characters or less'
    });
  }

  // Date validation
  if (schema.datePublished) {
    const publishDate = new Date(schema.datePublished);
    if (isNaN(publishDate.getTime())) {
      results.errors.push({
        code: 'INVALID_DATE_FORMAT',
        property: 'datePublished',
        severity: 'HIGH',
        message: 'Invalid datePublished format',
        fix: 'Use ISO 8601 format: YYYY-MM-DDTHH:MM:SS+00:00'
      });
    }
  }

  // Author validation
  if (schema.author) {
    if (typeof schema.author === 'string') {
      results.errors.push({
        code: 'WRONG_PROPERTY_TYPE',
        property: 'author',
        severity: 'CRITICAL',
        message: 'author should be Person or Organization object, not string',
        fix: getPropertyExample('Article', 'author')
      });
    } else if (schema.author['@type'] === 'Person') {
      // Check for author credentials
      if (!schema.author.sameAs || schema.author.sameAs.length === 0) {
        results.warnings.push({
          code: 'MISSING_AUTHOR_CREDENTIALS',
          severity: 'HIGH',
          message: 'Author missing sameAs links (LinkedIn, Google Scholar, etc.)',
          impact: '+30-40% improvement in AI citation rate',
          fix: getPropertyExample('Person', 'sameAs')
        });
      }
    }
  }
}
```

**Step 4: Calculate Scores**

```javascript
function calculateScore(schemas, results) {
  let presenceScore = 0;
  const completenessScore = 0;
  const qualityScore = 0;
  let implementationScore = 0;

  // Presence Score (40 points)
  const schemaTypes = schemas.map(s => s.parsed?.['@type']).filter(Boolean);

  if (schemaTypes.includes('Article') || schemaTypes.includes('BlogPosting')) {
    presenceScore += 15;
  }
  if (schemaTypes.includes('Organization')) {
    presenceScore += 10;
  }
  if (schemaTypes.includes('Person')) {
    presenceScore += 8;
  }
  if (schemaTypes.includes('FAQPage')) {
    presenceScore += 12;
  }
  if (schemaTypes.includes('BreadcrumbList')) {
    presenceScore += 5;
  }

  // Completeness Score (30 points)
  // Calculate based on required/recommended properties present

  // Quality Score (20 points)
  // Deduct for errors and warnings

  // Implementation Score (10 points)
  if (schemas.length > 0 && schemas[0].parsed) {
    implementationScore += 3; // Valid JSON
  }

  const totalScore = presenceScore + completenessScore + qualityScore + implementationScore;

  return {
    total: Math.round(totalScore),
    breakdown: {
      presence: presenceScore,
      completeness: completenessScore,
      quality: qualityScore,
      implementation: implementationScore
    },
    grade: getGrade(totalScore)
  };
}

function getGrade(score) {
  if (score >= 90) {
    return 'A+';
  }
  if (score >= 80) {
    return 'A';
  }
  if (score >= 70) {
    return 'B';
  }
  if (score >= 60) {
    return 'C';
  }
  if (score >= 50) {
    return 'D';
  }
  return 'F';
}
```

### 10.2 Recommendation Generator

```javascript
function generateRecommendations(results) {
  const recommendations = [];

  // Critical errors first
  results.errors
    .filter(e => e.severity === 'CRITICAL')
    .forEach((error) => {
      recommendations.push({
        priority: 'CRITICAL',
        title: error.message,
        description: `This error prevents AI crawlers from parsing your schema.`,
        fix: error.fix,
        impact: 'Complete failure - schema will be ignored',
        effort: 'Low',
        category: 'Errors'
      });
    });

  // High-impact warnings
  results.warnings
    .filter(w => w.severity === 'HIGH')
    .forEach((warning) => {
      recommendations.push({
        priority: 'HIGH',
        title: warning.message,
        description: warning.impact || 'Reduces AI crawler effectiveness',
        fix: warning.fix,
        impact: warning.impact || 'Moderate',
        effort: 'Low to Medium',
        category: 'Optimizations'
      });
    });

  // Suggestions
  results.suggestions.forEach((suggestion) => {
    recommendations.push({
      priority: 'MEDIUM',
      title: suggestion.message,
      description: suggestion.description,
      fix: suggestion.fix,
      impact: suggestion.impact,
      effort: 'Medium',
      category: 'Enhancements'
    });
  });

  return recommendations;
}
```

### 10.3 Output Format

```json
{
  "score": {
    "total": 84,
    "grade": "A",
    "breakdown": {
      "presence": 33,
      "completeness": 27,
      "quality": 16,
      "implementation": 8
    }
  },
  "schemas": [
    {
      "type": "Article",
      "status": "valid",
      "completeness": 85,
      "requiredPropertiesPresent": ["headline", "author", "datePublished", "publisher"],
      "requiredPropertiesMissing": [],
      "recommendedPropertiesPresent": ["dateModified", "image", "description"],
      "recommendedPropertiesMissing": ["mainEntityOfPage", "articleSection"]
    }
  ],
  "errors": [
    {
      "code": "WRONG_PROPERTY_TYPE",
      "severity": "CRITICAL",
      "property": "author",
      "message": "author should be Person object, not string",
      "fix": "Change author to: {\"@type\": \"Person\", \"name\": \"Author Name\"}"
    }
  ],
  "warnings": [
    {
      "code": "MISSING_RECOMMENDED_PROPERTY",
      "severity": "HIGH",
      "property": "dateModified",
      "message": "Article missing dateModified property",
      "impact": "+15-25% boost in freshness ranking",
      "fix": "Add: \"dateModified\": \"2025-10-25T15:30:00+00:00\""
    }
  ],
  "recommendations": [
    {
      "priority": "CRITICAL",
      "title": "Fix author property type",
      "description": "Author must be a Person or Organization object for AI to extract credentials.",
      "fix": "Change \"author\": \"John Smith\" to {\"@type\": \"Person\", \"name\": \"John Smith\", \"sameAs\": [\"https://linkedin.com/in/johnsmith\"]}",
      "impact": "Complete failure - AI cannot extract author information",
      "effort": "Low"
    },
    {
      "priority": "HIGH",
      "title": "Add dateModified for freshness signals",
      "description": "AI systems prioritize recently updated content for ranking.",
      "fix": "Add \"dateModified\": \"2025-10-25T15:30:00+00:00\"",
      "impact": "+15-25% boost in AI ranking for freshness-sensitive queries",
      "effort": "Low"
    }
  ]
}
```

---

## Conclusion

This technical specification provides a complete framework for the **CrawlReady AI Crawler Checker - Schema Markup Module**. The tool can:

1. **Detect** schema markup in static HTML
2. **Validate** against schema.org requirements
3. **Score** implementation quality (0-100 scale)
4. **Identify** errors, warnings, and optimization opportunities
5. **Recommend** specific fixes with impact estimates
6. **Prioritize** improvements by criticality and ROI

**Key Scoring Weights:**
- **Presence (40%):** Which schema types are implemented
- **Completeness (30%):** Required and recommended properties
- **Quality (20%):** Value accuracy and entity relationships
- **Implementation (10%):** Technical correctness

**Priority Schema Types for AI:**
1. Article/BlogPosting (Tier 1 - Critical)
2. FAQPage (Tier 1 - Critical)
3. Organization (Tier 1 - Critical)
4. Person (Tier 1 - Critical)
5. Product (Tier 1 - Critical for e-commerce)

By following this specification, the tool will provide actionable, precise recommendations that directly improve AI crawler comprehension and citation rates.

---

**Document Version:** 2.0
**Schema Markup Focus**
**Last Updated:** October 25, 2025
**Research Sources:** W3C, Schema.org, Google Documentation, Microsoft Bing, Anthropic, OpenAI, industry studies (2025)
