'use client';

import { usePathname } from 'next/navigation';

const steps = [
  { id: 'add-site', label: 'Add Site', number: 1 },
  { id: 'crawl', label: 'Pre-Cache', number: 2 },
  { id: 'integrate', label: 'Integrate', number: 3 },
];

function getCurrentStep(pathname: string): number {
  if (pathname.includes('/add-site')) {
    return 1;
  }
  if (pathname.includes('/crawl')) {
    return 2;
  }
  if (pathname.includes('/integrate')) {
    return 3;
  }
  return 0;
}

function OnboardingProgress({ currentStep }: { currentStep: number }) {
  if (currentStep === 0) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.number;
          const isCurrent = currentStep === step.number;

          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex size-10 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isCurrent
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {isCompleted
                    ? (
                        <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )
                    : (
                        step.number
                      )}
                </div>
                <span className={`mt-2 text-xs font-medium ${isCurrent ? 'text-blue-600' : 'text-gray-500'}`}>
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`mx-2 h-1 w-16 ${
                    currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentStep = getCurrentStep(pathname);

  // Don't show progress for organization-selection
  const showProgress = currentStep > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-screen-xl px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            {currentStep > 0 ? 'Set Up Your Site' : 'Welcome to CrawlReady'}
          </h1>
          <p className="mt-2 text-gray-600">
            {currentStep > 0
              ? 'Pre-cache your pages for instant AI crawler responses'
              : 'Get started with your organization'}
          </p>
        </div>

        {showProgress && (
          <div className="mb-12">
            <OnboardingProgress currentStep={currentStep} />
          </div>
        )}

        <div className="mx-auto max-w-2xl">{children}</div>
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';
