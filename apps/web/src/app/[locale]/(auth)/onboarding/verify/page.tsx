'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

type VerificationStatus = 'idle' | 'checking' | 'success' | 'failed';

type VerifyResult = {
  verified: boolean;
  latency_ms: number;
  bot_detected: string | null;
  message: string;
};

export default function VerifyPage() {
  const router = useRouter();
  const [status, setStatus] = useState<VerificationStatus>('idle');
  const [siteId, setSiteId] = useState<string | null>(null);
  const [domain, setDomain] = useState<string | null>(null);
  const [result, setResult] = useState<VerifyResult | null>(null);

  useEffect(() => {
    const storedId = sessionStorage.getItem('onboarding_site_id');
    const storedDomain = sessionStorage.getItem('onboarding_domain');

    if (storedId) {
      setSiteId(storedId);
    }
    if (storedDomain) {
      setDomain(storedDomain);
    }

    if (!storedId && !storedDomain) {
      router.push('/onboarding/add-site');
    }
  }, [router]);

  const runVerification = useCallback(async () => {
    if (!siteId) {
      return;
    }

    setStatus('checking');
    setResult(null);

    try {
      const response = await fetch('/api/v1/verify-integration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site_id: siteId }),
      });

      if (response.ok) {
        const data: VerifyResult = await response.json();
        setResult(data);
        setStatus(data.verified ? 'success' : 'failed');
      } else {
        setStatus('failed');
      }
    } catch {
      setStatus('failed');
    }
  }, [siteId]);

  const handleContinue = () => {
    router.push('/onboarding/done');
  };

  const handleSkip = () => {
    router.push('/onboarding/done');
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900">Verify Integration</h2>
        <p className="mt-2 text-gray-600">
          Confirm that AI crawler tracking is working for
          {' '}
          <span className="font-medium">{domain}</span>
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        {status === 'idle' && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-blue-100">
              <svg className="size-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="mb-6 text-gray-600">
              We&apos;ll send a synthetic GPTBot request to your site and check if a beacon arrives.
            </p>
            <button
              type="button"
              onClick={runVerification}
              className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
            >
              Verify My Integration
            </button>
          </div>
        )}

        {status === 'checking' && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-blue-100">
              <svg className="size-8 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <p className="font-medium text-gray-700">Sending test request...</p>
            <p className="mt-1 text-sm text-gray-500">Waiting for beacon response (up to 15 seconds)</p>
          </div>
        )}

        {status === 'success' && result && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-green-100">
              <svg className="size-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-green-800">Integration Verified!</h3>
            <p className="text-gray-600">{result.message}</p>
            {result.bot_detected && (
              <p className="mt-2 text-sm text-gray-500">
                Bot:
                {' '}
                <span className="font-mono">{result.bot_detected}</span>
                {' · '}
                Latency:
                {' '}
                {(result.latency_ms / 1000).toFixed(1)}
                s
              </p>
            )}
          </div>
        )}

        {status === 'failed' && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-amber-100">
              <svg className="size-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-amber-800">No Beacon Detected</h3>
            <p className="mb-4 text-gray-600">
              {result?.message ?? 'We didn\'t receive a beacon within 15 seconds.'}
            </p>
            <div className="mb-6 rounded-lg bg-gray-50 p-4 text-left text-sm text-gray-600">
              <p className="mb-2 font-medium text-gray-700">Troubleshooting:</p>
              <ul className="list-inside list-disc space-y-1">
                <li>Ensure your middleware or script tag is deployed to production</li>
                <li>
                  Verify your domain matches exactly:
                  {' '}
                  <span className="font-mono">{domain}</span>
                </li>
                <li>Check that your middleware detects GPTBot in the User-Agent</li>
                <li>If behind a firewall, ensure external requests are allowed</li>
              </ul>
            </div>
            <button
              type="button"
              onClick={runVerification}
              className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => router.push('/onboarding/integrate')}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-3 font-medium text-gray-700 hover:bg-gray-50"
        >
          Back
        </button>
        {status === 'success'
          ? (
              <button
                type="button"
                onClick={handleContinue}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700"
              >
                Continue to Dashboard
              </button>
            )
          : (
              <button
                type="button"
                onClick={handleSkip}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-3 font-medium text-gray-700 hover:bg-gray-50"
              >
                Skip for Now
              </button>
            )}
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';
