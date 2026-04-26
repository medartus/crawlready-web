'use client';

import { Loader2, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { api } from '@/libs/api-client';

type ScanFormProps = {
  className?: string;
  size?: 'default' | 'hero';
};

export function ScanForm({ className = '', size = 'default' }: ScanFormProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

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
      setError('Please enter a valid URL');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/api/v1/scan', { url: fullUrl });
      const data = await response.json();

      if (!response.ok) {
        setError(data?.error?.message ?? 'Scan failed. Please try again.');
        setLoading(false);
        return;
      }

      sessionStorage.setItem('scanResult', JSON.stringify(data));
      router.push(`/score/${data.domain}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {!error && (
        <p className={`mt-2 text-center text-gray-500 dark:text-gray-400 ${isHero ? 'text-sm' : 'text-xs'}`}>
          Free scan — no signup required
        </p>
      )}
    </form>
  );
}
