'use client';

import { ExternalLink, FileText, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * Rendered Pages Browser
 *
 * Allows users to:
 * - View all their rendered pages
 * - Search and filter pages
 * - View page details
 * - Invalidate cached pages
 */

type RenderedPage = {
  id: string;
  url: string;
  size: number;
  firstRendered: string;
  lastAccessed: string;
  accessCount: number;
  storageLocation: string;
};

export default function PagesPage() {
  const [pages, setPages] = useState<RenderedPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPages();
  }, []);

  async function fetchPages() {
    try {
      setIsLoading(true);
      const response = await fetch('/api/user/pages');

      if (!response.ok) {
        throw new Error('Failed to fetch rendered pages');
      }

      const data = await response.json();
      setPages(data.pages || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pages');
    } finally {
      setIsLoading(false);
    }
  }

  async function invalidatePage(pageId: string, url: string) {
    if (
      // eslint-disable-next-line no-alert
      !window.confirm(
        `Are you sure you want to invalidate the cache for:\n${url}\n\nThe page will be re-rendered on the next request.`,
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/user/pages/${pageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to invalidate page');
      }

      // Refresh pages list
      await fetchPages();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to invalidate page',
      );
    }
  }

  function formatBytes(bytes: number): string {
    if (bytes === 0) {
      return '0 Bytes';
    }
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / k ** i).toFixed(2)} ${sizes[i]}`;
  }

  function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays}d ago`;
    }
    if (diffHours > 0) {
      return `${diffHours}h ago`;
    }
    if (diffMins > 0) {
      return `${diffMins}m ago`;
    }
    return 'Just now';
  }

  // Filter pages based on search term
  const filteredPages = pages.filter(page =>
    page.url.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mx-auto mb-4 size-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          <p className="text-gray-600">Loading rendered pages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Rendered Pages</h1>
        <p className="mt-2 text-gray-600">
          Browse and manage your cached pages
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Search Bar */}
      {pages.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search pages by URL..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Statistics */}
      {pages.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-600">Total Pages</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {pages.length}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-600">Total Size</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {formatBytes(pages.reduce((sum, p) => sum + p.size, 0))}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-600">Total Accesses</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {pages
                .reduce((sum, p) => sum + p.accessCount, 0)
                .toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Pages List */}
      {filteredPages.length === 0 && pages.length > 0
        ? (
            <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
              <Search className="mx-auto size-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                No pages found
              </h3>
              <p className="mt-2 text-gray-600">Try adjusting your search term</p>
            </div>
          )
        : filteredPages.length > 0
          ? (
              <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          URL
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Size
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Accesses
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          First Rendered
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Last Accessed
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {filteredPages.map(page => (
                        <tr key={page.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <FileText className="size-4 shrink-0 text-gray-400" />
                              <div className="min-w-0 flex-1">
                                <a
                                  href={page.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 truncate text-sm text-blue-600 hover:text-blue-800"
                                >
                                  {page.url}
                                  <ExternalLink className="size-3 shrink-0" />
                                </a>
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                            {formatBytes(page.size)}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                            {page.accessCount.toLocaleString()}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                            {formatRelativeTime(page.firstRendered)}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                            {formatRelativeTime(page.lastAccessed)}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm">
                            <button
                              type="button"
                              onClick={() => invalidatePage(page.id, page.url)}
                              className="rounded p-1 text-red-600 hover:bg-red-50"
                              title="Invalidate cache"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          : (
              <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
                <FileText className="mx-auto size-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  No pages rendered yet
                </h3>
                <p className="mt-2 text-gray-600">
                  Start making render requests to see your cached pages here
                </p>
                <div className="mt-6">
                  <code className="inline-block rounded bg-gray-100 px-4 py-2 text-sm">
                    POST /api/render
                  </code>
                </div>
              </div>
            )}

      {/* Showing Results Count */}
      {pages.length > 0 && (
        <p className="text-sm text-gray-600">
          Showing
          {' '}
          {filteredPages.length}
          {' '}
          of
          {' '}
          {pages.length}
          {' '}
          pages
          {pages.length >= 100 && ' (most recent 100)'}
        </p>
      )}
    </div>
  );
}
