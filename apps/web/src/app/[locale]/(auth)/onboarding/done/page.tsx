'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function OnboardingDonePage() {
  const router = useRouter();
  const [domain, setDomain] = useState<string | null>(null);

  useEffect(() => {
    const storedDomain = sessionStorage.getItem('onboarding_domain');
    if (storedDomain) {
      setDomain(storedDomain);
    }
  }, []);

  const handleGoToDashboard = () => {
    // Clean up onboarding session storage
    sessionStorage.removeItem('onboarding_analysis');
    sessionStorage.removeItem('onboarding_url');
    sessionStorage.removeItem('onboarding_domain');
    sessionStorage.removeItem('onboarding_api_key');
    sessionStorage.removeItem('onboarding_site_id');
    sessionStorage.removeItem('onboarding_integration_method');

    router.push('/dashboard');
  };

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-green-100">
          <svg className="size-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 className="text-2xl font-semibold text-gray-900">You&apos;re all set!</h2>
        <p className="mx-auto mt-3 max-w-md text-gray-600">
          {domain
            ? (
                <>
                  <span className="font-medium">{domain}</span>
                  {' '}
                  is now being tracked for AI crawler visits.
                </>
              )
            : 'Your site is now being tracked for AI crawler visits.'}
        </p>

        <div className="mx-auto mt-8 grid max-w-lg gap-4 text-left sm:grid-cols-2">
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
            <div className="mb-2 text-sm font-semibold text-gray-900">What happens next</div>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-green-500">&#x2713;</span>
                AI crawlers are detected automatically
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-green-500">&#x2713;</span>
                Visit data appears in your dashboard
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-green-500">&#x2713;</span>
                Bot breakdown and trend analytics
              </li>
            </ul>
          </div>
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
            <div className="mb-2 text-sm font-semibold text-gray-900">Dashboard features</div>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-blue-500">&#x2192;</span>
                Real-time crawler visit feed
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-blue-500">&#x2192;</span>
                AI readiness scoring
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-blue-500">&#x2192;</span>
                Integration status monitoring
              </li>
            </ul>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoToDashboard}
          className="mt-8 rounded-lg bg-blue-600 px-8 py-3 font-medium text-white hover:bg-blue-700"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';
