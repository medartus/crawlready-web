'use client';

import { Check, Code, Copy, ExternalLink, Eye, RefreshCw, Zap } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { buttonVariants } from '@/components/ui/buttonVariants';
import { TitleBar } from '@/features/dashboard/TitleBar';

type RenderResult = {
  url: string;
  html: string;
  renderTimeMs: number;
  htmlSizeBytes: number;
  cached: boolean;
  crawlerUsed: string;
  timestamp: string;
};

export default function TestRenderPage() {
  const searchParams = useSearchParams();
  const [url, setUrl] = useState(searchParams.get('url') || '');
  const [crawler, setCrawler] = useState('GPTBot');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<RenderResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'preview' | 'source'>('preview');
  const [copied, setCopied] = useState(false);

  const crawlerOptions = [
    { value: 'GPTBot', label: 'GPTBot (ChatGPT)', icon: '🤖' },
    { value: 'ClaudeBot', label: 'ClaudeBot (Anthropic)', icon: '🤖' },
    { value: 'PerplexityBot', label: 'PerplexityBot', icon: '🤖' },
    { value: 'Google-Extended', label: 'Google-Extended', icon: '🔍' },
    { value: 'Googlebot', label: 'Googlebot', icon: '🔍' },
    { value: 'Bingbot', label: 'Bingbot', icon: '🔍' },
  ];

  const handleRender = async () => {
    if (!url) {
      setError('Please enter a URL');
      return;
    }

    // Validate URL
    try {
      // Validate URL format by parsing it
      URL.parse(url.startsWith('http') ? url : `https://${url}`);
      if (!URL.canParse(url.startsWith('http') ? url : `https://${url}`)) {
        throw new Error('Invalid URL');
      }
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const fullUrl = url.startsWith('http') ? url : `https://${url}`;
      const response = await fetch('/api/user/test-render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: fullUrl, crawler }),
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to render page');
      }
    } catch {
      setError('Failed to connect to the server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result?.html) {
      return;
    }
    try {
      await navigator.clipboard.writeText(result.html);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore
    }
  };

  const handleInvalidate = async () => {
    if (!result?.url) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/user/test-render/invalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: result.url }),
      });

      if (response.ok) {
        // Re-render after invalidation
        handleRender();
      } else {
        setError('Failed to invalidate cache');
        setIsLoading(false);
      }
    } catch {
      setError('Failed to invalidate cache');
      setIsLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      <TitleBar
        title="Test Render"
        description="Preview how AI crawlers see your pages"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Input Panel */}
        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">Render Settings</h3>

            {/* URL Input */}
            <div className="mb-4">
              <label htmlFor="render-url" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                URL to Render
              </label>
              <input
                id="render-url"
                type="text"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://example.com/page"
                className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                onKeyDown={e => e.key === 'Enter' && handleRender()}
              />
            </div>

            {/* Crawler Selector */}
            <div className="mb-6">
              <label htmlFor="crawler-select" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Simulate Crawler
              </label>
              <select
                id="crawler-select"
                value={crawler}
                onChange={e => setCrawler(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                aria-label="Select crawler to simulate"
              >
                {crawlerOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.icon}
                    {' '}
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Render Button */}
            <button
              type="button"
              onClick={handleRender}
              disabled={isLoading}
              className={`${buttonVariants({ variant: 'default' })} w-full gap-2`}
            >
              {isLoading
                ? (
                    <>
                      <RefreshCw className="size-4 animate-spin" />
                      Rendering...
                    </>
                  )
                : (
                    <>
                      <Zap className="size-4" />
                      Render Page
                    </>
                  )}
            </button>

            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                {error}
              </div>
            )}
          </div>

          {/* Result Stats */}
          {result && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">Render Stats</h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Render Time</span>
                  <span className={`font-medium ${result.renderTimeMs < 200 ? 'text-green-600' : result.renderTimeMs < 500 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {result.renderTimeMs}
                    ms
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">HTML Size</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatBytes(result.htmlSizeBytes)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Cached</span>
                  <span className={`font-medium ${result.cached ? 'text-green-600' : 'text-yellow-600'}`}>
                    {result.cached ? 'Yes (Cache Hit)' : 'No (Fresh Render)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Crawler</span>
                  <span className="font-medium text-gray-900 dark:text-white">{result.crawlerUsed}</span>
                </div>
              </div>

              <div className="mt-4 space-y-2 border-t border-gray-100 pt-4 dark:border-gray-700">
                <button
                  type="button"
                  onClick={handleInvalidate}
                  disabled={isLoading}
                  className={`${buttonVariants({ variant: 'outline', size: 'sm' })} w-full`}
                >
                  <RefreshCw className={`mr-2 size-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Clear Cache & Re-render
                </button>
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${buttonVariants({ variant: 'outline', size: 'sm' })} w-full`}
                >
                  <ExternalLink className="mr-2 size-4" />
                  Open Original URL
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            {/* Tab Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode('preview')}
                  className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    viewMode === 'preview'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
                >
                  <Eye className="size-4" />
                  Preview
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('source')}
                  className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    viewMode === 'source'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
                >
                  <Code className="size-4" />
                  HTML Source
                </button>
              </div>

              {result && viewMode === 'source' && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {copied
                    ? (
                        <>
                          <Check className="size-4 text-green-500" />
                          Copied!
                        </>
                      )
                    : (
                        <>
                          <Copy className="size-4" />
                          Copy HTML
                        </>
                      )}
                </button>
              )}
            </div>

            {/* Content */}
            <div className="h-[600px] overflow-auto">
              {!result
                ? (
                    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                      <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                        <Zap className="size-8 text-gray-400" />
                      </div>
                      <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                        Enter a URL to Preview
                      </h3>
                      <p className="max-w-md text-gray-500 dark:text-gray-400">
                        Test how AI crawlers like ChatGPT and Claude see your pages. Enter a URL and click "Render Page" to see the result.
                      </p>
                    </div>
                  )
                : viewMode === 'preview'
                  ? (
                      <iframe
                        srcDoc={result.html}
                        className="size-full border-0"
                        sandbox="allow-same-origin"
                        title="Rendered Page Preview"
                      />
                    )
                  : (
                      <pre className="whitespace-pre-wrap break-words p-4 font-mono text-sm text-gray-800 dark:text-gray-200">
                        {result.html}
                      </pre>
                    )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
