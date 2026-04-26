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
    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4 flex items-center gap-2">
        <Code2 className="size-5 text-indigo-600 dark:text-indigo-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Schema.org Preview
        </h3>
      </div>

      {/* Detected types */}
      {hasDetected
        ? (
            <div className="mb-4">
              <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
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
                    className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                  >
                    <Tag className="size-3.5" />
                    {dt.type}
                    {dt.properties > 0 && (
                      <span className="text-xs text-indigo-500 dark:text-indigo-400">
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
            <div className="mb-4 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
              No Schema.org types detected on this page.
            </div>
          )}

      {/* Generatable types */}
      {hasGeneratable && (
        <div className="border-t border-gray-100 pt-4 dark:border-gray-700">
          <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
            <Lightbulb className="size-4 text-amber-500" />
            CrawlReady could generate:
          </div>
          <div className="space-y-2">
            {generatable.map(g => (
              <div
                key={g.type}
                className="flex items-start gap-3 rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-900/50"
              >
                <span className="mt-0.5 shrink-0 rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                  {g.type}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
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
