'use client';

import { AlertTriangle, CheckCircle2, Clock, Globe, MoreVertical, Plus, RefreshCw, Settings, Trash2 } from 'lucide-react';
import Link from 'next/link';
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
  rendersCount: number;
  rendersThisMonth: number;
  lastRenderAt: string | null;
  lastCrawlerVisitAt: string | null;
  createdAt: string;
  apiKeyPrefix: string | null;
};

const statusConfig = {
  pending: { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/30', label: 'Pending' },
  active: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30', label: 'Active' },
  error: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30', label: 'Error' },
  suspended: { icon: AlertTriangle, color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-900/30', label: 'Suspended' },
};

function SiteCard({ site, onDelete }: { site: Site; onDelete: (id: string) => void }) {
  const [showMenu, setShowMenu] = useState(false);
  const status = statusConfig[site.status];
  const StatusIcon = status.icon;

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
    <div className="rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex size-10 items-center justify-center rounded-lg ${status.bg}`}>
            <Globe className={`size-5 ${status.color}`} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {site.displayName || site.domain}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{site.domain}</p>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          >
            <MoreVertical className="size-5" />
          </button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                <Link
                  href={`/dashboard/sites/${site.id}`}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <Settings className="size-4" />
                  Site Settings
                </Link>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    if (confirm('Are you sure you want to delete this site?')) {
                      onDelete(site.id);
                    }
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

      {/* Status */}
      <div className="mb-4 flex items-center gap-2">
        <div className={`flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ${status.bg} ${status.color}`}>
          <StatusIcon className="size-3" />
          {status.label}
        </div>
        {site.frameworkDetected && (
          <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            {site.frameworkDetected}
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 border-t border-gray-100 pt-4 text-center dark:border-gray-700">
        <div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">{site.rendersThisMonth}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Renders/Month</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">{timeAgo(site.lastRenderAt)}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Last Render</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">{timeAgo(site.lastCrawlerVisitAt)}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Last Crawler</p>
        </div>
      </div>

      {/* API Key */}
      {site.apiKeyPrefix && (
        <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            API Key:
            {' '}
            <code className="text-gray-700 dark:text-gray-300">
              {site.apiKeyPrefix}
              ...
            </code>
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        <Link
          href={`/dashboard/sites/${site.id}`}
          className={`${buttonVariants({ variant: 'outline', size: 'sm' })} flex-1`}
        >
          View Details
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
      const response = await fetch('/api/user/sites');
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
      const response = await fetch(`/api/user/sites/${siteId}`, { method: 'DELETE' });
      if (response.ok) {
        setSites(prev => prev.filter(s => s.id !== siteId));
      } else {
        alert('Failed to delete site');
      }
    } catch {
      alert('Failed to delete site');
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
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">No Sites Yet</h3>
              <p className="mx-auto mb-6 max-w-md text-gray-500 dark:text-gray-400">
                Add your first website to start making it visible to AI crawlers.
              </p>
              <Link href="/onboarding/add-site" className={buttonVariants({ variant: 'default' })}>
                Add Your First Site
              </Link>
            </div>
          )
        : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sites.map(site => (
                <SiteCard key={site.id} site={site} onDelete={handleDelete} />
              ))}
            </div>
          )}
    </>
  );
}
