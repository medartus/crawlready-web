'use client';

import { Code2, Lightbulb, Tag } from 'lucide-react';

type DetectedType = {
  type: string;
  properties: number;
};

type GeneratableType = {
  type: string;
  confidence: number;
  reason: string;
};

type SchemaPreviewCardProps = {
  detectedTypes: DetectedType[];
  generatable: GeneratableType[];
};

export function SchemaPreviewCard({ detectedTypes, generatable }: SchemaPreviewCardProps) {
  const hasDetected = detectedTypes.length > 0;
  const hasGeneratable = generatable.length > 0;

  if (!hasDetected && !hasGeneratable) {
    return null;
  }

  return (
    <div className="border-cr-border-subtle bg-cr-surface rounded-xl border p-6">
      <div className="mb-4 flex items-center gap-2">
        <Code2 className="text-cr-primary size-5" />
        <h3 className="text-cr-fg text-lg font-semibold">
          Schema.org Preview
        </h3>
      </div>

      {/* Detected types */}
      {hasDetected
        ? (
            <div className="mb-4">
              <p className="text-cr-fg-secondary mb-2 text-sm">
                <strong>{detectedTypes.length}</strong>
                {' '}
                Schema.org type
                {detectedTypes.length !== 1 ? 's' : ''}
                {' '}
                detected:
              </p>
              <div className="flex flex-wrap gap-2">
                {detectedTypes.map(dt => (
                  <span
                    key={dt.type}
                    className="bg-cr-primary-soft text-cr-primary inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium"
                  >
                    <Tag className="size-3.5" />
                    {dt.type}
                    {dt.properties > 0 && (
                      <span className="text-cr-primary/70 text-xs">
                        (
                        {dt.properties}
                        {' '}
                        props)
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )
        : (
            <div className="bg-cr-score-fair-soft text-cr-score-fair mb-4 rounded-lg p-3 text-sm">
              No Schema.org types detected on this page.
            </div>
          )}

      {/* Generatable types */}
      {hasGeneratable && (
        <div className="border-cr-border-subtle border-t pt-4">
          <div className="text-cr-fg-secondary mb-2 flex items-center gap-1.5 text-sm font-medium">
            <Lightbulb className="size-4 text-amber-500" />
            CrawlReady could generate:
          </div>
          <div className="space-y-2">
            {generatable.map(g => (
              <div
                key={g.type}
                className="bg-cr-surface-raised flex items-start gap-3 rounded-lg px-3 py-2"
              >
                <span className="bg-cr-score-fair-soft text-cr-score-fair mt-0.5 shrink-0 rounded px-2 py-0.5 text-xs font-semibold">
                  {g.type}
                </span>
                <span className="text-cr-fg-secondary text-sm">
                  {g.reason}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
