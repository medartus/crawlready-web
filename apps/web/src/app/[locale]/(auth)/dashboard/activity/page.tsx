'use client';

import { Download, Filter, RefreshCw, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

import { buttonVariants } from '@/components/ui/buttonVariants';
import { TitleBar } from '@/features/dashboard/TitleBar';

type ActivityItem = {
  id: string;
  type: 'crawler_visit' | 'render' | 'cache_hit' | 'cache_miss' | 'error';
  crawlerName: string | null;
  crawlerType: 'search' | 'ai' | 'social' | 'monitoring' | 'unknown' | 'direct' | null;
  url: string;
  siteId: string | null;
  siteDomain: string | null;
  responseTimeMs: number | null;
  timestamp: string;
  status: 'success' | 'error';
  errorMessage: string | null;
};

const crawlerIcons: Record<string, string> = {
  search: '🔍',
  ai: '🤖',
  social: '📱',
  monitoring: '📊',
  unknown: '❓',
  direct: '—',
};

const typeStyles: Record<string, { bg: string; text: string }> = {
  crawler_visit: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300' },
  render: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' },
  cache_hit: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300' },
  cache_miss: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300' },
  error: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300' },
};

function ActivityRow({ item }: { item: ActivityItem }) {
  const style = typeStyles[item.type] || typeStyles.cache_miss;
  const icon = item.crawlerType ? crawlerIcons[item.crawlerType] : crawlerIcons.direct;

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) {
      return 'Just now';
    }
    if (minutes < 60) {
      return `${minutes}m ago`;
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours}h ago`;
    }
    return date.toLocaleDateString();
  };

  const typeLabels: Record<string, string> = {
    crawler_visit: 'Crawler Visit',
    render: 'Page Rendered',
    cache_hit: 'Cache Hit',
    cache_miss: 'Cache Miss',
    error: 'Error',
  };

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50">
      <td className="p-4">
        <div className="flex items-center gap-3">
          <span className="text-lg">{icon}</span>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              {item.crawlerName || 'Direct API'}
            </p>
            <p className="text-xs capitalize text-gray-500 dark:text-gray-400">
              {item.crawlerType || 'api'}
            </p>
          </div>
        </div>
      </td>
      <td className="p-4">
        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${style.bg} ${style.text}`}>
          {typeLabels[item.type] || item.type}
        </span>
      </td>
      <td className="p-4">
        <p className="max-w-xs truncate text-sm text-gray-900 dark:text-white" title={item.url}>
          {item.url}
        </p>
        {item.siteDomain && (
          <p className="text-xs text-gray-500 dark:text-gray-400">{item.siteDomain}</p>
        )}
      </td>
      <td className="p-4 text-center">
        {item.responseTimeMs !== null
          ? (
              <span className={`text-sm ${item.responseTimeMs < 200 ? 'text-green-600' : item.responseTimeMs < 500 ? 'text-yellow-600' : 'text-red-600'}`}>
                {item.responseTimeMs}
                ms
              </span>
            )
          : (
              <span className="text-gray-400">—</span>
            )}
      </td>
      <td className="p-4 text-right text-sm text-gray-500 dark:text-gray-400">
        {formatTime(item.timestamp)}
      </td>
    </tr>
  );
}

export default function ActivityPage() {
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<{
    crawlerType: string;
    type: string;
    search: string;
  }>({
    crawlerType: 'all',
    type: 'all',
    search: '',
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchActivity = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '50',
      });

      if (filter.crawlerType !== 'all') {
        params.set('crawlerType', filter.crawlerType);
      }
      if (filter.type !== 'all') {
        params.set('type', filter.type);
      }
      if (filter.search) {
        params.set('search', filter.search);
      }

      const response = await fetch(`/api/user/activity?${params}`);
      if (response.ok) {
        const data = await response.json();
        setActivity(data.activity || []);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch {
      // Handle error silently
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filter.crawlerType, filter.type]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (filter.search !== '') {
        fetchActivity();
      }
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter.search]);

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const params = new URLSearchParams({ format });
      if (filter.crawlerType !== 'all') {
        params.set('crawlerType', filter.crawlerType);
      }
      if (filter.type !== 'all') {
        params.set('type', filter.type);
      }

      const response = await fetch(`/api/user/activity/export?${params}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `crawlready-activity.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch {
      // Export failed silently
    }
  };

  return (
    <>
      <TitleBar
        title="Crawler Activity"
        description="Real-time feed of AI crawler visits and renders"
      />

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search URLs..."
              value={filter.search}
              onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
              className="rounded-lg border border-gray-200 py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
            />
          </div>

          {/* Crawler Type Filter */}
          <select
            value={filter.crawlerType}
            onChange={e => setFilter(f => ({ ...f, crawlerType: e.target.value }))}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
          >
            <option value="all">All Crawlers</option>
            <option value="ai">🤖 AI Crawlers</option>
            <option value="search">🔍 Search Engines</option>
            <option value="social">📱 Social</option>
            <option value="monitoring">📊 Monitoring</option>
            <option value="direct">— Direct API</option>
          </select>

          {/* Activity Type Filter */}
          <select
            value={filter.type}
            onChange={e => setFilter(f => ({ ...f, type: e.target.value }))}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
          >
            <option value="all">All Activity</option>
            <option value="crawler_visit">Crawler Visits</option>
            <option value="render">Renders</option>
            <option value="cache_hit">Cache Hits</option>
            <option value="cache_miss">Cache Misses</option>
            <option value="error">Errors</option>
          </select>

          {/* Clear Filters */}
          {(filter.crawlerType !== 'all' || filter.type !== 'all' || filter.search) && (
            <button
              type="button"
              onClick={() => setFilter({ crawlerType: 'all', type: 'all', search: '' })}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fetchActivity()}
            disabled={isLoading}
            className={`${buttonVariants({ variant: 'outline', size: 'sm' })} gap-2`}
          >
            <RefreshCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <div className="group relative">
            <button type="button" className={`${buttonVariants({ variant: 'outline', size: 'sm' })} gap-2`}>
              <Download className="size-4" />
              Export
            </button>
            <div className="absolute right-0 top-full z-10 mt-1 hidden w-32 rounded-lg border border-gray-200 bg-white py-1 shadow-lg group-hover:block dark:border-gray-700 dark:bg-gray-800">
              <button
                type="button"
                onClick={() => handleExport('csv')}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Export CSV
              </button>
              <button
                type="button"
                onClick={() => handleExport('json')}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Export JSON
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        {isLoading
          ? (
              <div className="flex items-center justify-center py-20">
                <RefreshCw className="size-8 animate-spin text-gray-400" />
              </div>
            )
          : activity.length === 0
            ? (
                <div className="py-20 text-center">
                  <Filter className="mx-auto mb-4 size-12 text-gray-300 dark:text-gray-600" />
                  <p className="text-gray-500 dark:text-gray-400">No activity found</p>
                  <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
                    Activity will appear here when crawlers visit your sites
                  </p>
                </div>
              )
            : (
                <>
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Crawler
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          URL
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Response
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Time
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {activity.map(item => (
                        <ActivityRow key={item.id} item={item} />
                      ))}
                    </tbody>
                  </table>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 dark:border-gray-700">
                      <button
                        type="button"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:cursor-not-allowed disabled:text-gray-300 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Page
                        {' '}
                        {page}
                        {' '}
                        of
                        {' '}
                        {totalPages}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:cursor-not-allowed disabled:text-gray-300 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
      </div>
    </>
  );
}
