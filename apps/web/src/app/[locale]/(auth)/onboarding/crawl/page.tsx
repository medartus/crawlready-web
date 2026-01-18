'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

type SitemapPage = {
  url: string;
  priority?: number;
  lastmod?: string;
};

type RenderJob = {
  id: string;
  url: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
};

// Tier limits for onboarding
const TIER_LIMITS = {
  free: 5,
  pro: 50,
  enterprise: 500,
} as const;

type Tier = keyof typeof TIER_LIMITS;

export default function CrawlPage() {
  const router = useRouter();

  // State from previous step
  const [domain, setDomain] = useState<string>('');

  // Sitemap discovery state
  const [sitemapUrl, setSitemapUrl] = useState('');
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryError, setDiscoveryError] = useState('');

  // Page selection state
  const [pages, setPages] = useState<SitemapPage[]>([]);
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [tier] = useState<Tier>('free'); // TODO: Get from user context
  const [filterText, setFilterText] = useState('');

  // Rendering state
  const [isRendering, setIsRendering] = useState(false);
  const [jobs, setJobs] = useState<RenderJob[]>([]);
  const [siteId, setSiteId] = useState<string | null>(null);
  const [_apiKey, setApiKey] = useState<string | null>(null);
  const [renderError, setRenderError] = useState('');

  // Polling ref
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const maxPages = TIER_LIMITS[tier];

  const handleDiscoverSitemap = async (targetDomain?: string) => {
    const domainToUse = targetDomain || domain;
    if (!domainToUse) {
      return;
    }

    setIsDiscovering(true);
    setDiscoveryError('');

    try {
      const response = await fetch('/api/onboarding/parse-sitemap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: domainToUse,
          sitemapUrl: sitemapUrl || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to parse sitemap');
      }

      setPages(data.pages || []);
      if (data.sitemapUrl) {
        setSitemapUrl(data.sitemapUrl);
      }

      // Auto-select top pages up to limit
      const initialSelection = new Set<string>();
      data.pages.slice(0, maxPages).forEach((page: SitemapPage) => {
        initialSelection.add(page.url);
      });
      setSelectedUrls(initialSelection);
    } catch (err) {
      setDiscoveryError(err instanceof Error ? err.message : 'Failed to discover sitemap');
      // Fall back to homepage only
      const homepageUrl = `https://${domainToUse}/`;
      setPages([{ url: homepageUrl, priority: 1.0 }]);
      setSelectedUrls(new Set([homepageUrl]));
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleParseSitemap = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleDiscoverSitemap();
  };

  const togglePageSelection = (url: string) => {
    setSelectedUrls((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(url)) {
        newSet.delete(url);
      } else if (newSet.size < maxPages) {
        newSet.add(url);
      }
      return newSet;
    });
  };

  const selectTopPages = () => {
    const newSelection = new Set<string>();
    pages.slice(0, maxPages).forEach((page) => {
      newSelection.add(page.url);
    });
    setSelectedUrls(newSelection);
  };

  const pollJobStatus = useCallback(async (jobIds: string[]) => {
    try {
      const response = await fetch(`/api/onboarding/crawl-status?jobIds=${jobIds.join(',')}`);
      const data = await response.json();

      if (response.ok && data.jobs) {
        setJobs(data.jobs);

        // Check if all jobs are complete
        if (data.allCompleted) {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        }
      }
    } catch {
      // Ignore polling errors
    }
  }, []);

  const handleStartRendering = async () => {
    if (selectedUrls.size === 0) {
      return;
    }

    setIsRendering(true);
    setRenderError('');

    try {
      const response = await fetch('/api/onboarding/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain,
          urls: Array.from(selectedUrls),
          siteId: siteId || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start rendering');
      }

      // Store site ID and API key for next step
      setSiteId(data.siteId);
      if (data.apiKey) {
        setApiKey(data.apiKey);
        sessionStorage.setItem('onboarding_api_key', data.apiKey);
      }
      sessionStorage.setItem('onboarding_site_id', data.siteId);

      // Set initial job states
      setJobs(data.jobs);

      // Start polling for job status
      const jobIds = data.jobs.map((j: { jobId: string }) => j.jobId);
      pollingRef.current = setInterval(() => pollJobStatus(jobIds), 2000);
    } catch (err) {
      setRenderError(err instanceof Error ? err.message : 'Failed to start rendering');
      setIsRendering(false);
    }
  };

  const handleContinue = () => {
    router.push('/onboarding/integrate');
  };

  const handleSkip = () => {
    // Store that user skipped - just go to integrate
    sessionStorage.setItem('onboarding_skipped_crawl', 'true');
    router.push('/onboarding/integrate');
  };

  // Load domain from session storage
  useEffect(() => {
    const storedDomain = sessionStorage.getItem('onboarding_domain');
    if (!storedDomain) {
      router.push('/onboarding/add-site');
      return;
    }
    setDomain(storedDomain);

    // Auto-discover sitemap
    handleDiscoverSitemap(storedDomain);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // Filter pages based on search
  const filteredPages = filterText
    ? pages.filter(p => p.url.toLowerCase().includes(filterText.toLowerCase()))
    : pages;

  // Calculate completion stats
  const completedCount = jobs.filter(j => j.status === 'completed').length;
  const failedCount = jobs.filter(j => j.status === 'failed').length;
  const inProgressCount = jobs.filter(j => j.status === 'queued' || j.status === 'processing').length;
  const allDone = isRendering && jobs.length > 0 && inProgressCount === 0;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-green-100">
          <svg className="size-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-gray-900">Pre-Cache Your Pages</h2>
        <p className="mt-2 text-gray-600">
          Select pages to pre-render. When you integrate, AI crawlers get instant responses.
        </p>
      </div>

      {/* Sitemap Discovery */}
      {!isRendering && (
        <div className="mb-6">
          <form onSubmit={handleParseSitemap} className="flex gap-2">
            <div className="flex-1">
              <label htmlFor="sitemap" className="sr-only">
                Sitemap URL
              </label>
              <input
                type="text"
                id="sitemap"
                value={sitemapUrl}
                onChange={e => setSitemapUrl(e.target.value)}
                placeholder={`https://${domain}/sitemap.xml`}
                className="block w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={isDiscovering}
              />
            </div>
            <button
              type="submit"
              disabled={isDiscovering}
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
            >
              {isDiscovering ? 'Loading...' : 'Parse Sitemap'}
            </button>
          </form>
          {discoveryError && (
            <p className="mt-2 text-sm text-amber-600">{discoveryError}</p>
          )}
        </div>
      )}

      {/* Page Selection */}
      {!isRendering && pages.length > 0 && (
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Filter pages..."
                value={filterText}
                onChange={e => setFilterText(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={selectTopPages}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Select top
                {' '}
                {maxPages}
              </button>
            </div>
            <span className={`text-sm font-medium ${selectedUrls.size >= maxPages ? 'text-amber-600' : 'text-gray-600'}`}>
              {selectedUrls.size}
              /
              {maxPages}
              {' '}
              selected
              {selectedUrls.size >= maxPages && ` (${tier} tier limit)`}
            </span>
          </div>

          <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200">
            {filteredPages.length === 0
              ? (
                  <p className="p-4 text-center text-sm text-gray-500">No pages match your filter</p>
                )
              : (
                  filteredPages.map(page => (
                    <label
                      key={page.url}
                      className={`flex cursor-pointer items-center gap-3 border-b border-gray-100 px-4 py-2.5 last:border-0 hover:bg-gray-50 ${
                        selectedUrls.has(page.url) ? 'bg-blue-50' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedUrls.has(page.url)}
                        onChange={() => togglePageSelection(page.url)}
                        disabled={!selectedUrls.has(page.url) && selectedUrls.size >= maxPages}
                        className="size-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                      />
                      <span className="min-w-0 flex-1 truncate text-sm text-gray-700">
                        {page.url.replace(/^https?:\/\//, '')}
                      </span>
                      {page.priority !== undefined && (
                        <span className="text-xs text-gray-400">
                          {page.priority.toFixed(1)}
                        </span>
                      )}
                    </label>
                  ))
                )}
          </div>

          {selectedUrls.size >= maxPages && tier === 'free' && (
            <p className="mt-2 text-sm text-gray-500">
              Upgrade to Pro for up to 50 pages during onboarding.
            </p>
          )}
        </div>
      )}

      {/* Render Progress */}
      {isRendering && (
        <div className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Rendering Progress</h3>
            <span className="text-sm text-gray-600">
              {completedCount}
              {' '}
              of
              {jobs.length}
              {' '}
              complete
            </span>
          </div>

          <div className="mb-4 h-2 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${jobs.length > 0 ? (completedCount / jobs.length) * 100 : 0}%` }}
            />
          </div>

          <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200">
            {jobs.map(job => (
              <div
                key={job.id}
                className="flex items-center gap-3 border-b border-gray-100 px-4 py-2.5 last:border-0"
              >
                {job.status === 'completed' && (
                  <svg className="size-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {job.status === 'failed' && (
                  <svg className="size-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                {(job.status === 'queued' || job.status === 'processing') && (
                  <svg className="size-5 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                )}
                <span className="min-w-0 flex-1 truncate text-sm text-gray-700">
                  {job.url.replace(/^https?:\/\//, '')}
                </span>
                <span className={`text-xs capitalize ${
                  job.status === 'completed'
                    ? 'text-green-600'
                    : job.status === 'failed'
                      ? 'text-red-600'
                      : 'text-blue-600'
                }`}
                >
                  {job.status}
                </span>
              </div>
            ))}
          </div>

          {failedCount > 0 && (
            <p className="mt-2 text-sm text-amber-600">
              {failedCount}
              {' '}
              page
              {failedCount > 1 ? 's' : ''}
              {' '}
              failed to render. You can retry from the dashboard.
            </p>
          )}
        </div>
      )}

      {/* Success Message */}
      {allDone && completedCount > 0 && (
        <div className="mb-6 rounded-lg bg-green-50 p-4">
          <div className="flex items-start gap-3">
            <svg className="mt-0.5 size-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="font-medium text-green-800">Pages Pre-Cached!</h4>
              <p className="mt-1 text-sm text-green-700">
                {completedCount}
                {' '}
                page
                {completedCount > 1 ? 's are' : ' is'}
                {' '}
                now cached and ready for AI crawlers.
                When you integrate, these pages will be served in &lt;200ms.
              </p>
            </div>
          </div>
        </div>
      )}

      {renderError && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {renderError}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {!isRendering && (
          <>
            <button
              type="button"
              onClick={handleSkip}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-3 font-medium text-gray-700 hover:bg-gray-50"
            >
              Skip for Now
            </button>
            <button
              type="button"
              onClick={handleStartRendering}
              disabled={selectedUrls.size === 0 || isDiscovering}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Pre-Cache
              {' '}
              {selectedUrls.size}
              {' '}
              Page
              {selectedUrls.size !== 1 ? 's' : ''}
            </button>
          </>
        )}

        {isRendering && !allDone && (
          <button
            type="button"
            disabled
            className="w-full cursor-not-allowed rounded-lg bg-gray-100 px-4 py-3 font-medium text-gray-500"
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="size-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Rendering Pages...
            </span>
          </button>
        )}

        {allDone && (
          <button
            type="button"
            onClick={handleContinue}
            className="w-full rounded-lg bg-green-600 px-4 py-3 font-medium text-white hover:bg-green-700"
          >
            Continue to Integration
          </button>
        )}
      </div>

      {/* Info footer */}
      <div className="mt-6 border-t border-gray-200 pt-4">
        <p className="text-center text-sm text-gray-500">
          {!isRendering
            ? 'Selected pages will be pre-rendered and cached for instant AI crawler responses.'
            : allDone
              ? 'Your pages are ready! Continue to integrate CrawlReady with your site.'
              : 'This may take a few moments depending on your page complexity.'}
        </p>
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';
