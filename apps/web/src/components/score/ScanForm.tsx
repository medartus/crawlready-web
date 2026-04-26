'use client';

import { AlertCircle, Loader2, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { api } from '@/libs/api-client';

const PROGRESS_MESSAGES = [
  'Connecting to site...',
  'Rendering page with JavaScript...',
  'Fetching bot view (GPTBot)...',
  'Checking content negotiation...',
  'Analyzing crawlability...',
  'Scoring agent readiness...',
  'Computing AI Readiness Score...',
  'Almost done...',
];

type ScanFormProps = {
  className?: string;
  size?: 'default' | 'hero';
};

function getErrorMessage(data: { error?: { code?: string; message?: string; retry_after?: number } }): string {
  const code = data?.error?.code;
  switch (code) {
    case 'RATE_LIMITED': {
      const retry = data?.error?.retry_after;
      return retry
        ? `Rate limited. Try again in ${Math.ceil(retry / 60)} minute(s).`
        : 'Too many scans. Please wait a few minutes.';
    }
    case 'INVALID_URL':
      return 'Invalid URL. Please check the address and try again.';
    case 'BLOCKED_URL':
      return 'This URL cannot be scanned for security reasons.';
    case 'PROVIDER_ERROR':
      return 'The site could not be reached or timed out. Please try again.';
    default:
      return data?.error?.message ?? 'Scan failed. Please try again.';
  }
}

export function ScanForm({ className = '', size = 'default' }: ScanFormProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progressIdx, setProgressIdx] = useState(0);
  const [rateLimitInfo, setRateLimitInfo] = useState<{ remaining: number; limit: number } | null>(null);
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (loading) {
      setProgressIdx(0);
      timerRef.current = setInterval(() => {
        setProgressIdx(prev =>
          prev < PROGRESS_MESSAGES.length - 1 ? prev + 1 : prev,
        );
      }, 2000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    let fullUrl = url.trim();
    if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
      fullUrl = `https://${fullUrl}`;
    }

    try {
      // eslint-disable-next-line no-new
      new URL(fullUrl);
    } catch {
      setError('Please enter a valid URL (e.g. example.com)');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/api/v1/scan', { url: fullUrl });
      const data = await response.json();

      if (!response.ok) {
        setError(getErrorMessage(data));
        setLoading(false);
        return;
      }

      // Read rate limit headers
      const remaining = response.headers.get('X-RateLimit-Remaining');
      const limit = response.headers.get('X-RateLimit-Limit');
      if (remaining !== null && limit !== null) {
        setRateLimitInfo({ remaining: Number(remaining), limit: Number(limit) });
      }

      sessionStorage.setItem('scanResult', JSON.stringify(data));
      router.push(`/scan/${data.id}`);
    } catch {
      setError('Network error. Check your connection and try again.');
      setLoading(false);
    }
  };

  const isHero = size === 'hero';

  return (
    <form onSubmit={handleSubmit} className={`w-full ${className}`}>
      <div className={`flex ${isHero ? 'flex-col sm:flex-row' : 'flex-row'} gap-3`}>
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="example.com"
            disabled={loading}
            className={`w-full rounded-xl border border-gray-300 bg-white pl-12 pr-4 text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white ${
              isHero ? 'py-4 text-lg' : 'py-3 text-base'
            }`}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className={`inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 font-semibold text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 ${
            isHero ? 'px-8 py-4 text-lg' : 'px-6 py-3 text-base'
          }`}
        >
          {loading
            ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  Scanning...
                </>
              )
            : 'Scan Now'}
        </button>
      </div>

      {/* Progressive loading message */}
      {loading && (
        <div className="mt-3 flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-indigo-100 dark:bg-indigo-900/30">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-1000 ease-out"
              style={{ width: `${Math.min(((progressIdx + 1) / PROGRESS_MESSAGES.length) * 100, 95)}%` }}
            />
          </div>
          <span className="shrink-0 transition-opacity duration-300">
            {PROGRESS_MESSAGES[progressIdx]}
          </span>
        </div>
      )}

      {/* Error display */}
      {error && !loading && (
        <div className="mt-2 flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Helper text */}
      {!error && !loading && (
        <p className={`mt-2 text-center text-gray-500 dark:text-gray-400 ${isHero ? 'text-sm' : 'text-xs'}`}>
          {rateLimitInfo !== null
            ? `Free scan — ${rateLimitInfo.remaining} of ${rateLimitInfo.limit} scans remaining this hour`
            : 'Free scan — no signup required'}
        </p>
      )}
    </form>
  );
}
