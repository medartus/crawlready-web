'use client';

import { useOrganization } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type VerificationStatus = 'idle' | 'verifying' | 'success' | 'failed';

type VerificationResult = {
  success: boolean;
  message: string;
  details?: {
    renderTime?: number;
    contentLength?: number;
    crawlerDetection?: boolean;
  };
};

export default function VerifyPage() {
  const router = useRouter();
  const { organization } = useOrganization();
  const [status, setStatus] = useState<VerificationStatus>('idle');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [domain, setDomain] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const storedDomain = sessionStorage.getItem('onboarding_domain');
    const storedUrl = sessionStorage.getItem('onboarding_url');

    if (!storedDomain || !storedUrl) {
      router.push('/onboarding/add-site');
      return;
    }

    setDomain(storedDomain);
    setUrl(storedUrl);
  }, [router]);

  const handleVerify = async () => {
    if (!url) {
      return;
    }

    setStatus('verifying');
    setResult(null);

    try {
      const response = await fetch('/api/onboarding/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          domain,
          orgId: organization?.id,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus('success');
        setResult(data);

        // Store the API key if provided
        if (data.apiKey) {
          sessionStorage.setItem('onboarding_api_key', data.apiKey);
        }
      } else {
        setStatus('failed');
        setResult({
          success: false,
          message: data.error || 'Verification failed. Please check your integration.',
        });
      }
    } catch (error) {
      setStatus('failed');
      setResult({
        success: false,
        message: 'An error occurred during verification. Please try again.',
      });
    }
  };

  const handleComplete = async () => {
    // Create the site in the database
    try {
      const analysis = sessionStorage.getItem('onboarding_analysis');
      let frameworkData = {};

      if (analysis) {
        try {
          const data = JSON.parse(analysis);
          frameworkData = {
            frameworkDetected: data.framework?.name,
            frameworkVersion: data.framework?.version,
            frameworkConfidence: data.framework?.confidence,
          };
        } catch {
          // Ignore
        }
      }

      await fetch('/api/user/sites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domain,
          displayName: domain,
          ...frameworkData,
        }),
      });

      // Clear session storage
      sessionStorage.removeItem('onboarding_analysis');
      sessionStorage.removeItem('onboarding_url');
      sessionStorage.removeItem('onboarding_domain');
      sessionStorage.removeItem('onboarding_api_key');

      // Redirect to dashboard
      router.push('/dashboard');
    } catch {
      // Still redirect even if site creation fails
      router.push('/dashboard');
    }
  };

  if (!domain) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-center">
          <svg className="size-8 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="ml-3 text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Verification Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          {status === 'success'
            ? (
                <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-green-100">
                  <svg className="size-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )
            : status === 'failed'
              ? (
                  <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-red-100">
                    <svg className="size-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                )
              : (
                  <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-blue-100">
                    <svg className="size-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                )}
          <h2 className="text-2xl font-semibold text-gray-900">
            {status === 'success'
              ? 'Integration Verified!'
              : status === 'failed'
                ? 'Verification Failed'
                : 'Verify Your Integration'}
          </h2>
          <p className="mt-2 text-gray-600">{domain}</p>
        </div>

        {/* Result Display */}
        {result && (
          <div
            className={`mb-6 rounded-lg p-4 ${
              result.success ? 'border border-green-200 bg-green-50' : 'border border-red-200 bg-red-50'
            }`}
          >
            <p className={result.success ? 'text-green-800' : 'text-red-800'}>{result.message}</p>
            {result.details && result.success && (
              <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                {result.details.renderTime && (
                  <div className="text-center">
                    <div className="font-semibold text-green-700">
                      {result.details.renderTime}
                      ms
                    </div>
                    <div className="text-green-600">Render Time</div>
                  </div>
                )}
                {result.details.contentLength && (
                  <div className="text-center">
                    <div className="font-semibold text-green-700">
                      {(result.details.contentLength / 1024).toFixed(1)}
                      KB
                    </div>
                    <div className="text-green-600">Content Size</div>
                  </div>
                )}
                {result.details.crawlerDetection !== undefined && (
                  <div className="text-center">
                    <div className="font-semibold text-green-700">
                      {result.details.crawlerDetection ? '✓' : '✗'}
                    </div>
                    <div className="text-green-600">Crawler Detected</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Verify Button */}
        {status !== 'success' && (
          <button
            onClick={handleVerify}
            disabled={status === 'verifying'}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === 'verifying'
              ? (
                  <span className="flex items-center justify-center">
                    <svg className="-ml-1 mr-3 size-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Verifying...
                  </span>
                )
              : status === 'failed'
                ? (
                    'Retry Verification'
                  )
                : (
                    'Verify Integration'
                  )}
          </button>
        )}

        {/* Success Actions */}
        {status === 'success' && (
          <button
            onClick={handleComplete}
            className="w-full rounded-lg bg-green-600 px-4 py-3 font-medium text-white transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Complete Setup & Go to Dashboard →
          </button>
        )}
      </div>

      {/* Troubleshooting (shown on failure) */}
      {status === 'failed' && (
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Troubleshooting</h3>
          <ul className="space-y-3 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-blue-500">•</span>
              Make sure you've deployed your code changes
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-blue-500">•</span>
              Check that the middleware is running (no errors in console)
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-blue-500">•</span>
              Verify your API key is correctly set in the code
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-blue-500">•</span>
              Ensure your site is publicly accessible (not behind auth)
            </li>
          </ul>
          <div className="mt-4 border-t border-gray-200 pt-4">
            <a href="mailto:support@crawlready.com" className="text-sm text-blue-600 hover:text-blue-700">
              Need help? Contact support →
            </a>
          </div>
        </div>
      )}

      {/* Skip Option */}
      {status !== 'success' && (
        <div className="text-center">
          <button
            onClick={handleComplete}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Skip verification and go to dashboard
          </button>
        </div>
      )}

      {/* Back Button */}
      {status !== 'success' && (
        <div className="flex gap-4">
          <Link
            href="/onboarding/integrate"
            className="flex-1 rounded-lg bg-gray-100 px-4 py-3 text-center font-medium text-gray-700 transition-colors hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            ← Back to Integration
          </Link>
        </div>
      )}
    </div>
  );
}

export const dynamic = 'force-dynamic';
