# CrawlReady: Integration Guide

**Version**: 1.0  
**Date**: December 28, 2024  
**Status**: Draft - Pending Approval  
**Dependencies**: Functional Specification v1.0

---

## 1. Overview

### 1.1 Purpose

This guide provides step-by-step instructions for integrating CrawlReady pre-rendering proxy into your website, including:
- Bot detection patterns
- API integration code examples
- Framework-specific implementations (Next.js, Express, Rails, etc.)
- Testing and troubleshooting
- Best practices

### 1.2 Prerequisites

Before integrating CrawlReady, you need:
- ✅ API key from CrawlReady (contact admin or sign up at crawlready.com)
- ✅ Node.js 18+ (for JavaScript/TypeScript examples)
- ✅ Basic understanding of server-side middleware
- ✅ HTTPS-enabled production site (required for AI bots to crawl)

---

## 2. Quick Start (5 Minutes)

### 2.1 Get Your API Key

1. Sign up at `https://crawlready.com` or contact admin
2. Receive API key via email (format: `sk_live_...` or `sk_test_...`)
3. Store securely in environment variables:

```bash
# .env.local (Next.js)
CRAWLREADY_API_KEY=sk_live_abc123...

# .env (Express)
CRAWLREADY_API_KEY=sk_live_abc123...
```

**⚠️ Security**: Never commit API keys to version control. Use `.gitignore` for `.env` files.

---

### 2.2 Test API Access

```bash
curl -X POST https://api.crawlready.com/api/render \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-site.com/test-page"
  }'
```

**Expected Response** (first request):
```json
{
  "status": "queued",
  "jobId": "01HQTX5K3G7YZ8VWXR9NQM2PF4",
  "statusUrl": "/api/status/01HQTX5K3G7YZ8VWXR9NQM2PF4",
  "estimatedTime": 5000
}
```

Wait 5-10 seconds, then make the same request again.

**Expected Response** (cached):
```html
<!DOCTYPE html>
<html>
  <head>...</head>
  <body>Your pre-rendered content</body>
</html>
```

✅ If you see HTML, integration is working!

---

## 3. Bot Detection

### 3.1 AI Bot User-Agent Patterns

CrawlReady is optimized for AI crawler bots. Detect them using these patterns:

```typescript
const AI_BOT_PATTERNS = [
  // OpenAI (ChatGPT)
  /GPTBot/i,
  /ChatGPT-User/i,
  /OAI-SearchBot/i,
  
  // Anthropic (Claude)
  /ClaudeBot/i,
  /Claude-Web/i,
  /anthropic-ai/i,
  
  // Perplexity
  /PerplexityBot/i,
  
  // Google (Gemini, Bard)
  /Google-Extended/i,
  /Gemini-Bot/i,
  /Bard/i,
  
  // Meta
  /Meta-ExternalAgent/i,
  /FacebookBot/i,
  
  // Other AI crawlers
  /Applebot-Extended/i,
  /Bytespider/i, // TikTok/ByteDance
  /CCBot/i, // Common Crawl
];

export function isAIBot(userAgent: string): boolean {
  if (!userAgent) return false;
  return AI_BOT_PATTERNS.some(pattern => pattern.test(userAgent));
}
```

**Test User-Agents**:
```typescript
console.log(isAIBot('Mozilla/5.0 (compatible; GPTBot/1.0; +https://openai.com/gptbot)'));
// true

console.log(isAIBot('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'));
// false
```

---

### 3.2 Testing Bot Detection Locally

Use browser dev tools to spoof user-agent:

**Chrome DevTools**:
1. Open DevTools (F12)
2. Click three dots → More tools → Network conditions
3. Uncheck "Use browser default"
4. Set custom user-agent: `Mozilla/5.0 (compatible; GPTBot/1.0; +https://openai.com/gptbot)`
5. Reload page

**cURL**:
```bash
curl -H "User-Agent: Mozilla/5.0 (compatible; GPTBot/1.0)" \
  https://your-site.com/test-page
```

---

## 4. Framework Integration

### 4.1 Next.js (App Router)

#### Implementation: Middleware

**File**: `middleware.ts` (project root)

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AI_BOT_PATTERNS = [
  /GPTBot/i,
  /ChatGPT-User/i,
  /ClaudeBot/i,
  /PerplexityBot/i,
  /Google-Extended/i,
];

function isAIBot(userAgent: string): boolean {
  return AI_BOT_PATTERNS.some(pattern => pattern.test(userAgent));
}

export async function middleware(req: NextRequest) {
  const userAgent = req.headers.get('user-agent') || '';
  
  // Only intercept AI bot traffic
  if (!isAIBot(userAgent)) {
    return NextResponse.next();
  }
  
  console.log(`[CrawlReady] AI bot detected: ${userAgent}`);
  
  const url = req.nextUrl.toString();
  
  try {
    // Request pre-rendered HTML from CrawlReady
    const response = await fetch('https://api.crawlready.com/api/render', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CRAWLREADY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });
    
    const contentType = response.headers.get('content-type');
    
    // If cached HTML (200), serve to bot
    if (response.ok && contentType?.includes('text/html')) {
      const html = await response.text();
      
      return new NextResponse(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'X-Served-By': 'CrawlReady',
          'X-Cache': response.headers.get('X-Cache') || 'UNKNOWN',
        },
      });
    }
    
    // If 202 (queued), let request through to origin
    // Bot will see normal page, but next request will be cached
    if (response.status === 202) {
      console.log('[CrawlReady] Render queued, serving origin');
      return NextResponse.next();
    }
    
    // If error, fall back to origin
    console.error('[CrawlReady] Error:', response.status, await response.text());
    return NextResponse.next();
    
  } catch (error) {
    console.error('[CrawlReady] Request failed:', error);
    // Always fall back to origin on error
    return NextResponse.next();
  }
}

// Configure which routes to intercept
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public assets (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
  ],
};
```

**Environment Variables** (`.env.local`):
```bash
CRAWLREADY_API_KEY=sk_live_your_actual_key_here
```

**Test**:
```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Test with AI bot user-agent
curl -H "User-Agent: GPTBot/1.0" http://localhost:3000/
```

---

#### Advanced: Parallel Rendering

For performance, fetch CrawlReady in parallel with your page render:

```typescript
export async function middleware(req: NextRequest) {
  const userAgent = req.headers.get('user-agent') || '';
  
  if (isAIBot(userAgent)) {
    const url = req.nextUrl.toString();
    
    // Start CrawlReady request (don't await)
    const crawlReadyPromise = fetch('https://api.crawlready.com/api/render', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CRAWLREADY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });
    
    // Race: CrawlReady vs origin render (whichever completes first)
    const winner = await Promise.race([
      crawlReadyPromise.then(async (res) => ({
        source: 'crawlready',
        html: res.ok ? await res.text() : null,
        headers: res.headers,
      })),
      
      // Timeout after 200ms, use origin
      new Promise<{ source: 'timeout' }>((resolve) => 
        setTimeout(() => resolve({ source: 'timeout' }), 200)
      ),
    ]);
    
    if (winner.source === 'crawlready' && winner.html) {
      return new NextResponse(winner.html, {
        headers: { 'Content-Type': 'text/html', 'X-Served-By': 'CrawlReady' }
      });
    }
  }
  
  return NextResponse.next();
}
```

---

### 4.2 Next.js (Pages Router)

**File**: `pages/_middleware.ts` (or `middleware.ts` in root)

Same implementation as App Router above.

**Alternative**: API Route

If middleware doesn't work (e.g., Vercel Edge limitations), use API route:

**File**: `pages/api/bot-proxy.ts`

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { url } = req.query;
  
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing url parameter' });
  }
  
  const response = await fetch('https://api.crawlready.com/api/render', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.CRAWLREADY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });
  
  if (response.ok && response.headers.get('content-type')?.includes('text/html')) {
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(await response.text());
  } else {
    res.status(response.status).json(await response.json());
  }
}
```

**Usage**:
```typescript
// In middleware
if (isAIBot(userAgent)) {
  const proxyUrl = `/api/bot-proxy?url=${encodeURIComponent(req.url)}`;
  return NextResponse.rewrite(new URL(proxyUrl, req.url));
}
```

---

### 4.3 Express.js

**File**: `middleware/crawlready.js`

```javascript
const fetch = require('node-fetch'); // or use native fetch in Node 18+

const AI_BOT_PATTERNS = [
  /GPTBot/i,
  /ChatGPT-User/i,
  /ClaudeBot/i,
  /PerplexityBot/i,
  /Google-Extended/i,
];

function isAIBot(userAgent) {
  return AI_BOT_PATTERNS.some(pattern => pattern.test(userAgent));
}

async function crawlReadyMiddleware(req, res, next) {
  const userAgent = req.get('user-agent') || '';
  
  if (!isAIBot(userAgent)) {
    return next();
  }
  
  const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  
  try {
    const response = await fetch('https://api.crawlready.com/api/render', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CRAWLREADY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });
    
    const contentType = response.headers.get('content-type');
    
    if (response.ok && contentType?.includes('text/html')) {
      const html = await response.text();
      res.set('Content-Type', 'text/html');
      res.set('X-Served-By', 'CrawlReady');
      return res.send(html);
    }
    
    // Fall through to origin on 202 or error
    next();
  } catch (error) {
    console.error('[CrawlReady] Error:', error);
    next();
  }
}

module.exports = { crawlReadyMiddleware, isAIBot };
```

**Usage** in `app.js`:

```javascript
const express = require('express');
const { crawlReadyMiddleware } = require('./middleware/crawlready');

const app = express();

// Apply CrawlReady middleware globally
app.use(crawlReadyMiddleware);

// Your routes
app.get('/', (req, res) => {
  res.send('<html><body>Hello World</body></html>');
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

**Test**:
```bash
USER_AGENT="Mozilla/5.0 (compatible; GPTBot/1.0)" \
CRAWLREADY_API_KEY="sk_live_..." \
node app.js

# In another terminal
curl -H "User-Agent: GPTBot/1.0" http://localhost:3000/
```

---

### 4.4 Ruby on Rails

**File**: `config/initializers/crawlready.rb`

```ruby
module CrawlReady
  AI_BOT_PATTERNS = [
    /GPTBot/i,
    /ChatGPT-User/i,
    /ClaudeBot/i,
    /PerplexityBot/i,
    /Google-Extended/i
  ].freeze

  def self.ai_bot?(user_agent)
    return false if user_agent.nil?
    AI_BOT_PATTERNS.any? { |pattern| pattern.match?(user_agent) }
  end
  
  def self.render_page(url)
    require 'net/http'
    require 'json'
    
    uri = URI('https://api.crawlready.com/api/render')
    request = Net::HTTP::Post.new(uri)
    request['Authorization'] = "Bearer #{ENV['CRAWLREADY_API_KEY']}"
    request['Content-Type'] = 'application/json'
    request.body = { url: url }.to_json
    
    response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
      http.request(request)
    end
    
    if response.code == '200' && response.content_type.include?('text/html')
      { html: response.body, cached: true }
    elsif response.code == '202'
      { html: nil, cached: false }
    else
      { html: nil, error: response.body }
    end
  rescue => e
    Rails.logger.error "[CrawlReady] Error: #{e.message}"
    { html: nil, error: e.message }
  end
end
```

**File**: `app/controllers/application_controller.rb`

```ruby
class ApplicationController < ActionController::Base
  before_action :serve_crawlready_if_bot
  
  private
  
  def serve_crawlready_if_bot
    return unless CrawlReady.ai_bot?(request.user_agent)
    
    url = request.original_url
    result = CrawlReady.render_page(url)
    
    if result[:html]
      render html: result[:html].html_safe, layout: false
    end
    # If no HTML, continue to normal controller action
  end
end
```

**Environment** (`.env`):
```bash
CRAWLREADY_API_KEY=sk_live_your_key_here
```

**Test**:
```bash
rails server

# In another terminal
curl -H "User-Agent: GPTBot/1.0" http://localhost:3000/
```

---

### 4.5 PHP (Laravel/Symfony/Vanilla)

**File**: `CrawlReadyMiddleware.php`

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CrawlReadyMiddleware
{
    private const AI_BOT_PATTERNS = [
        '/GPTBot/i',
        '/ChatGPT-User/i',
        '/ClaudeBot/i',
        '/PerplexityBot/i',
        '/Google-Extended/i',
    ];
    
    private function isAIBot(string $userAgent): bool
    {
        foreach (self::AI_BOT_PATTERNS as $pattern) {
            if (preg_match($pattern, $userAgent)) {
                return true;
            }
        }
        return false;
    }
    
    public function handle(Request $request, Closure $next)
    {
        $userAgent = $request->header('User-Agent', '');
        
        if (!$this->isAIBot($userAgent)) {
            return $next($request);
        }
        
        $url = $request->url();
        $apiKey = env('CRAWLREADY_API_KEY');
        
        $ch = curl_init('https://api.crawlready.com/api/render');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => [
                "Authorization: Bearer {$apiKey}",
                'Content-Type: application/json',
            ],
            CURLOPT_POSTFIELDS => json_encode(['url' => $url]),
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
        curl_close($ch);
        
        // If cached HTML, serve to bot
        if ($httpCode === 200 && str_contains($contentType, 'text/html')) {
            return response($response, 200)
                ->header('Content-Type', 'text/html')
                ->header('X-Served-By', 'CrawlReady');
        }
        
        // Fall through to normal response
        return $next($request);
    }
}
```

**Register Middleware** (Laravel):

**File**: `app/Http/Kernel.php`

```php
protected $middlewareGroups = [
    'web' => [
        // ... existing middleware
        \App\Http\Middleware\CrawlReadyMiddleware::class,
    ],
];
```

**Environment** (`.env`):
```bash
CRAWLREADY_API_KEY=sk_live_your_key_here
```

---

## 5. Advanced Patterns

### 5.1 Cache Warming (Bulk Pre-Render)

Pre-render important pages before AI bots visit:

```typescript
// scripts/warm-cache.ts
const IMPORTANT_PAGES = [
  'https://yoursite.com/',
  'https://yoursite.com/products',
  'https://yoursite.com/about',
  'https://yoursite.com/contact',
];

async function warmCache() {
  for (const url of IMPORTANT_PAGES) {
    console.log(`Warming cache for: ${url}`);
    
    const response = await fetch('https://api.crawlready.com/api/render', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CRAWLREADY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });
    
    if (response.status === 202) {
      const { jobId } = await response.json();
      console.log(`  Queued: ${jobId}`);
      
      // Poll until completed
      await pollJobStatus(jobId);
    } else if (response.ok) {
      console.log(`  Already cached`);
    } else {
      console.error(`  Error: ${response.status}`);
    }
  }
}

async function pollJobStatus(jobId: string) {
  while (true) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const response = await fetch(`https://api.crawlready.com/api/status/${jobId}`, {
      headers: { 'Authorization': `Bearer ${process.env.CRAWLREADY_API_KEY}` },
    });
    
    const job = await response.json();
    console.log(`  Status: ${job.status}`);
    
    if (job.status === 'completed' || job.status === 'failed') {
      break;
    }
  }
}

warmCache().catch(console.error);
```

**Run**:
```bash
npx tsx scripts/warm-cache.ts
```

**Schedule** (GitHub Actions):

```yaml
# .github/workflows/warm-cache.yml
name: Warm Cache
on:
  schedule:
    - cron: '0 0 * * 0' # Weekly on Sunday at midnight
  workflow_dispatch: # Manual trigger

jobs:
  warm:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm run warm-cache
        env:
          CRAWLREADY_API_KEY: ${{ secrets.CRAWLREADY_API_KEY }}
```

---

### 5.2 Cache Invalidation on Deploy

Purge cache when you deploy updates:

```typescript
// scripts/invalidate-cache.ts
const PAGES_TO_INVALIDATE = [
  'https://yoursite.com/',
  'https://yoursite.com/products',
];

async function invalidateCache() {
  for (const url of PAGES_TO_INVALIDATE) {
    console.log(`Invalidating: ${url}`);
    
    const response = await fetch(
      `https://api.crawlready.com/api/cache?url=${encodeURIComponent(url)}`,
      {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${process.env.CRAWLREADY_API_KEY}` },
      }
    );
    
    if (response.ok) {
      const { freedSpace } = await response.json();
      console.log(`  Freed ${freedSpace} bytes`);
    } else {
      console.error(`  Error: ${response.status}`);
    }
  }
}

invalidateCache().catch(console.error);
```

**Hook into Deployment**:

```json
// package.json
{
  "scripts": {
    "build": "next build && npm run invalidate-cache",
    "invalidate-cache": "tsx scripts/invalidate-cache.ts"
  }
}
```

---

### 5.3 Monitoring Integration

Track CrawlReady usage with analytics:

```typescript
// lib/crawlready-client.ts
import { track } from '@/lib/analytics'; // Your analytics tool

export async function renderWithCrawlReady(url: string) {
  const startTime = Date.now();
  
  const response = await fetch('https://api.crawlready.com/api/render', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.CRAWLREADY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });
  
  const duration = Date.now() - startTime;
  const cacheStatus = response.headers.get('X-Cache') || 'UNKNOWN';
  
  // Track metrics
  track('crawlready_request', {
    url,
    status: response.status,
    cacheStatus,
    duration,
    success: response.ok,
  });
  
  if (response.ok && response.headers.get('content-type')?.includes('text/html')) {
    return await response.text();
  }
  
  return null;
}
```

---

## 6. Testing & Debugging

### 6.1 Local Testing Checklist

✅ **Step 1**: Verify API key works
```bash
curl -X POST https://api.crawlready.com/api/render \
  -H "Authorization: Bearer $CRAWLREADY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

✅ **Step 2**: Test bot detection
```typescript
console.log(isAIBot('GPTBot/1.0')); // Should be true
console.log(isAIBot('Chrome/120.0.0')); // Should be false
```

✅ **Step 3**: Test middleware with spoofed user-agent
```bash
curl -H "User-Agent: GPTBot/1.0" http://localhost:3000/test-page
```

✅ **Step 4**: Verify HTML is pre-rendered (check X-Cache header)
```bash
curl -I -H "User-Agent: GPTBot/1.0" http://localhost:3000/test-page | grep X-Cache
```

✅ **Step 5**: Test cache invalidation
```bash
curl -X DELETE "https://api.crawlready.com/api/cache?url=https://your-site.com/test-page" \
  -H "Authorization: Bearer $CRAWLREADY_API_KEY"
```

---

### 6.2 Debugging Common Issues

#### Issue: "401 Unauthorized"

**Cause**: Invalid API key or missing Authorization header.

**Fix**:
1. Verify API key in environment variables: `echo $CRAWLREADY_API_KEY`
2. Check Authorization header format: `Bearer sk_live_...` (space after "Bearer")
3. Ensure API key is active (contact admin)

---

#### Issue: "429 Too Many Requests"

**Cause**: Rate limit exceeded (100 renders/day for free tier).

**Fix**:
1. Check daily usage: Contact admin or check dashboard
2. Upgrade to Pro tier (10,000 renders/day)
3. Implement caching: Don't call CrawlReady for already-cached pages

---

#### Issue: Middleware not intercepting bot traffic

**Cause**: User-agent detection pattern mismatch or middleware not applied.

**Debug**:
```typescript
export async function middleware(req: NextRequest) {
  const userAgent = req.headers.get('user-agent') || '';
  console.log('[DEBUG] User-Agent:', userAgent);
  console.log('[DEBUG] Is AI bot?', isAIBot(userAgent));
  
  // ... rest of middleware
}
```

**Fix**:
- Ensure `middleware.ts` is in project root (Next.js)
- Check matcher config (exclude static assets)
- Verify bot user-agent matches patterns

---

#### Issue: HTML is not pre-rendered (still seeing JavaScript framework)

**Cause**: CrawlReady not caching properly or middleware not serving cached HTML.

**Debug**:
1. Test API directly (bypass middleware):
```bash
curl https://api.crawlready.com/api/render \
  -H "Authorization: Bearer $CRAWLREADY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-site.com/test-page"}'
```

2. Check response:
- If 202: Wait 5-10 seconds, try again
- If 200 with HTML: Middleware issue (check middleware logs)
- If 400/500: Check URL is publicly accessible

---

#### Issue: "SSRF Protection" error

**Cause**: URL is blocked (private IP, localhost, metadata endpoint).

**Fix**:
- Ensure URL is public (not localhost, 10.x.x.x, 192.168.x.x)
- Test URL accessibility from external server: `curl https://your-site.com`
- Use HTTPS (recommended for production)

---

## 7. Best Practices

### 7.1 Performance

✅ **Cache Check Before Render**: Check `/api/cache/status` to avoid unnecessary renders
✅ **Async Rendering**: Use 202 responses (queue), don't block page load
✅ **Timeout Handling**: Set reasonable timeouts (5-10s max for API calls)
✅ **Fallback to Origin**: Always serve origin site if CrawlReady fails

---

### 7.2 Security

✅ **Environment Variables**: Never hard-code API keys
✅ **Rate Limiting**: Implement client-side rate limiting to avoid 429 errors
✅ **HTTPS Only**: AI bots require HTTPS, use it in production
✅ **Validate URLs**: Don't allow user input directly into CrawlReady URLs

---

### 7.3 SEO & UX

✅ **Regular Users First**: Only serve CrawlReady to AI bots, not regular users
✅ **Same Content**: Ensure pre-rendered HTML matches live site (no cloaking)
✅ **Fresh Content**: Invalidate cache after deployments
✅ **Monitor Cache Hit Rate**: Aim for >50% hit rate (check dashboard)

---

## 8. Troubleshooting Guide

| Symptom | Likely Cause | Solution |
|---------|--------------|----------|
| API returns 401 | Invalid API key | Check `CRAWLREADY_API_KEY` environment variable |
| API returns 429 | Rate limit exceeded | Upgrade plan or wait for reset |
| API returns 400 | Invalid URL | Check URL format, ensure public accessibility |
| API returns 202 every time | Page not rendering successfully | Check origin site, contact support |
| Middleware not firing | Matcher config issue | Review `config.matcher` in middleware.ts |
| Bot sees non-rendered HTML | Middleware not serving cached HTML | Add logging, verify cache status |
| Users see pre-rendered HTML | Bot detection too broad | Tighten user-agent patterns |

---

## 9. Support & Resources

### 9.1 Documentation

- **API Reference**: https://docs.crawlready.com/api
- **Bot Detection Guide**: https://docs.crawlready.com/bot-detection
- **Troubleshooting**: https://docs.crawlready.com/troubleshooting

### 9.2 Contact Support

- **Email**: support@crawlready.com
- **Response Time**: 24 hours (email), 2 hours (Pro tier), 1 hour (Enterprise)
- **Status Page**: https://status.crawlready.com

### 9.3 Community

- **GitHub Discussions**: https://github.com/crawlready/community
- **Discord**: https://discord.gg/crawlready
- **Twitter**: @crawlready

---

## 10. Change Log

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2024-12-28 | 1.0 | System | Initial integration guide |

---

**Document Status**: DRAFT - Pending stakeholder review

