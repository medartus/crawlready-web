'use client';

import Link from 'next/link';

export default function ScanResultError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto max-w-md space-y-4 rounded-xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-950/20">
        <p className="text-lg font-semibold text-red-800 dark:text-red-300">
          Something went wrong
        </p>
        <p className="text-sm text-red-600 dark:text-red-400">
          We couldn&apos;t load this scan result. Please try again.
        </p>
        <div className="flex items-center justify-center gap-4 pt-2">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            Try again
          </button>
          <Link
            href="/"
            className="text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-400"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
