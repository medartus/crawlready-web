'use client';

import { getScoreBand } from './score-utils';

type SubScore = {
  label: string;
  score: number;
  weight: string;
};

type SubScoreBarsProps = {
  crawlability: number;
  agentReadiness: number;
  agentInteraction: number;
};

export function SubScoreBars({ crawlability, agentReadiness, agentInteraction }: SubScoreBarsProps) {
  const scores: SubScore[] = [
    { label: 'Crawlability', score: crawlability, weight: '50%' },
    { label: 'Agent Readiness', score: agentReadiness, weight: '25%' },
    { label: 'Agent Interaction', score: agentInteraction, weight: '25%' },
  ];

  return (
    <div className="space-y-4">
      {scores.map(s => (
        <SubScoreRow key={s.label} {...s} />
      ))}
    </div>
  );
}

function SubScoreRow({ label, score, weight }: SubScore) {
  const band = getScoreBand(score);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="text-cr-fg font-medium">{label}</span>
          <span className="text-cr-fg-muted text-xs">
            (
            {weight}
            )
          </span>
        </div>
        <span className={`font-bold ${band.color}`}>
          {score}
          /100
        </span>
      </div>
      <div className="bg-cr-surface-raised h-2.5 overflow-hidden rounded-full">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${band.barColor}`}
          style={{ width: `${Math.max(score, 2)}%` }}
        />
      </div>
    </div>
  );
}
