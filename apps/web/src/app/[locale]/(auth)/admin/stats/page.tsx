'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

/**
 * Admin Usage Stats Dashboard
 *
 * Shows aggregate usage statistics:
 * - Total renders
 * - Cache hit rates
 * - Daily usage trends
 * - Top customers
 */

type UsageStats = {
  totalRenders: number;
  totalCacheHits: number;
  totalCacheMisses: number;
  cacheHitRate: number;
  averageRenderTime: number;
  last24Hours: {
    renders: number;
    cacheHits: number;
    cacheMisses: number;
  };
  dailyStats: Array<{
    date: string;
    renders: number;
    cacheHits: number;
    cacheMisses: number;
  }>;
};

export default function AdminStatsPage() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/stats');
      if (!response.ok) {
        throw new Error('Failed to load stats');
      }
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
        <div className="text-center">
          <div className="mx-auto size-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading stats...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-md border border-red-200 bg-red-50 p-4">
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Usage Statistics</h1>
          <p className="mt-2 text-sm text-gray-600">
            Monitor platform usage and performance
          </p>
        </div>

        {/* Navigation */}
        <div className="mb-8 flex gap-4">
          <Link
            href="/admin"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            API Keys
          </Link>
          <Link
            href="/admin/stats"
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Usage Stats
          </Link>
        </div>

        {stats && (
          <>
            {/* Overview Cards */}
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg bg-white p-6 shadow">
                <p className="text-sm font-medium text-gray-600">Total Renders</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {stats.totalRenders.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Last 24h:
                  {' '}
                  {stats.last24Hours.renders.toLocaleString()}
                </p>
              </div>

              <div className="rounded-lg bg-white p-6 shadow">
                <p className="text-sm font-medium text-gray-600">Cache Hit Rate</p>
                <p className="mt-2 text-3xl font-bold text-green-600">
                  {stats.cacheHitRate.toFixed(1)}
                  %
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {stats.totalCacheHits.toLocaleString()}
                  {' '}
                  hits
                </p>
              </div>

              <div className="rounded-lg bg-white p-6 shadow">
                <p className="text-sm font-medium text-gray-600">Cache Misses</p>
                <p className="mt-2 text-3xl font-bold text-orange-600">
                  {stats.totalCacheMisses.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Last 24h:
                  {' '}
                  {stats.last24Hours.cacheMisses.toLocaleString()}
                </p>
              </div>

              <div className="rounded-lg bg-white p-6 shadow">
                <p className="text-sm font-medium text-gray-600">Avg Render Time</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {stats.averageRenderTime.toFixed(0)}
                  ms
                </p>
                <p className="mt-1 text-xs text-gray-500">Per page</p>
              </div>
            </div>

            {/* Daily Stats Table */}
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Daily Usage (Last 7 Days)</h2>
                <button
                  type="button"
                  onClick={loadStats}
                  className="rounded-md bg-gray-100 px-3 py-1 text-sm text-gray-700 hover:bg-gray-200"
                >
                  Refresh
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Total Renders
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Cache Hits
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Cache Misses
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Hit Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {stats.dailyStats.map((day) => {
                      const hitRate
                        = day.renders > 0 ? ((day.cacheHits / day.renders) * 100).toFixed(1) : '0.0';
                      return (
                        <tr key={day.date}>
                          <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                            {new Date(day.date).toLocaleDateString()}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                            {day.renders.toLocaleString()}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-green-600">
                            {day.cacheHits.toLocaleString()}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-orange-600">
                            {day.cacheMisses.toLocaleString()}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                            {hitRate}
                            %
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
