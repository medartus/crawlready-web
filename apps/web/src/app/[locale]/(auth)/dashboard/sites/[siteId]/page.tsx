'use client';

import { AlertTriangle, ArrowLeft, CheckCircle2, Copy, Globe, Key, Loader2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('nextjs');

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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Site Key */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4 flex items-center gap-2">
              <Key className="size-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Site Key</h3>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-900">
              <code className="flex-1 font-mono text-sm text-gray-900 dark:text-white">
                {site.site_key}
              </code>
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

          {/* Middleware Snippet */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">
              Middleware Snippet
            </h3>
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
                {site.snippet[activeTab]}
              </pre>
              <button
                type="button"
                onClick={() => handleCopy(site.snippet[activeTab] ?? '', setCopiedSnippet)}
                className="absolute right-2 top-2 rounded bg-gray-700 px-2 py-1 text-xs text-gray-300 hover:bg-gray-600"
              >
                {copiedSnippet ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Info Card */}
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
            <div className="space-y-2 text-sm">
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
    </>
  );
}
