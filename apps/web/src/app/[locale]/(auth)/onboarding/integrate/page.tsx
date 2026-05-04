'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type IntegrationMethod = 'middleware' | 'script-tag';
type Framework = 'nextjs' | 'express' | 'cloudflare' | 'generic';

export default function IntegratePage() {
  const router = useRouter();
  const [method, setMethod] = useState<IntegrationMethod>('middleware');
  const [framework, setFramework] = useState<Framework>('nextjs');
  const [siteKey, setSiteKey] = useState<string | null>(null);
  const [domain, setDomain] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const storedKey = sessionStorage.getItem('onboarding_api_key');
    const storedDomain = sessionStorage.getItem('onboarding_domain');

    if (storedKey) {
      setSiteKey(storedKey);
    }
    if (storedDomain) {
      setDomain(storedDomain);
    }

    if (!storedKey && !storedDomain) {
      router.push('/onboarding/add-site');
    }
  }, [router]);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleContinue = () => {
    sessionStorage.setItem('onboarding_integration_method', method);
    router.push('/onboarding/verify');
  };

  const key = siteKey ?? 'YOUR_SITE_KEY';

  const scriptTagSnippet = `<!-- Add before </head> -->
<script src="https://crawlready.app/c.js" data-key="${key}" async></script>
<noscript><img src="https://crawlready.app/api/v1/t/${key}" alt="" /></noscript>`;

  const middlewareSnippets: Record<Framework, { title: string; code: string }> = {
    nextjs: {
      title: 'Next.js',
      code: `// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AI_BOTS = /GPTBot|ChatGPT-User|OAI-SearchBot|ClaudeBot|PerplexityBot|Perplexity-User|Google-Extended|Applebot-Extended|Meta-ExternalAgent|Bytespider/i;

export function middleware(request: NextRequest) {
  const ua = request.headers.get('user-agent') || '';
  if (AI_BOTS.test(ua)) {
    const bot = ua.match(AI_BOTS)?.[0] || 'unknown';
    fetch('https://crawlready.app/api/v1/ingest', {
      method: 'POST',
      body: JSON.stringify({ s: '${key}', p: request.nextUrl.pathname, b: bot, t: Date.now() }),
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => {});
  }
  return NextResponse.next();
}`,
    },
    express: {
      title: 'Express',
      code: `// app.js
const AI_BOTS = /GPTBot|ChatGPT-User|OAI-SearchBot|ClaudeBot|PerplexityBot|Perplexity-User|Google-Extended|Applebot-Extended|Meta-ExternalAgent|Bytespider/i;

app.use((req, res, next) => {
  const ua = req.headers['user-agent'] || '';
  if (AI_BOTS.test(ua)) {
    const bot = ua.match(AI_BOTS)?.[0] || 'unknown';
    fetch('https://crawlready.app/api/v1/ingest', {
      method: 'POST',
      body: JSON.stringify({ s: '${key}', p: req.path, b: bot, t: Date.now() }),
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => {});
  }
  next();
});`,
    },
    cloudflare: {
      title: 'Cloudflare Workers',
      code: `// worker.js
const AI_BOTS = /GPTBot|ChatGPT-User|OAI-SearchBot|ClaudeBot|PerplexityBot|Perplexity-User|Google-Extended|Applebot-Extended|Meta-ExternalAgent|Bytespider/i;

export default {
  async fetch(request, env) {
    const ua = request.headers.get('user-agent') || '';
    if (AI_BOTS.test(ua)) {
      const bot = ua.match(AI_BOTS)?.[0] || 'unknown';
      const url = new URL(request.url);
      env.waitUntil(fetch('https://crawlready.app/api/v1/ingest', {
        method: 'POST',
        body: JSON.stringify({ s: '${key}', p: url.pathname, b: bot, t: Date.now() }),
        headers: { 'Content-Type': 'application/json' },
      }).catch(() => {}));
    }
    return fetch(request);
  }
};`,
    },
    generic: {
      title: 'Generic JS',
      code: `// Any JS runtime
const AI_BOTS = /GPTBot|ChatGPT-User|OAI-SearchBot|ClaudeBot|PerplexityBot|Perplexity-User|Google-Extended|Applebot-Extended|Meta-ExternalAgent|Bytespider/i;

function reportAiCrawler(userAgent, path) {
  if (AI_BOTS.test(userAgent)) {
    const bot = userAgent.match(AI_BOTS)?.[0] || 'unknown';
    fetch('https://crawlready.app/api/v1/ingest', {
      method: 'POST',
      body: JSON.stringify({ s: '${key}', p: path, b: bot, t: Date.now() }),
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => {});
  }
}`,
    },
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900">Choose Integration Method</h2>
        <p className="mt-2 text-gray-600">
          Track AI crawler visits to
          {' '}
          <span className="font-medium">{domain}</span>
        </p>
      </div>

      {/* Method Toggle */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => setMethod('middleware')}
          className={`flex-1 rounded-xl border-2 p-5 text-left transition-colors ${
            method === 'middleware'
              ? 'border-blue-600 bg-blue-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="mb-1 text-sm font-semibold text-blue-600">Recommended</div>
          <div className="text-lg font-medium text-gray-900">Server Middleware</div>
          <p className="mt-1 text-sm text-gray-500">~5 lines of code, ~100% coverage</p>
        </button>
        <button
          type="button"
          onClick={() => setMethod('script-tag')}
          className={`flex-1 rounded-xl border-2 p-5 text-left transition-colors ${
            method === 'script-tag'
              ? 'border-blue-600 bg-blue-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="mb-1 text-sm font-semibold text-gray-400">Quick Start</div>
          <div className="text-lg font-medium text-gray-900">Script Tag</div>
          <p className="mt-1 text-sm text-gray-500">Zero server changes, ~60-80% coverage</p>
        </button>
      </div>

      {/* Snippet Display */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {method === 'middleware'
          ? (
              <>
                <div className="mb-4 flex gap-2">
                  {(Object.keys(middlewareSnippets) as Framework[]).map(fw => (
                    <button
                      type="button"
                      key={fw}
                      onClick={() => setFramework(fw)}
                      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                        framework === fw
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {middlewareSnippets[fw].title}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <div className="overflow-x-auto rounded-lg bg-gray-900 p-4">
                    <pre className="whitespace-pre font-mono text-sm text-gray-100">
                      {middlewareSnippets[framework].code}
                    </pre>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(middlewareSnippets[framework].code)}
                    className="absolute right-2 top-2 rounded bg-gray-700 px-2 py-1 text-xs text-gray-300 hover:bg-gray-600"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </>
            )
          : (
              <>
                <p className="mb-3 text-sm text-gray-600">
                  Add this snippet before
                  {' '}
                  <code className="rounded bg-gray-100 px-1">&lt;/head&gt;</code>
                  {' '}
                  on every page:
                </p>
                <div className="relative">
                  <div className="overflow-x-auto rounded-lg bg-gray-900 p-4">
                    <pre className="whitespace-pre font-mono text-sm text-gray-100">
                      {scriptTagSnippet}
                    </pre>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(scriptTagSnippet)}
                    className="absolute right-2 top-2 rounded bg-gray-700 px-2 py-1 text-xs text-gray-300 hover:bg-gray-600"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </>
            )}
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => router.push('/onboarding/add-site')}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-3 font-medium text-gray-700 hover:bg-gray-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleContinue}
          className="flex-1 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700"
        >
          Continue to Verify
        </button>
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';
