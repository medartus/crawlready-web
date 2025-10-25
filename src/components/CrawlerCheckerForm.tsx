'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CrawlerCheckerFormProps {
  className?: string;
}

export function CrawlerCheckerForm({ className = '' }: CrawlerCheckerFormProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate URL
      if (!url) {
        setError('Please enter a URL');
        setLoading(false);
        return;
      }

      // Add https:// if no protocol specified
      let fullUrl = url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        fullUrl = `https://${url}`;
      }

      // Validate URL format
      try {
        new URL(fullUrl);
      }
      catch {
        setError('Please enter a valid URL');
        setLoading(false);
        return;
      }

      // Call API
      const response = await fetch('/api/check-crawler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: fullUrl }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to check URL');
        setLoading(false);
        return;
      }

      // Store result in sessionStorage and redirect to results
      sessionStorage.setItem('crawlerCheckResult', JSON.stringify(data.report));
      router.push(`/crawler-checker/results?url=${encodeURIComponent(fullUrl)}`);
    }
    catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`w-full max-w-2xl ${className}`}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="url" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Enter your website URL
          </label>
          <div className="flex gap-2">
            <input
              id="url"
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="example.com or https://example.com"
              className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Check Now'}
            </button>
          </div>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          Free tool • No signup required • Results in seconds
        </p>
      </div>
    </form>
  );
}
