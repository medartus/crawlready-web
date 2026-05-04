'use client';

import { Activity, AlertCircle, CheckCircle2, Copy, Globe, MoreVertical, Plus, RefreshCw, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { buttonVariants } from '@/components/ui/buttonVariants';
import { TitleBar } from '@/features/dashboard/TitleBar';

type Site = {
  id: string;
  domain: string;
  site_key: string;
  created_at: string;
  visit_count_30d: number;
  last_beacon_at: string | null;
};

function IntegrationBadge({ lastBeaconAt }: { readonly lastBeaconAt: string | null }) {
  if (!lastBeaconAt) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
        <AlertCircle className="size-3" />
        No data yet
      </span>
    );
  }

  const lastSeen = new Date(lastBeaconAt);
  const hoursSince = (Date.now() - lastSeen.getTime()) / (1000 * 60 * 60);

  if (hoursSince < 24) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
        <Activity className="size-3" />
        Active
      </span>
    );
  }

  if (hoursSince < 168) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
        <CheckCircle2 className="size-3" />
        Connected
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-400">
      <AlertCircle className="size-3" />
      Stale
    </span>
  );
}

function SiteCard({ site, onDelete }: { site: Site; onDelete: (id: string) => void }) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyKey = async () => {
    try {
      await navigator.clipboard.writeText(site.site_key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard failed silently
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
            <Globe className="size-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {site.domain}
              </h3>
              <IntegrationBadge lastBeaconAt={site.last_beacon_at} />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Added
              {' '}
              {new Date(site.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            aria-label="Site actions"
          >
            <MoreVertical className="size-5" />
          </button>
          {showMenu && (
            <>
              <div
                role="button"
                tabIndex={0}
                className="fixed inset-0 z-10 cursor-default"
                onClick={() => setShowMenu(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setShowMenu(false);
                  }
                }}
                aria-label="Close menu"
              />
              <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onDelete(site.id);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-700"
                >
                  <Trash2 className="size-4" />
                  Delete Site
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Site Key */}
      <div className="mb-4 flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-900">
        <code className="flex-1 truncate text-xs text-gray-600 dark:text-gray-400">
          {site.site_key}
        </code>
        <button
          type="button"
          onClick={handleCopyKey}
          className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          title="Copy site key"
        >
          <Copy className="size-4" />
        </button>
        {copied && (
          <span className="text-xs text-emerald-600">Copied!</span>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-700">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900 dark:text-white">{site.visit_count_30d}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">AI Visits (30d)</p>
        </div>
        <Link
          href={`/dashboard/sites/${site.id}`}
          className={buttonVariants({ variant: 'outline', size: 'sm' })}
        >
          Details
        </Link>
      </div>
    </div>
  );
}

export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSites = async () => {
    try {
      const response = await fetch('/api/v1/sites');
      if (response.ok) {
        const data = await response.json();
        setSites(data.sites || []);
      } else {
        setError('Failed to load sites');
      }
    } catch {
      setError('Failed to load sites');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  const handleDelete = async (siteId: string) => {
    try {
      const response = await fetch(`/api/v1/sites/${siteId}`, { method: 'DELETE' });
      if (response.ok || response.status === 204) {
        setSites(prev => prev.filter(s => s.id !== siteId));
      }
      // Delete failed silently
    } catch {
      // Delete failed silently
    }
  };

  if (isLoading) {
    return (
      <>
        <TitleBar title="Sites" description="Manage your registered domains" />
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="size-8 animate-spin text-gray-400" />
        </div>
      </>
    );
  }

  return (
    <>
      <TitleBar
        title="Sites"
        description="Manage your registered domains"
      />

      {/* Add Site Button */}
      <div className="mb-6 flex justify-end">
        <Link
          href="/onboarding/add-site"
          className={`${buttonVariants({ variant: 'default' })} gap-2`}
        >
          <Plus className="size-4" />
          Add Site
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      {sites.length === 0
        ? (
            <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center dark:border-gray-700 dark:bg-gray-800/50">
              <Globe className="mx-auto mb-4 size-12 text-gray-400" />
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Start Tracking AI Crawler Visits</h3>
              <p className="mx-auto mb-8 max-w-md text-gray-500 dark:text-gray-400">
                Add your first website to see which AI bots are visiting, how often, and which pages they access.
              </p>

              <div className="mx-auto mb-8 grid max-w-lg gap-4 text-left sm:grid-cols-3">
                <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                  <div className="mb-2 flex size-8 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">1</div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Add your domain</p>
                  <p className="mt-1 text-xs text-gray-500">Register the site you want to track</p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                  <div className="mb-2 flex size-8 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">2</div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Add a snippet</p>
                  <p className="mt-1 text-xs text-gray-500">~5 lines of middleware or a script tag</p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                  <div className="mb-2 flex size-8 items-center justify-center rounded-full bg-green-100 text-sm font-semibold text-green-600">3</div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">See visits</p>
                  <p className="mt-1 text-xs text-gray-500">AI bot analytics in real time</p>
                </div>
              </div>

              <Link href="/onboarding/add-site" className={buttonVariants({ variant: 'default' })}>
                <Plus className="mr-2 size-4" />
                Add Your First Site
              </Link>
            </div>
          )
        : (
            <>
              {/* Integration pending banner (E3-T6) */}
              {sites.every(s => !s.last_beacon_at) && (
                <div className="mb-6 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
                  <div>
                    <p className="font-medium text-amber-800 dark:text-amber-300">Integration pending</p>
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      No beacons received yet. Complete your integration setup to start tracking AI crawlers.
                    </p>
                  </div>
                  <Link
                    href="/onboarding/integrate"
                    className={`${buttonVariants({ variant: 'outline', size: 'sm' })} shrink-0`}
                  >
                    Complete Setup
                  </Link>
                </div>
              )}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {sites.map(site => (
                  <SiteCard key={site.id} site={site} onDelete={handleDelete} />
                ))}
              </div>
            </>
          )}
    </>
  );
}
