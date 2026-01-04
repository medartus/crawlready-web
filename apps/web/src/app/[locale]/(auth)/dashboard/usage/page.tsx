'use client';

import { Activity, BarChart3, Clock, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * Usage Statistics Dashboard
 *
 * Displays:
 * - Total renders and cache statistics
 * - Cache hit rate
 * - Average render time
 * - Daily usage trends
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

export default function UsagePage() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      setIsLoading(true);
      const response = await fetch('/api/user/usage');

      if (!response.ok) {
        throw new Error('Failed to fetch usage statistics');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load statistics',
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mx-auto mb-4 size-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          <p className="text-gray-600">Loading usage statistics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const totalRequests = stats.totalCacheHits + stats.totalCacheMisses;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Usage Statistics</h1>
        <p className="mt-2 text-gray-600">
          Monitor your CrawlReady API usage and performance
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Renders */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Renders</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {stats.totalRenders.toLocaleString()}
              </p>
            </div>
            <div className="rounded-full bg-blue-100 p-3">
              <Activity className="size-6 text-blue-600" />
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-600">
            {stats.last24Hours.renders}
            {' '}
            in last 24 hours
          </p>
        </div>

        {/* Cache Hit Rate */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Cache Hit Rate</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {stats.cacheHitRate.toFixed(1)}
                %
              </p>
            </div>
            <div className="rounded-full bg-green-100 p-3">
              <TrendingUp className="size-6 text-green-600" />
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-600">
            {stats.totalCacheHits.toLocaleString()}
            {' '}
            hits /
            {totalRequests.toLocaleString()}
            {' '}
            total
          </p>
        </div>

        {/* Average Render Time */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Render Time</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {stats.averageRenderTime.toLocaleString()}
                ms
              </p>
            </div>
            <div className="rounded-full bg-purple-100 p-3">
              <Clock className="size-6 text-purple-600" />
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-600">Completed renders only</p>
        </div>

        {/* Total Requests */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Requests</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {totalRequests.toLocaleString()}
              </p>
            </div>
            <div className="rounded-full bg-orange-100 p-3">
              <BarChart3 className="size-6 text-orange-600" />
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-600">
            {(
              stats.last24Hours.cacheHits + stats.last24Hours.cacheMisses
            ).toLocaleString()}
            {' '}
            in last 24 hours
          </p>
        </div>
      </div>

      {/* Daily Stats Table */}
      {stats.dailyStats.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900">Last 7 Days</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Total Requests
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
                  const dayTotal = day.cacheHits + day.cacheMisses;
                  const dayHitRate
                    = dayTotal > 0 ? (day.cacheHits / dayTotal) * 100 : 0;

                  return (
                    <tr key={day.date} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {new Date(day.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {dayTotal.toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-green-600">
                        {day.cacheHits.toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-orange-600">
                        {day.cacheMisses.toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {dayHitRate.toFixed(1)}
                        %
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Simple Bar Chart Visualization */}
      {stats.dailyStats.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-6 text-lg font-semibold text-gray-900">
            Daily Requests
          </h2>
          <div className="space-y-4">
            {stats.dailyStats.map((day) => {
              const dayTotal = day.cacheHits + day.cacheMisses;
              const maxValue = Math.max(
                ...stats.dailyStats.map(d => d.cacheHits + d.cacheMisses),
              );
              const barWidth = maxValue > 0 ? (dayTotal / maxValue) * 100 : 0;

              return (
                <div key={day.date} className="flex items-center gap-4">
                  <div className="w-24 text-sm text-gray-600">
                    {new Date(day.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                  <div className="flex-1">
                    <div className="relative h-8 w-full rounded bg-gray-100">
                      <div
                        className="h-full rounded bg-gradient-to-r from-blue-500 to-blue-600 transition-all"
                        style={{ width: `${barWidth}%` }}
                      />
                      <span className="absolute inset-0 flex items-center px-3 text-sm font-medium text-gray-900">
                        {dayTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {stats.totalRenders === 0 && (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <BarChart3 className="mx-auto size-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            No usage data yet
          </h3>
          <p className="mt-2 text-gray-600">
            Start making render requests to see your usage statistics here
          </p>
        </div>
      )}
    </div>
  );
}
