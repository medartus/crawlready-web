'use client';

import Link from 'next/link';
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
      \`https://api.crawlready.com/render?url=\${encodeURIComponent(url.href)}&key=YOUR_API_KEY\`
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
      \`https://api.crawlready.com/render?url=\${encodeURIComponent(url)}&key=YOUR_API_KEY\`
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
            set $prerender_url "https://api.crawlready.com/render?url=$scheme://$host$request_uri&key=YOUR_API_KEY";
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
    const response = await $fetch(\`https://api.crawlready.com/render?url=\${encodeURIComponent(url.href)}&key=YOUR_API_KEY\`);
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
      \`https://api.crawlready.com/render?url=\${encodeURIComponent(url)}&key=YOUR_API_KEY\`
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
    const apiUrl = \`https://api.crawlready.com/render?url=\${encodeURIComponent(currentUrl)}&key=YOUR_API_KEY\`;
    
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

  useEffect(() => {
    // Load detected framework from session storage
    const analysis = sessionStorage.getItem('onboarding_analysis');
    if (analysis) {
      try {
        const data = JSON.parse(analysis);
        if (data.framework?.name) {
          const fw = data.framework.name.toLowerCase();
          if (fw.includes('next')) {
            setSelectedFramework('nextjs');
          } else if (fw.includes('nuxt')) {
            setSelectedFramework('nuxt');
          } else if (fw.includes('vue')) {
            setSelectedFramework('vue');
          } else if (fw.includes('angular')) {
            setSelectedFramework('angular');
          } else if (fw.includes('react')) {
            setSelectedFramework('react');
          }
        }
      } catch {
        // Ignore parse errors
      }
    }

    // Get API key from session if available
    const storedKey = sessionStorage.getItem('onboarding_api_key');
    if (storedKey) {
      setApiKey(storedKey);
    }
  }, []);

  const handleCopy = async () => {
    const snippet = frameworkSnippets[selectedFramework];
    const codeWithKey = apiKey
      ? snippet.code.replace('YOUR_API_KEY', apiKey)
      : snippet.code;

    try {
      await navigator.clipboard.writeText(codeWithKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
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

  const currentSnippet = frameworkSnippets[selectedFramework];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-green-100">
            <svg className="size-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900">Integrate CrawlReady</h2>
          <p className="mt-2 text-gray-600">
            Add a few lines of code to make your site visible to AI crawlers
          </p>
        </div>

        {/* Framework Selector */}
        <div className="mb-6">
          <label className="mb-3 block text-sm font-medium text-gray-700">Select your framework:</label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(frameworkSnippets) as Framework[]).map(fw => (
              <button
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
              {apiKey ? currentSnippet.code.replace('YOUR_API_KEY', apiKey) : currentSnippet.code}
            </pre>
          </div>
        </div>

        {/* API Key Notice */}
        {!apiKey && (
          <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-yellow-600">⚠️</span>
              <div>
                <p className="text-sm text-yellow-800">
                  <strong>Remember:</strong>
                  {' '}
                  Replace
                  <code className="rounded bg-yellow-100 px-1">YOUR_API_KEY</code>
                  {' '}
                  with
                  your actual API key. You'll get this after completing setup.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* What This Does */}
      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">How It Works</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-100 font-medium text-blue-600">
              1
            </div>
            <div>
              <h4 className="font-medium text-gray-900">AI crawler visits your site</h4>
              <p className="text-sm text-gray-500">
                ChatGPT, Claude, or Perplexity sends a request to your page
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-100 font-medium text-blue-600">
              2
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Middleware detects the crawler</h4>
              <p className="text-sm text-gray-500">
                The code checks the user agent to identify AI crawlers
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-100 font-medium text-blue-600">
              3
            </div>
            <div>
              <h4 className="font-medium text-gray-900">CrawlReady renders the page</h4>
              <p className="text-sm text-gray-500">
                We execute JavaScript and return fully-rendered HTML in
                {' '}
                {'<'}
                200ms
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-green-100 font-medium text-green-600">
              ✓
            </div>
            <div>
              <h4 className="font-medium text-gray-900">AI understands your content</h4>
              <p className="text-sm text-gray-500">
                Your site can now be cited in ChatGPT, Claude, and Perplexity answers
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Link
          href="/onboarding/analyze"
          className="flex-1 rounded-lg bg-gray-100 px-4 py-3 text-center font-medium text-gray-700 transition-colors hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          ← Back
        </Link>
        <Link
          href="/onboarding/verify"
          className="flex-1 rounded-lg bg-blue-600 px-4 py-3 text-center font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          I've Added the Code →
        </Link>
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';
