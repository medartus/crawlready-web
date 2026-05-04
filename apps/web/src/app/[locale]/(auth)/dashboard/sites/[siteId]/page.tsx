'use client';

import { Activity, AlertCircle, AlertTriangle, ArrowLeft, BarChart3, CheckCircle2, Code, Copy, Eye, EyeOff, Globe, Key, Loader2, Settings, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { buttonVariants } from '@/components/ui/buttonVariants';
import { TitleBar } from '@/features/dashboard/TitleBar';

type SiteDetail = {
  id: string;
  domain: string;
  site_key: string;
  tier: string;
  created_at: string;
  snippet: Record<string, string>;
  last_beacon_at: string | null;
  total_visits: number;
};

const SNIPPET_TABS = [
  { key: 'nextjs', label: 'Next.js' },
  { key: 'express', label: 'Express' },
  { key: 'cloudflare', label: 'Cloudflare' },
  { key: 'generic', label: 'Generic' },
] as const;

export default function SiteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const siteId = params.siteId as string;

  const [site, setSite] = useState<SiteDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [copiedScriptTag, setCopiedScriptTag] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeSnippetTab, setActiveSnippetTab] = useState<string>('nextjs');
  const [keyRevealed, setKeyRevealed] = useState(false);
  const searchParams = useSearchParams();

  // Top-level tab from URL, default contextually
  const getDefaultTab = () => {
    const urlTab = searchParams.get('tab');
    if (urlTab && ['setup', 'status', 'key'].includes(urlTab)) {
      return urlTab;
    }
    // Default: status for active sites, setup for new
    if (site?.last_beacon_at) {
      return 'status';
    }
    return 'setup';
  };
  const [activeTopTab, setActiveTopTab] = useState<string>('setup');

  const switchTab = (tab: string) => {
    setActiveTopTab(tab);
    const url = new URL(globalThis.location.href);
    url.searchParams.set('tab', tab);
    globalThis.history.replaceState({}, '', url.toString());
  };

  useEffect(() => {
    const fetchSite = async () => {
      try {
        const response = await fetch(`/api/v1/sites/${siteId}`);
        if (response.ok) {
          const data = await response.json();
          setSite(data);
        } else if (response.status === 404) {
          setError('Site not found');
        } else {
          setError('Failed to load site');
        }
      } catch {
        setError('Failed to load site');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSite();
  }, [siteId]);

  // Set default tab after site loads
  useEffect(() => {
    if (site) {
      setActiveTopTab(getDefaultTab());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [site?.last_beacon_at]);

  const handleCopy = async (text: string, setter: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setter(true);
      setTimeout(() => setter(false), 2000);
    } catch {
      // Clipboard failed silently
    }
  };

  const handleDelete = async () => {
    // eslint-disable-next-line no-alert
    if (!globalThis.confirm('Are you sure you want to delete this site? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/v1/sites/${siteId}`, { method: 'DELETE' });
      if (response.ok || response.status === 204) {
        router.push('/dashboard/sites');
      }
    } catch {
      // Delete failed silently
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <TitleBar title="Site Details" description="" />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-8 animate-spin text-gray-400" />
        </div>
      </>
    );
  }

  if (error || !site) {
    return (
      <>
        <TitleBar title="Site Details" description="" />
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-950/20">
          <AlertTriangle className="mx-auto mb-4 size-12 text-red-400" />
          <p className="text-red-700 dark:text-red-300">{error || 'Site not found'}</p>
          <Link href="/dashboard/sites" className={`${buttonVariants({ variant: 'outline' })} mt-4`}>
            Back to Sites
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <TitleBar title={site.domain} description={`Registered ${new Date(site.created_at).toLocaleDateString()}`} />

      <Link
        href="/dashboard/sites"
        className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
      >
        <ArrowLeft className="size-4" />
        Back to Sites
      </Link>

      {/* Top-level tabs */}
      <div className="mb-6 flex gap-1 rounded-lg border border-gray-200 bg-gray-100 p-1 dark:border-gray-700 dark:bg-gray-900">
        {[
          { key: 'setup', label: 'Setup', icon: Settings },
          { key: 'status', label: 'Status', icon: BarChart3 },
          { key: 'key', label: 'Site Key', icon: Key },
        ].map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => switchTab(tab.key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTopTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <tab.icon className="size-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Setup Tab */}
      {activeTopTab === 'setup' && (
        <div className="space-y-6">
          {/* Script Tag */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4 flex items-center gap-2">
              <Code className="size-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Script Tag (Quick Start)</h3>
            </div>
            <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
              Add before
              {' '}
              <code className="rounded bg-gray-100 px-1 dark:bg-gray-900">&lt;/head&gt;</code>
              {' '}
              for zero-config AI crawler tracking.
            </p>
            <div className="relative">
              <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-xs text-gray-100">
                {`<script src="https://crawlready.app/c.js" data-key="${site.site_key}" async></script>\n<noscript><img src="https://crawlready.app/api/v1/t/${site.site_key}" alt="" /></noscript>`}
              </pre>
              <button
                type="button"
                onClick={() => handleCopy(
                  `<script src="https://crawlready.app/c.js" data-key="${site.site_key}" async></script>\n<noscript><img src="https://crawlready.app/api/v1/t/${site.site_key}" alt="" /></noscript>`,
                  setCopiedScriptTag,
                )}
                className="absolute right-2 top-2 rounded bg-gray-700 px-2 py-1 text-xs text-gray-300 hover:bg-gray-600"
              >
                {copiedScriptTag ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Middleware Snippet */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">
              Middleware Snippet (Recommended)
            </h3>
            <div className="mb-3 flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-900">
              {SNIPPET_TABS.map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveSnippetTab(tab.key)}
                  className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    activeSnippetTab === tab.key
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
                {site.snippet[activeSnippetTab]}
              </pre>
              <button
                type="button"
                onClick={() => handleCopy(site.snippet[activeSnippetTab] ?? '', setCopiedSnippet)}
                className="absolute right-2 top-2 rounded bg-gray-700 px-2 py-1 text-xs text-gray-300 hover:bg-gray-600"
              >
                {copiedSnippet ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Tab */}
      {activeTopTab === 'status' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Status Overview */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">Integration Status</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-center dark:border-gray-700 dark:bg-gray-900">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{site.total_visits}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Visits</p>
                </div>
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-center dark:border-gray-700 dark:bg-gray-900">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {site.last_beacon_at
                      ? new Date(site.last_beacon_at).toLocaleDateString()
                      : '—'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Last Beacon</p>
                </div>
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-center dark:border-gray-700 dark:bg-gray-900">
                  {!site.last_beacon_at
                    ? (
                        <span className="inline-flex items-center gap-1 text-lg font-bold text-amber-600 dark:text-amber-400">
                          <AlertCircle className="size-5" />
                          Pending
                        </span>
                      )
                    : (Date.now() - new Date(site.last_beacon_at).getTime()) < 86400000
                        ? (
                            <span className="inline-flex items-center gap-1 text-lg font-bold text-green-600 dark:text-green-400">
                              <Activity className="size-5" />
                              Active
                            </span>
                          )
                        : (
                            <span className="inline-flex items-center gap-1 text-lg font-bold text-blue-600 dark:text-blue-400">
                              <CheckCircle2 className="size-5" />
                              Connected
                            </span>
                          )}
                  <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                </div>
              </div>
            </div>

            {/* Next Steps for pending sites */}
            {!site.last_beacon_at && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-900/20">
                <h3 className="mb-2 font-semibold text-amber-800 dark:text-amber-300">Waiting for first beacon</h3>
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  Deploy your integration and AI crawlers will be detected automatically.
                  Switch to the Setup tab to see integration snippets.
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
                  <Globe className="size-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{site.domain}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {site.tier}
                    {' '}
                    plan
                  </p>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Registered</span>
                  <span className="text-gray-900 dark:text-white">{new Date(site.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Delete */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">Danger Zone</h3>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                {isDeleting
                  ? <Loader2 className="size-4 animate-spin" />
                  : <Trash2 className="size-4" />}
                Delete Site
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Site Key Tab */}
      {activeTopTab === 'key' && (
        <div className="mx-auto max-w-xl space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4 flex items-center gap-2">
              <Key className="size-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Site Key</h3>
            </div>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              This key identifies your site when sending beacons. Keep it safe but it is not a secret — it is embedded in your client-side code.
            </p>
            <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-900">
              <code className="flex-1 font-mono text-sm text-gray-900 dark:text-white">
                {keyRevealed ? site.site_key : `${site.site_key.slice(0, 12)}${'•'.repeat(8)}`}
              </code>
              <button
                type="button"
                onClick={() => setKeyRevealed(!keyRevealed)}
                className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                title={keyRevealed ? 'Hide' : 'Reveal'}
              >
                {keyRevealed
                  ? <EyeOff className="size-4" />
                  : <Eye className="size-4" />}
              </button>
              <button
                type="button"
                onClick={() => handleCopy(site.site_key, setCopiedKey)}
                className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                title="Copy site key"
              >
                {copiedKey
                  ? <CheckCircle2 className="size-4 text-emerald-500" />
                  : <Copy className="size-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
