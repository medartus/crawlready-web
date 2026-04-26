export default function ScorePageLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header skeleton */}
      <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between p-4">
          <div className="h-5 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-6 w-28 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="w-16" />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* Score result card skeleton */}
        <div className="animate-pulse space-y-6">
          {/* Headline score */}
          <div className="rounded-2xl bg-gray-100 p-8 dark:bg-gray-800/50">
            <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
              <div className="flex flex-col items-center gap-4">
                <div className="size-32 rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
              </div>
              <div className="w-full max-w-md space-y-4">
                <div className="h-6 w-full rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-6 w-4/5 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-6 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
          </div>

          {/* Sub-sections */}
          {['section-1', 'section-2', 'section-3'].map(key => (
            <div
              key={key}
              className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="mb-4 h-6 w-48 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="space-y-3">
                <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-4 w-5/6 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-4 w-4/6 rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
          ))}

          {/* CTA skeleton */}
          <div className="rounded-xl border border-gray-200 bg-white p-8 dark:border-gray-700 dark:bg-gray-800">
            <div className="mx-auto h-6 w-64 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="mx-auto mt-4 h-12 max-w-xl rounded-xl bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      </main>
    </div>
  );
}
