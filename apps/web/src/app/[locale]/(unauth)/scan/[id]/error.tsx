'use client';

import Link from 'next/link';

export default function ScanResultError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="bg-cr-bg flex min-h-screen flex-col items-center justify-center p-4">
      <div className="border-cr-score-critical/20 bg-cr-score-critical-soft mx-auto max-w-md space-y-4 rounded-xl border p-8 text-center">
        <h2 className="text-cr-fg text-xl font-bold">
          Something went wrong
        </h2>
        <p className="text-cr-fg-secondary mt-2">
          We couldn&apos;t load this scan result. Please try again.
        </p>
        <div className="flex items-center justify-center gap-4 pt-2">
          <button
            type="button"
            onClick={reset}
            className="bg-cr-primary text-cr-primary-fg hover:bg-cr-primary-hover rounded-lg px-6 py-2 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="border-cr-border text-cr-fg-secondary hover:bg-cr-surface-raised rounded-lg border px-6 py-2 transition-colors"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
