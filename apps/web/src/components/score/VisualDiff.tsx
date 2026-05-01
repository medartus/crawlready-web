'use client';

import { AlertTriangle, Check, ChevronDown, ChevronRight, Eye, EyeOff, Layers } from 'lucide-react';
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
  const [expanded, setExpanded] = useState(false);
  const [view, setView] = useState<'overlay' | 'side-by-side'>('overlay');
  const [showOnlyMissing, setShowOnlyMissing] = useState(false);

  const renderedBlocks = blocks.filter(b => b.inRenderedView);
  const botBlocks = blocks.filter(b => b.inBotView);
  const displayBlocks = showOnlyMissing
    ? blocks.filter(b => b.status !== 'visible')
    : blocks;

  const visibilityColor = stats.visibilityRatio >= 80
    ? 'text-cr-score-excellent'
    : stats.visibilityRatio >= 50
      ? 'text-cr-score-fair'
      : 'text-cr-score-critical';

  const summaryText = stats.jsInvisibleCount === 0
    ? 'All content is visible to AI crawlers'
    : `AI crawlers miss ${stats.jsInvisibleCount} of ${stats.renderedBlockCount} content blocks`;

  return (
    <div className="border-cr-border-subtle bg-cr-surface overflow-hidden rounded-xl border">
      {/* Collapsible Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="hover:bg-cr-surface-raised flex w-full cursor-pointer items-center gap-4 p-5 text-left transition-colors"
      >
        <Layers className="text-cr-primary size-5 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-3 px-5 py-3">
            <StatBadge label="Visibility" value={`${stats.visibilityRatio}%`} />
            <StatBadge label="Content blocks" value={String(stats.renderedBlockCount)} />
            <StatBadge label="JS-invisible" value={String(stats.jsInvisibleCount)} warn={stats.jsInvisibleCount > 0} />
          </div>
          <p className="text-cr-fg-secondary mt-0.5 text-sm">
            {summaryText}
          </p>
        </div>
        {expanded
          ? <ChevronDown className="text-cr-fg-muted size-5 shrink-0" />
          : <ChevronRight className="text-cr-fg-muted size-5 shrink-0" />}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-cr-border-subtle border-t">
          <div className="space-y-6">
            {/* View toggle + filter */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setView('overlay')}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    view === 'overlay'
                      ? 'bg-cr-primary-soft text-cr-primary'
                      : 'text-cr-fg-muted hover:text-cr-fg'
                  }`}
                >
                  Overlay
                </button>
                <button
                  type="button"
                  onClick={() => setView('side-by-side')}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    view === 'side-by-side'
                      ? 'bg-cr-primary-soft text-cr-primary'
                      : 'text-cr-fg-muted hover:text-cr-fg'
                  }`}
                >
                  Side-by-Side
                </button>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showOnlyMissing}
                  onChange={e => setShowOnlyMissing(e.target.checked)}
                  className="border-cr-border text-cr-primary focus:ring-cr-primary rounded"
                />
                <span className="text-cr-fg-secondary">
                  Show only missing content
                </span>
              </label>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="bg-cr-surface-raised rounded-lg p-3">
                <div className={`text-xl font-bold ${visibilityColor}`}>
                  {stats.visibilityRatio}
                  %
                </div>
                <div className="text-cr-fg-muted text-xs">
                  Visibility
                </div>
              </div>
              <div className="bg-cr-surface-raised rounded-lg p-3">
                <div className="text-cr-fg text-xl font-bold">
                  {stats.renderedBlockCount}
                </div>
                <div className="text-cr-fg-muted text-xs">
                  Content Blocks
                </div>
              </div>
              <div className="bg-cr-surface-raised rounded-lg p-3">
                <div className="text-cr-score-critical text-xl font-bold">
                  {stats.jsInvisibleCount}
                </div>
                <div className="text-cr-fg-muted text-xs">
                  JS-Invisible
                </div>
              </div>
              <div className="bg-cr-surface-raised rounded-lg p-3">
                <div className="text-cr-fg text-xl font-bold">
                  {Math.round(stats.renderedTextLength / 1024)}
                  KB
                  {' / '}
                  {Math.round(stats.botTextLength / 1024)}
                  KB
                </div>
                <div className="text-cr-fg-muted text-xs">
                  Rendered / Bot
                </div>
              </div>
            </div>

            {/* Content */}
            {view === 'overlay'
              ? (
                  <OverlayView blocks={displayBlocks} />
                )
              : (
                  <SideBySideView renderedBlocks={renderedBlocks} botBlocks={botBlocks} />
                )}

            {/* Legend */}
            <div className="bg-cr-surface-raised flex flex-wrap gap-4 rounded-lg p-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="bg-cr-score-excellent-soft inline-block size-3 rounded-sm" />
                <span className="text-cr-fg-muted text-xs">Visible to bots</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-cr-score-critical-soft inline-block size-3 rounded-sm" />
                <span className="text-cr-fg-muted text-xs">JS-invisible (bots miss this)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-cr-primary-soft inline-block size-3 rounded-sm" />
                <span className="text-cr-fg-muted text-xs">Bot-only (e.g. noscript)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBadge({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className={`rounded-lg px-3 py-1.5 text-sm ${
      warn
        ? 'bg-cr-score-critical-soft text-cr-score-critical'
        : 'bg-cr-surface-raised text-cr-fg-secondary'
    }`}
    >
      <span className="font-semibold">{value}</span>
      {' '}
      <span className="text-xs opacity-70">{label}</span>
    </div>
  );
}

function OverlayView({ blocks }: { blocks: DiffBlock[] }) {
  if (blocks.length === 0) {
    return (
      <div className="bg-cr-score-excellent-soft border-cr-score-excellent/20 rounded-lg border p-8 text-center">
        <Check className="text-cr-score-excellent mx-auto mb-2 size-8" />
        <p className="text-cr-score-excellent font-medium">
          All content is visible to AI crawlers
        </p>
      </div>
    );
  }

  return (
    <div className="border-cr-border-subtle max-h-[600px] overflow-auto rounded-lg border">
      <div className="space-y-0.5 p-4">
        {blocks.map(block => (
          <div
            key={`${block.status}-${block.text.slice(0, 30)}`}
            className={`flex items-start gap-3 rounded-md px-3 py-2 ${
              block.status === 'visible'
                ? 'bg-cr-score-excellent-soft'
                : block.status === 'js-invisible'
                  ? 'bg-cr-score-critical-soft'
                  : 'bg-cr-primary-soft'
            }`}
          >
            {block.status === 'visible'
              ? <Eye className="text-cr-score-excellent mt-0.5 size-4 shrink-0" />
              : block.status === 'js-invisible'
                ? <EyeOff className="text-cr-score-critical mt-0.5 size-4 shrink-0" />
                : <AlertTriangle className="text-cr-primary mt-0.5 size-4 shrink-0" />}
            <span
              className={`text-sm ${
                block.status === 'visible'
                  ? 'text-cr-fg-secondary'
                  : block.status === 'js-invisible'
                    ? 'text-cr-score-critical font-medium'
                    : 'text-cr-primary'
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
      <div className="border-cr-score-excellent/40 rounded-lg border-2">
        <div className="bg-cr-score-excellent-soft border-cr-score-excellent/20 border-b px-4 py-2">
          <div className="flex items-center gap-2">
            <Eye className="text-cr-score-excellent size-4" />
            <span className="text-cr-score-excellent text-sm font-semibold">
              Browser View (JS Rendered)
            </span>
          </div>
        </div>
        <div className="text-cr-fg-secondary max-h-[400px] overflow-auto p-4 text-sm leading-relaxed">
          {renderedBlocks.map(block => (
            <span
              key={`rendered-${block.text.slice(0, 30)}`}
              className={
                block.status === 'js-invisible'
                  ? 'bg-cr-score-critical-soft text-cr-score-critical'
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
      <div className="border-cr-score-critical/40 rounded-lg border-2">
        <div className="bg-cr-score-critical-soft border-cr-score-critical/20 border-b px-4 py-2">
          <div className="flex items-center gap-2">
            <EyeOff className="text-cr-score-critical size-4" />
            <span className="text-cr-score-critical text-sm font-semibold">
              Bot View (GPTBot — No JS)
            </span>
          </div>
        </div>
        <div className="text-cr-fg-secondary max-h-[400px] overflow-auto p-4 text-sm leading-relaxed">
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
