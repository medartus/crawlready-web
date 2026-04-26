'use client';

import { AlertTriangle, Check, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

type DiffBlock = {
  text: string;
  inBotView: boolean;
  inRenderedView: boolean;
  status: 'visible' | 'js-invisible' | 'bot-only';
};

type DiffStats = {
  renderedBlockCount: number;
  botBlockCount: number;
  jsInvisibleCount: number;
  botOnlyCount: number;
  visibilityRatio: number;
  renderedTextLength: number;
  botTextLength: number;
};

type VisualDiffProps = {
  blocks: DiffBlock[];
  stats: DiffStats;
};

export function VisualDiff({ blocks, stats }: VisualDiffProps) {
  const [view, setView] = useState<'overlay' | 'side-by-side'>('overlay');
  const [showOnlyMissing, setShowOnlyMissing] = useState(false);

  const renderedBlocks = blocks.filter(b => b.inRenderedView);
  const botBlocks = blocks.filter(b => b.inBotView);
  const displayBlocks = showOnlyMissing
    ? blocks.filter(b => b.status !== 'visible')
    : blocks;

  const visibilityColor = stats.visibilityRatio >= 80
    ? 'text-emerald-600'
    : stats.visibilityRatio >= 50
      ? 'text-yellow-600'
      : 'text-red-600';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Visual Content Diff
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            What humans see vs what AI crawlers receive
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setView('overlay')}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              view === 'overlay'
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
            }`}
          >
            Overlay
          </button>
          <button
            type="button"
            onClick={() => setView('side-by-side')}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              view === 'side-by-side'
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
            }`}
          >
            Side-by-Side
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className={`text-2xl font-bold ${visibilityColor}`}>
            {stats.visibilityRatio}
            %
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Visibility Ratio
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.renderedBlockCount}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Content Blocks
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="text-2xl font-bold text-red-600">
            {stats.jsInvisibleCount}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            JS-Invisible
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {Math.round(stats.renderedTextLength / 1024)}
            KB
            {' / '}
            {Math.round(stats.botTextLength / 1024)}
            KB
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Rendered / Bot Text
          </div>
        </div>
      </div>

      {/* Filter */}
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={showOnlyMissing}
          onChange={e => setShowOnlyMissing(e.target.checked)}
          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        <span className="text-gray-700 dark:text-gray-300">
          Show only missing/invisible content
        </span>
      </label>

      {/* Content */}
      {view === 'overlay'
        ? (
            <OverlayView blocks={displayBlocks} />
          )
        : (
            <SideBySideView renderedBlocks={renderedBlocks} botBlocks={botBlocks} />
          )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm dark:border-gray-700 dark:bg-gray-800/50">
        <div className="flex items-center gap-2">
          <span className="inline-block size-3 rounded-sm bg-emerald-100 ring-1 ring-emerald-300" />
          <span className="text-gray-600 dark:text-gray-400">Visible to bots</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block size-3 rounded-sm bg-red-100 ring-1 ring-red-300" />
          <span className="text-gray-600 dark:text-gray-400">JS-invisible (bots miss this)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block size-3 rounded-sm bg-blue-100 ring-1 ring-blue-300" />
          <span className="text-gray-600 dark:text-gray-400">Bot-only (e.g. noscript)</span>
        </div>
      </div>
    </div>
  );
}

function OverlayView({ blocks }: { blocks: DiffBlock[] }) {
  if (blocks.length === 0) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-8 text-center dark:border-emerald-800 dark:bg-emerald-950/20">
        <Check className="mx-auto mb-2 size-8 text-emerald-600" />
        <p className="font-medium text-emerald-800 dark:text-emerald-300">
          All content is visible to AI crawlers
        </p>
      </div>
    );
  }

  return (
    <div className="max-h-[600px] overflow-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="space-y-0.5 p-4">
        {blocks.map(block => (
          <div
            key={`${block.status}-${block.text.slice(0, 30)}`}
            className={`flex items-start gap-3 rounded-md px-3 py-2 ${
              block.status === 'visible'
                ? 'bg-emerald-50 dark:bg-emerald-950/10'
                : block.status === 'js-invisible'
                  ? 'bg-red-50 dark:bg-red-950/20'
                  : 'bg-blue-50 dark:bg-blue-950/20'
            }`}
          >
            {block.status === 'visible'
              ? <Eye className="mt-0.5 size-4 shrink-0 text-emerald-500" />
              : block.status === 'js-invisible'
                ? <EyeOff className="mt-0.5 size-4 shrink-0 text-red-500" />
                : <AlertTriangle className="mt-0.5 size-4 shrink-0 text-blue-500" />}
            <span
              className={`text-sm ${
                block.status === 'visible'
                  ? 'text-gray-700 dark:text-gray-300'
                  : block.status === 'js-invisible'
                    ? 'font-medium text-red-800 dark:text-red-300'
                    : 'text-blue-800 dark:text-blue-300'
              }`}
            >
              {block.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SideBySideView({
  renderedBlocks,
  botBlocks,
}: {
  renderedBlocks: DiffBlock[];
  botBlocks: DiffBlock[];
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Rendered view */}
      <div className="rounded-lg border-2 border-emerald-300 dark:border-emerald-700">
        <div className="border-b border-emerald-200 bg-emerald-50 px-4 py-2 dark:border-emerald-800 dark:bg-emerald-950/30">
          <div className="flex items-center gap-2">
            <Eye className="size-4 text-emerald-600" />
            <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
              Browser View (JS Rendered)
            </span>
          </div>
        </div>
        <div className="max-h-[400px] overflow-auto p-4 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
          {renderedBlocks.map(block => (
            <span
              key={`rendered-${block.text.slice(0, 30)}`}
              className={
                block.status === 'js-invisible'
                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                  : ''
              }
            >
              {block.text}
              {' '}
            </span>
          ))}
        </div>
      </div>

      {/* Bot view */}
      <div className="rounded-lg border-2 border-red-300 dark:border-red-700">
        <div className="border-b border-red-200 bg-red-50 px-4 py-2 dark:border-red-800 dark:bg-red-950/30">
          <div className="flex items-center gap-2">
            <EyeOff className="size-4 text-red-600" />
            <span className="text-sm font-semibold text-red-800 dark:text-red-300">
              Bot View (GPTBot — No JS)
            </span>
          </div>
        </div>
        <div className="max-h-[400px] overflow-auto p-4 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
          {botBlocks.map(block => (
            <span key={`bot-${block.text.slice(0, 30)}`}>
              {block.text}
              {' '}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
