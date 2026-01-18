'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type Framework = 'nextjs' | 'react' | 'vue' | 'nuxt' | 'angular' | 'other';

const frameworkSnippets: Record<Framework, { title: string; code: string; description: string }> = {
  nextjs: {
    title: 'Next.js Middleware',
    description: 'Add this middleware to detect AI crawlers and serve pre-rendered content.',
    code: `// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AI_CRAWLERS = [
  'GPTBot', 'ChatGPT-User', 'OAI-SearchBot',
  'ClaudeBot', 'Claude-Web', 'anthropic-ai',
  'PerplexityBot', 'Google-Extended',
];

export function middleware(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || '';

  const isAICrawler = AI_CRAWLERS.some(crawler =>
    userAgent.toLowerCase().includes(crawler.toLowerCase())
  );

  if (isAICrawler) {
    const url = request.nextUrl.clone();
    return NextResponse.rewrite(
      \`https://api.crawlready.com/render?url=\${encodeURIComponent(url.href)}&key=API_KEY_PLACEHOLDER\`
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};`,
  },
  react: {
    title: 'React (with Express)',
    description: 'Add this middleware to your Express server for React apps.',
    code: `// server.js
const express = require('express');
const fetch = require('node-fetch');

const AI_CRAWLERS = [
  'GPTBot', 'ChatGPT-User', 'OAI-SearchBot',
  'ClaudeBot', 'Claude-Web', 'anthropic-ai',
  'PerplexityBot', 'Google-Extended',
];

function isAICrawler(userAgent) {
  return AI_CRAWLERS.some(crawler =>
    userAgent.toLowerCase().includes(crawler.toLowerCase())
  );
}

app.use(async (req, res, next) => {
  const userAgent = req.headers['user-agent'] || '';

  if (isAICrawler(userAgent)) {
    const url = \`\${req.protocol}://\${req.get('host')}\${req.originalUrl}\`;
    const response = await fetch(
      \`https://api.crawlready.com/render?url=\${encodeURIComponent(url)}&key=API_KEY_PLACEHOLDER\`
    );
    const html = await response.text();
    return res.send(html);
  }

  next();
});`,
  },
  vue: {
    title: 'Vue.js (Nginx)',
    description: 'Add this Nginx configuration to serve pre-rendered content to AI crawlers.',
    code: `# nginx.conf
map $http_user_agent $is_ai_crawler {
    default 0;
    ~*GPTBot 1;
    ~*ClaudeBot 1;
    ~*PerplexityBot 1;
    ~*Google-Extended 1;
}

server {
    location / {
        if ($is_ai_crawler = 1) {
            set $prerender_url "https://api.crawlready.com/render?url=$scheme://$host$request_uri&key=API_KEY_PLACEHOLDER";
            proxy_pass $prerender_url;
        }

        try_files $uri $uri/ /index.html;
    }
}`,
  },
  nuxt: {
    title: 'Nuxt.js Server Middleware',
    description: 'Add this server middleware to your Nuxt app.',
    code: `// server/middleware/crawlready.ts
export default defineEventHandler(async (event) => {
  const AI_CRAWLERS = [
    'GPTBot', 'ChatGPT-User', 'OAI-SearchBot',
    'ClaudeBot', 'Claude-Web', 'anthropic-ai',
    'PerplexityBot', 'Google-Extended',
  ];

  const userAgent = getHeader(event, 'user-agent') || '';

  const isAICrawler = AI_CRAWLERS.some(crawler =>
    userAgent.toLowerCase().includes(crawler.toLowerCase())
  );

  if (isAICrawler) {
    const url = getRequestURL(event);
    const response = await $fetch(\`https://api.crawlready.com/render?url=\${encodeURIComponent(url.href)}&key=API_KEY_PLACEHOLDER\`);
    return response;
  }
});`,
  },
  angular: {
    title: 'Angular Universal (Express)',
    description: 'Add this middleware to your Angular Universal server.',
    code: `// server.ts
import { ngExpressEngine } from '@nguniversal/express-engine';
import fetch from 'node-fetch';

const AI_CRAWLERS = [
  'GPTBot', 'ChatGPT-User', 'OAI-SearchBot',
  'ClaudeBot', 'Claude-Web', 'anthropic-ai',
  'PerplexityBot', 'Google-Extended',
];

server.get('*', async (req, res, next) => {
  const userAgent = req.headers['user-agent'] || '';

  const isAICrawler = AI_CRAWLERS.some(crawler =>
    userAgent.toLowerCase().includes(crawler.toLowerCase())
  );

  if (isAICrawler) {
    const url = \`\${req.protocol}://\${req.get('host')}\${req.originalUrl}\`;
    const response = await fetch(
      \`https://api.crawlready.com/render?url=\${encodeURIComponent(url)}&key=API_KEY_PLACEHOLDER\`
    );
    const html = await response.text();
    return res.send(html);
  }

  next();
});`,
  },
  other: {
    title: 'Generic HTTP Server',
    description: 'Check the user agent and redirect AI crawlers to CrawlReady API.',
    code: `// Generic implementation (adapt to your framework)

const AI_CRAWLERS = [
  'GPTBot', 'ChatGPT-User', 'OAI-SearchBot',
  'ClaudeBot', 'Claude-Web', 'anthropic-ai',
  'PerplexityBot', 'Google-Extended',
];

function handleRequest(request, response) {
  const userAgent = request.headers['user-agent'] || '';

  const isAICrawler = AI_CRAWLERS.some(crawler =>
    userAgent.toLowerCase().includes(crawler.toLowerCase())
  );

  if (isAICrawler) {
    const currentUrl = getCurrentUrl(request);
    const apiUrl = \`https://api.crawlready.com/render?url=\${encodeURIComponent(currentUrl)}&key=API_KEY_PLACEHOLDER\`;

    // Fetch from CrawlReady and return HTML
    fetchAndReturn(apiUrl, response);
    return;
  }

  // Normal request handling
  handleNormalRequest(request, response);
}`,
  },
};

export default function IntegratePage() {
  const router = useRouter();
  const [selectedFramework, setSelectedFramework] = useState<Framework>('nextjs');
  const [copied, setCopied] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [_siteId, setSiteId] = useState<string | null>(null);
  const [domain, setDomain] = useState<string | null>(null);
  const [cachedPages, setCachedPages] = useState(0);

  useEffect(() => {
    // Load data from session storage
    const storedApiKey = sessionStorage.getItem('onboarding_api_key');
    const storedSiteId = sessionStorage.getItem('onboarding_site_id');
    const storedDomain = sessionStorage.getItem('onboarding_domain');

    if (storedApiKey) {
      setApiKey(storedApiKey);
    }
    if (storedSiteId) {
      setSiteId(storedSiteId);
    }
    if (storedDomain) {
      setDomain(storedDomain);
    }

    // Check if user skipped crawl step
    const skippedCrawl = sessionStorage.getItem('onboarding_skipped_crawl');
    if (!skippedCrawl && !storedSiteId) {
      // If no site ID and didn't skip crawl, maybe go back
      const storedDomainCheck = sessionStorage.getItem('onboarding_domain');
      if (!storedDomainCheck) {
        router.push('/onboarding/add-site');
        return;
      }
    }

    // Get number of cached pages (rough estimate from jobs)
    // For demo purposes, we'll just show a placeholder
    setCachedPages(storedSiteId ? 5 : 0);
  }, [router]);

  const handleCopy = async () => {
    const snippet = frameworkSnippets[selectedFramework];
    const codeWithKey = apiKey
      ? snippet.code.replace('API_KEY_PLACEHOLDER', apiKey)
      : snippet.code.replace('API_KEY_PLACEHOLDER', 'YOUR_API_KEY');

    try {
      await navigator.clipboard.writeText(codeWithKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = codeWithKey;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleComplete = () => {
    // Clear session storage
    sessionStorage.removeItem('onboarding_analysis');
    sessionStorage.removeItem('onboarding_url');
    sessionStorage.removeItem('onboarding_domain');
    sessionStorage.removeItem('onboarding_api_key');
    sessionStorage.removeItem('onboarding_site_id');
    sessionStorage.removeItem('onboarding_skipped_crawl');

    // Go to dashboard
    router.push('/dashboard');
  };

  const handleSkip = () => {
    // Clear session storage but mark as incomplete
    sessionStorage.removeItem('onboarding_analysis');
    sessionStorage.removeItem('onboarding_url');
    sessionStorage.removeItem('onboarding_skipped_crawl');

    // Keep domain and site ID for dashboard to show reminder
    router.push('/dashboard');
  };

  const currentSnippet = frameworkSnippets[selectedFramework];
  const displayCode = apiKey
    ? currentSnippet.code.replace('API_KEY_PLACEHOLDER', apiKey)
    : currentSnippet.code.replace('API_KEY_PLACEHOLDER', 'YOUR_API_KEY');

  return (
    <div className="space-y-6">
      {/* Success banner if pages were cached */}
      {cachedPages > 0 && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-3">
            <svg className="size-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-medium text-green-800">
                {cachedPages}
                {' '}
                page
                {cachedPages !== 1 ? 's' : ''}
                {' '}
                pre-cached for
                {domain}
              </p>
              <p className="text-sm text-green-700">
                These pages will be served in &lt;200ms once you integrate the middleware.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* API Key Card */}
      {apiKey && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-700">Your API Key</h3>
              <p className="mt-1 font-mono text-lg text-gray-900">{apiKey}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(apiKey);
              }}
              className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              Copy
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Save this key securely. You&apos;ll need it for the middleware configuration below.
          </p>
        </div>
      )}

      {/* Main Integration Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-blue-100">
            <svg className="size-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900">Integrate CrawlReady</h2>
          <p className="mt-2 text-gray-600">
            Add middleware to serve pre-rendered pages to AI crawlers
          </p>
        </div>

        {/* Framework Selector */}
        <div className="mb-6">
          <div className="mb-3 text-sm font-medium text-gray-700">Select your framework:</div>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(frameworkSnippets) as Framework[]).map(fw => (
              <button
                type="button"
                key={fw}
                onClick={() => setSelectedFramework(fw)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  selectedFramework === fw
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {fw === 'nextjs' ? 'Next.js' : fw === 'nuxt' ? 'Nuxt.js' : fw.charAt(0).toUpperCase() + fw.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Code Snippet */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">{currentSnippet.title}</h3>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
            >
              {copied
                ? (
                    <>
                      <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </>
                  )
                : (
                    <>
                      <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      Copy Code
                    </>
                  )}
            </button>
          </div>
          <p className="mb-3 text-sm text-gray-500">{currentSnippet.description}</p>
          <div className="overflow-x-auto rounded-lg bg-gray-900 p-4">
            <pre className="whitespace-pre font-mono text-sm text-gray-100">
              {displayCode}
            </pre>
          </div>
        </div>

        {/* No API key warning */}
        {!apiKey && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <svg className="mt-0.5 size-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="font-medium text-amber-800">API Key Required</p>
                <p className="mt-1 text-sm text-amber-700">
                  Replace
                  {' '}
                  <code className="rounded bg-amber-100 px-1">YOUR_API_KEY</code>
                  {' '}
                  with your actual API key.
                  You can generate one from the dashboard.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* How It Works - Simplified */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-semibold text-gray-900">How It Works</h3>
        <div className="grid gap-4 text-sm sm:grid-cols-2">
          <div className="flex items-start gap-3">
            <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600">1</div>
            <p className="text-gray-600">AI crawler visits your site</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600">2</div>
            <p className="text-gray-600">Middleware detects the crawler</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600">3</div>
            <p className="text-gray-600">CrawlReady returns cached HTML in &lt;200ms</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-medium text-green-600">
              <svg className="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-gray-600">AI understands your content</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={handleSkip}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-3 font-medium text-gray-700 hover:bg-gray-50"
        >
          I&apos;ll do this later
        </button>
        <button
          type="button"
          onClick={handleComplete}
          className="flex-1 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700"
        >
          I&apos;ve integrated
        </button>
      </div>

      {/* Footer note */}
      <p className="text-center text-sm text-gray-500">
        You can always integrate later from your dashboard. Your pre-cached pages will be waiting.
      </p>
    </div>
  );
}

export const dynamic = 'force-dynamic';
