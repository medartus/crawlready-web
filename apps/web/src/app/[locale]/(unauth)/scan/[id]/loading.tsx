export default function ScanResultLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header skeleton */}
      <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between p-4">
          <div className="h-5 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-6 w-28 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-5 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8">
        {/* Score card skeleton */}
        <div className="animate-pulse rounded-2xl bg-gray-100 p-8 dark:bg-gray-800/50">
          <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
            <div className="flex flex-col items-center gap-4">
              <div className="size-32 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="h-4 w-48 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
            <div className="w-full max-w-md space-y-4">
              <div className="h-6 w-full rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-6 w-4/5 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-6 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
        </div>

        {/* Visual diff skeleton */}
        <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4 h-6 w-40 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-48 rounded bg-gray-100 dark:bg-gray-700/50" />
            <div className="h-48 rounded bg-gray-100 dark:bg-gray-700/50" />
          </div>
        </div>

        {/* EU AI Act skeleton */}
        <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4 h-6 w-48 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="space-y-3">
            {['check-1', 'check-2', 'check-3', 'check-4'].map(key => (
              <div key={key} className="flex items-center gap-3">
                <div className="size-5 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-4 flex-1 rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations skeleton */}
        <div className="animate-pulse">
          <div className="mb-4 h-6 w-40 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="space-y-3">
            {['rec-1', 'rec-2', 'rec-3'].map(key => (
              <div key={key} className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-2 h-5 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
