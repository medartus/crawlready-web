export default function ScorePageLoading() {
  return (
    <div
      className="min-h-screen bg-cr-bg"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif' }}
    >
      {/* Header */}
      <header className="border-b border-cr-border-subtle">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3">
          <div className="h-4 w-12 animate-pulse rounded bg-cr-surface-raised" />
          <div className="h-5 w-24 animate-pulse rounded bg-cr-surface-raised" />
          <div className="h-7 w-16 animate-pulse rounded-lg bg-cr-surface-raised" />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-10">
        <div className="animate-pulse">
          {/* Hero */}
          <div className="rounded-2xl bg-cr-surface px-8 pb-8 pt-10">
            <div className="mx-auto h-4 w-40 rounded bg-cr-surface-raised" />
            <div className="mx-auto mt-6 size-40 rounded-full border-8 border-cr-surface-raised" />
            <div className="mx-auto mt-4 h-6 w-20 rounded bg-cr-surface-raised" />
            <div className="mx-auto mt-2 h-4 w-64 rounded bg-cr-surface-raised" />

            {/* Sub-scores */}
            <div className="mt-8 grid grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="h-3 w-16 rounded bg-cr-surface-raised" />
                  <div className="h-6 w-8 rounded bg-cr-surface-raised" />
                  <div className="h-1.5 w-16 rounded-full bg-cr-surface-raised" />
                </div>
              ))}
            </div>
          </div>

          {/* Visual diff one-liner */}
          <div className="mt-6 rounded-xl border border-cr-border-subtle bg-cr-surface px-5 py-4">
            <div className="h-4 w-3/4 rounded bg-cr-surface-raised" />
          </div>

          {/* Recommendations */}
          <div className="mt-8 space-y-3">
            <div className="h-4 w-40 rounded bg-cr-surface-raised" />
            <div className="divide-y divide-cr-border-subtle rounded-xl border border-cr-border-subtle bg-cr-surface">
              {[1, 2, 3].map(i => (
                <div key={i} className="px-5 py-4">
                  <div className="h-4 w-2/3 rounded bg-cr-surface-raised" />
                  <div className="mt-2 h-3 w-full rounded bg-cr-surface-raised" />
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-12 rounded-2xl border border-cr-border bg-cr-surface px-8 py-10">
            <div className="mx-auto h-6 w-48 rounded bg-cr-surface-raised" />
            <div className="mx-auto mt-3 h-4 w-64 rounded bg-cr-surface-raised" />
            <div className="mx-auto mt-6 h-12 max-w-lg rounded-xl bg-cr-surface-raised" />
          </div>
        </div>
      </main>
    </div>
  );
}
