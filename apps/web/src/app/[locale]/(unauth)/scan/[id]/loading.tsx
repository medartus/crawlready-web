export default function ScanResultLoading() {
  return (
    <div className="bg-cr-bg min-h-screen">
      {/* Header skeleton */}
      <header className="border-cr-border-subtle bg-cr-bg/80 border-b backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3">
          <div className="bg-cr-surface-raised h-5 w-16 animate-pulse rounded" />
          <div className="bg-cr-surface-raised h-6 w-28 animate-pulse rounded" />
          <div className="bg-cr-surface-raised h-5 w-16 animate-pulse rounded" />
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-5 py-10">
        {/* Score card skeleton */}
        <div className="bg-cr-surface-raised rounded-2xl px-8 pb-8 pt-10">
          <div className="flex flex-col items-center gap-6">
            <div className="bg-cr-border size-40 animate-pulse rounded-full" />
            <div className="bg-cr-border h-4 w-48 animate-pulse rounded" />
            <div className="mt-4 grid w-full grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="bg-cr-border h-4 w-12 animate-pulse rounded" />
                  <div className="bg-cr-border h-6 w-10 animate-pulse rounded" />
                  <div className="bg-cr-border h-1.5 w-20 animate-pulse rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Visual diff skeleton */}
        <div className="border-cr-border-subtle bg-cr-surface animate-pulse rounded-xl border p-6">
          <div className="bg-cr-border mb-4 h-6 w-40 rounded" />
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-cr-surface-raised h-48 rounded" />
            <div className="bg-cr-surface-raised h-48 rounded" />
          </div>
        </div>

        {/* EU AI Act skeleton */}
        <div className="border-cr-border-subtle bg-cr-surface animate-pulse rounded-xl border p-6">
          <div className="bg-cr-border mb-4 h-6 w-48 rounded" />
          <div className="space-y-3">
            {['check-1', 'check-2', 'check-3', 'check-4'].map(key => (
              <div key={key} className="flex items-center gap-3">
                <div className="bg-cr-border size-5 rounded" />
                <div className="bg-cr-border h-4 flex-1 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations skeleton */}
        <div className="animate-pulse">
          <div className="bg-cr-border mb-4 h-6 w-40 rounded" />
          <div className="space-y-3">
            {['rec-1', 'rec-2', 'rec-3'].map(key => (
              <div key={key} className="border-cr-border-subtle bg-cr-surface rounded-lg border p-4">
                <div className="bg-cr-border mb-2 h-5 w-3/4 rounded" />
                <div className="bg-cr-border h-4 w-full rounded" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
