'use client';

import { ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { ScanForm } from '@/components/score/ScanForm';
import { ScanResultCard } from '@/components/score/ScanResultCard';
import { api } from '@/libs/api-client';

type ScanResultData = {
  url: string;
  domain: string;
  aiReadinessScore: number;
  crawlabilityScore: number;
  agentReadinessScore: number;
  agentInteractionScore: number;
  euAiAct: {
    passed: number;
    total: number;
    checks: Array<{ name: string; passed: boolean }>;
  };
  recommendations: Array<{
    id: string;
    severity: string;
    category: string;
    title: string;
    description: string;
    impact: string;
  }>;
  scannedAt: string;
  score_url?: string;
};

export default function ScoreResultPage() {
  const params = useParams<{ domain: string }>();
  const domain = params.domain;
  const [result, setResult] = useState<ScanResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const cached = sessionStorage.getItem('scanResult');
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as ScanResultData;
        if (parsed.domain === domain) {
          setResult(parsed);
          setLoading(false);
          return;
        }
      } catch {
        // ignore parse errors
      }
    }

    fetchScore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domain]);

  async function fetchScore() {
    setLoading(true);
    setError('');

    try {
      const response = await api.get(`/api/v1/score/${encodeURIComponent(domain)}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data?.error?.message ?? 'Score not found. Try scanning first.');
        setLoading(false);
        return;
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load score');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between p-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
          >
            <ArrowLeft className="size-4" />
            Back
          </Link>
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            CrawlReady
          </span>
          {result && (
            <button
              type="button"
              onClick={fetchScore}
              className="inline-flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
            >
              <RefreshCw className="size-4" />
              Rescan
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="mb-4 size-12 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
            <p className="text-gray-600 dark:text-gray-400">
              Loading score for
              {' '}
              <span className="font-mono font-semibold">{domain}</span>
              ...
            </p>
          </div>
        )}

        {error && !loading && (
          <div className="mx-auto max-w-lg space-y-8 py-12">
            <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-950/20">
              <p className="mb-2 text-lg font-semibold text-red-800 dark:text-red-300">
                {error}
              </p>
              <p className="text-sm text-red-600 dark:text-red-400">
                Run a scan to generate a score for this domain.
              </p>
            </div>
            <div>
              <h3 className="mb-4 text-center text-lg font-semibold text-gray-900 dark:text-white">
                Scan a URL
              </h3>
              <ScanForm />
            </div>
          </div>
        )}

        {result && !loading && (
          <ScanResultCard
            result={{
              ...result,
              scoreUrl: result.score_url,
            }}
          />
        )}

        {/* Scan another site */}
        {result && !loading && (
          <div className="mt-12 rounded-xl border border-gray-200 bg-white p-8 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-4 text-center text-lg font-semibold text-gray-900 dark:text-white">
              Check another site
            </h3>
            <div className="mx-auto max-w-xl">
              <ScanForm />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
