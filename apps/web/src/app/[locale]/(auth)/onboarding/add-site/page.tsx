'use client';

import { CheckCircle2, Copy, Globe, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

type RegistrationResult = {
  id: string;
  domain: string;
  site_key: string;
  created_at: string;
  snippet: Record<string, string>;
};

const SNIPPET_TABS = [
  { key: 'nextjs', label: 'Next.js' },
  { key: 'express', label: 'Express' },
  { key: 'cloudflare', label: 'Cloudflare' },
  { key: 'generic', label: 'Generic' },
] as const;

export default function AddSitePage() {
  const [domain, setDomain] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<RegistrationResult | null>(null);
  const [activeTab, setActiveTab] = useState<string>('nextjs');
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const handleCopy = async (text: string, setter: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setter(true);
      setTimeout(() => setter(false), 2000);
    } catch {
      // Clipboard failed silently
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!domain.trim()) {
      setError('Please enter a domain');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/v1/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domain.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.error?.message ?? 'Failed to register site.');
        return;
      }

      setResult(data);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Success state — show site key + snippets
  if (result) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-6 text-center">
          <CheckCircle2 className="mx-auto mb-3 size-12 text-emerald-500" />
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {result.domain}
            {' '}
            registered!
          </h2>
        </div>

        {/* Site Key */}
        <div className="mb-6">
          <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Site Key
          </span>
          <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-900">
            <code className="flex-1 font-mono text-sm text-gray-900 dark:text-white">
              {result.site_key}
            </code>
            <button
              type="button"
              onClick={() => handleCopy(result.site_key, setCopiedKey)}
              className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {copiedKey
                ? <CheckCircle2 className="size-4 text-emerald-500" />
                : <Copy className="size-4" />}
            </button>
          </div>
        </div>

        {/* Snippet Tabs */}
        <div className="mb-6">
          <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Add this to your middleware:
          </span>
          <div className="mb-3 flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-900">
            {SNIPPET_TABS.map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <pre className="max-h-64 overflow-auto rounded-lg bg-gray-900 p-4 text-xs text-gray-100">
              {result.snippet[activeTab]}
            </pre>
            <button
              type="button"
              onClick={() => handleCopy(result.snippet[activeTab] ?? '', setCopiedSnippet)}
              className="absolute right-2 top-2 rounded bg-gray-700 px-2 py-1 text-xs text-gray-300 hover:bg-gray-600"
            >
              {copiedSnippet ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <p className="mb-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Once installed, AI crawler visits will appear in your dashboard.
        </p>

        <Link
          href="/dashboard/sites"
          className="block w-full rounded-lg bg-indigo-600 px-4 py-3 text-center font-medium text-white transition-colors hover:bg-indigo-700"
        >
          Go to Dashboard
        </Link>
      </div>
    );
  }

  // Registration form
  return (
    <div className="mx-auto max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
          <Globe className="size-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Register a Site
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Track which AI crawlers visit your site
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="domain" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Domain
          </label>
          <input
            type="text"
            id="domain"
            value={domain}
            onChange={e => setDomain(e.target.value)}
            placeholder="example.com"
            className={`block w-full rounded-lg border px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white ${
              error ? 'border-red-300' : 'border-gray-300'
            }`}
            disabled={isLoading}
          />
          {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading
            ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  Registering...
                </>
              )
            : 'Register Site'}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-500">
        You can register up to 10 sites on the free plan.
      </p>
    </div>
  );
}

export const dynamic = 'force-dynamic';
