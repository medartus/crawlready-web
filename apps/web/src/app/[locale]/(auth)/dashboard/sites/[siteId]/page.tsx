'use client';

import { AlertTriangle, ArrowLeft, CheckCircle2, Clock, Copy, FileCode, Globe, Key, Plus, RefreshCw, Settings, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { buttonVariants } from '@/components/ui/buttonVariants';
import { TitleBar } from '@/features/dashboard/TitleBar';

type Site = {
  id: string;
  domain: string;
  displayName: string | null;
  status: 'pending' | 'active' | 'error' | 'suspended';
  statusReason: string | null;
  frameworkDetected: string | null;
  frameworkVersion: string | null;
  settings: string | Record<string, unknown>;
  rendersCount: number;
  rendersThisMonth: number;
  lastRenderAt: string | null;
  lastCrawlerVisitAt: string | null;
  verifiedAt: string | null;
  createdAt: string;
};

type ApiKey = {
  id: string;
  keyPrefix: string;
  keySuffix: string | null;
  name: string | null;
  lastUsedAt: string | null;
  useCount: number;
  isActive: boolean;
  createdAt: string;
};

type SiteData = {
  site: Site;
  apiKey: ApiKey | null;
  statusHistory: Array<{
    id: string;
    fromStatus: string | null;
    toStatus: string;
    reason: string | null;
    changedBy: string | null;
    changeType: string;
    createdAt: string;
  }>;
};

type CachedPage = {
  id: string;
  normalizedUrl: string;
  htmlSizeBytes: number;
  lastAccessedAt: string;
  accessCount: number;
  inRedis: boolean;
};

const statusConfig = {
  pending: { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-100', label: 'Pending Verification' },
  active: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-100', label: 'Active' },
  error: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-100', label: 'Error' },
  suspended: { icon: AlertTriangle, color: 'text-gray-500', bg: 'bg-gray-100', label: 'Suspended' },
};

export default function SiteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const siteId = params.siteId as string;

  const [data, setData] = useState<SiteData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [cachedPages, setCachedPages] = useState<CachedPage[]>([]);
  const [isFetchingPages, setIsFetchingPages] = useState(false);

  useEffect(() => {
    const fetchSite = async () => {
      try {
        const response = await fetch(`/api/user/sites/${siteId}`);
        if (response.ok) {
          const result = await response.json();
          setData(result);
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

  // Fetch cached pages for this site
  useEffect(() => {
    if (!data?.site?.domain) {
      return;
    }

    const fetchCachedPages = async () => {
      setIsFetchingPages(true);
      try {
        const response = await fetch(`/api/user/sites/${siteId}/cached-pages`);
        if (response.ok) {
          const result = await response.json();
          setCachedPages(result.pages || []);
        }
      } catch {
        // Silently fail - cached pages are optional
      } finally {
        setIsFetchingPages(false);
      }
    };

    fetchCachedPages();
  }, [siteId, data?.site?.domain]);

  const handleCopyApiKey = async () => {
    if (!data?.apiKey) {
      return;
    }
    const keyDisplay = `${data.apiKey.keyPrefix}...${data.apiKey.keySuffix || ''}`;
    try {
      await navigator.clipboard.writeText(keyDisplay);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore
    }
  };

  const handleDelete = async () => {
    // eslint-disable-next-line no-alert
    if (!globalThis.confirm('Are you sure you want to delete this site? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/user/sites/${siteId}`, { method: 'DELETE' });
      if (response.ok) {
        router.push('/dashboard/sites');
      }
      // Errors handled silently - user sees loading state end
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
          <RefreshCw className="size-8 animate-spin text-gray-400" />
        </div>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <TitleBar title="Site Details" description="" />
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <AlertTriangle className="mx-auto mb-4 size-12 text-red-400" />
          <p className="text-red-700">{error || 'Site not found'}</p>
          <Link href="/dashboard/sites" className={`${buttonVariants({ variant: 'outline' })} mt-4`}>
            Back to Sites
          </Link>
        </div>
      </>
    );
  }

  const { site, apiKey, statusHistory } = data;
  const status = statusConfig[site.status];
  const StatusIcon = status.icon;

  // Parse settings safely - handle both string and object cases
  let settings: Record<string, unknown> = {};
  try {
    if (typeof site.settings === 'string') {
      settings = JSON.parse(site.settings || '{}');
    } else if (typeof site.settings === 'object' && site.settings !== null) {
      settings = site.settings as Record<string, unknown>;
    }
  } catch {
    settings = {};
  }

  const timeAgo = (date: string | null) => {
    if (!date) {
      return 'Never';
    }
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) {
      return `${minutes}m ago`;
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours}h ago`;
    }
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <>
      <TitleBar
        title={site.displayName || site.domain}
        description={site.domain}
      />

      {/* Back Button */}
      <Link
        href="/dashboard/sites"
        className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
      >
        <ArrowLeft className="size-4" />
        Back to Sites
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="space-y-6 lg:col-span-2">
          {/* Status Card */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-6 flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className={`flex size-14 items-center justify-center rounded-xl ${status.bg}`}>
                  <Globe className={`size-7 ${status.color}`} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {site.displayName || site.domain}
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400">{site.domain}</p>
                </div>
              </div>
              <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${status.bg} ${status.color}`}>
                <StatusIcon className="size-4" />
                {status.label}
              </div>
            </div>

            {site.statusReason && (
              <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">{site.statusReason}</p>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Renders</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{site.rendersCount}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">This Month</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{site.rendersThisMonth}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Last Render</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{timeAgo(site.lastRenderAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Last Crawler</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{timeAgo(site.lastCrawlerVisitAt)}</p>
              </div>
            </div>
          </div>

          {/* Framework Info */}
          {site.frameworkDetected && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">Detected Framework</h3>
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-blue-100 px-3 py-1.5 font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                  {site.frameworkDetected}
                </span>
                {site.frameworkVersion && (
                  <span className="text-gray-500 dark:text-gray-400">
                    v
                    {site.frameworkVersion}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Settings Preview */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">Configuration</h3>
              <Settings className="size-5 text-gray-400" />
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Cache TTL</span>
                <span className="text-gray-900 dark:text-white">
                  {(Number(settings.cacheTtl) || 21600) / 3600}
                  {' '}
                  hours
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Enabled Crawlers</span>
                <span className="text-gray-900 dark:text-white">{Array.isArray(settings.enabledCrawlers) ? settings.enabledCrawlers.length : 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Render Timeout</span>
                <span className="text-gray-900 dark:text-white">
                  {(Number((settings.rendering as Record<string, unknown> | undefined)?.timeout) || 30000) / 1000}
                  s
                </span>
              </div>
            </div>
          </div>

          {/* Cached Pages */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="size-5 text-gray-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Cached Pages</h3>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                  {cachedPages.length}
                </span>
              </div>
              <Link
                href={`/onboarding/crawl?siteId=${site.id}`}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              >
                <Plus className="size-4" />
                Add Pages
              </Link>
            </div>
            {isFetchingPages
              ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="size-5 animate-spin text-gray-400" />
                  </div>
                )
              : cachedPages.length > 0
                ? (
                    <div className="space-y-2">
                      {cachedPages.slice(0, 5).map(page => (
                        <div
                          key={page.id}
                          className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm text-gray-700 dark:text-gray-300">
                              {page.normalizedUrl.replace(/^https?:\/\//, '')}
                            </p>
                            <p className="text-xs text-gray-500">
                              {Math.round(page.htmlSizeBytes / 1024)}
                              KB
                              {page.inRedis && (
                                <span className="ml-2 text-green-600">Hot</span>
                              )}
                            </p>
                          </div>
                          <span className="ml-2 whitespace-nowrap text-xs text-gray-400">
                            {page.accessCount}
                            {' '}
                            hits
                          </span>
                        </div>
                      ))}
                      {cachedPages.length > 5 && (
                        <Link
                          href={`/dashboard/pages?siteId=${site.id}`}
                          className="block text-center text-sm text-blue-600 hover:text-blue-700"
                        >
                          View all
                          {' '}
                          {cachedPages.length}
                          {' '}
                          pages
                        </Link>
                      )}
                    </div>
                  )
                : (
                    <div className="rounded-lg border-2 border-dashed border-gray-200 py-8 text-center dark:border-gray-700">
                      <FileCode className="mx-auto mb-2 size-8 text-gray-300 dark:text-gray-600" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">No cached pages yet</p>
                      <Link
                        href={`/onboarding/crawl?siteId=${site.id}`}
                        className={`${buttonVariants({ variant: 'outline', size: 'sm' })} mt-3`}
                      >
                        Pre-Cache Pages
                      </Link>
                    </div>
                  )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* API Key Card */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4 flex items-center gap-2">
              <Key className="size-5 text-gray-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">API Key</h3>
            </div>
            {apiKey
              ? (
                  <>
                    <div className="mb-3 flex items-center gap-2 rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
                      <code className="flex-1 truncate text-sm text-gray-700 dark:text-gray-300">
                        {apiKey.keyPrefix}
                        ...
                        {apiKey.keySuffix}
                      </code>
                      <button
                        type="button"
                        onClick={handleCopyApiKey}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title="Copy API Key prefix"
                      >
                        {copied ? <CheckCircle2 className="size-4 text-green-500" /> : <Copy className="size-4" />}
                      </button>
                    </div>
                    <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                      <p>
                        Used
                        {apiKey.useCount}
                        {' '}
                        times
                      </p>
                      <p>
                        Last used:
                        {timeAgo(apiKey.lastUsedAt)}
                      </p>
                    </div>
                  </>
                )
              : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No active API key</p>
                )}
          </div>

          {/* Actions */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">Actions</h3>
            <div className="space-y-3">
              <Link
                href={`/dashboard/test-render?url=https://${site.domain}`}
                className={`${buttonVariants({ variant: 'outline' })} w-full`}
              >
                Test Render
              </Link>
              <Link
                href={`/dashboard/pages?siteId=${site.id}`}
                className={`${buttonVariants({ variant: 'outline' })} w-full`}
              >
                View Rendered Pages
              </Link>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className={`${buttonVariants({ variant: 'outline' })} w-full text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20`}
              >
                {isDeleting
                  ? (
                      <RefreshCw className="mr-2 size-4 animate-spin" />
                    )
                  : (
                      <Trash2 className="mr-2 size-4" />
                    )}
                Delete Site
              </button>
            </div>
          </div>

          {/* Status History */}
          {statusHistory.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">Status History</h3>
              <div className="space-y-3">
                {statusHistory.slice(0, 5).map(entry => (
                  <div key={entry.id} className="flex items-start gap-3 text-sm">
                    <div className="mt-1.5 size-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                    <div>
                      <p className="text-gray-900 dark:text-white">
                        {entry.changeType}
                        :
                        {entry.toStatus}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
