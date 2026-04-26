'use client';

import { getScoreBand } from './score-utils';

type ScoreGaugeProps = {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
};

const SIZES = {
  sm: { outer: 80, stroke: 6, fontSize: 'text-xl', labelSize: 'text-[10px]' },
  md: { outer: 120, stroke: 8, fontSize: 'text-3xl', labelSize: 'text-xs' },
  lg: { outer: 180, stroke: 10, fontSize: 'text-5xl', labelSize: 'text-sm' },
} as const;

export function ScoreGauge({ score, size = 'md', label }: ScoreGaugeProps) {
  const band = getScoreBand(score);
  const s = SIZES[size];
  const radius = (s.outer - s.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: s.outer, height: s.outer }}>
        <svg width={s.outer} height={s.outer} className="-rotate-90">
          <circle
            cx={s.outer / 2}
            cy={s.outer / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={s.stroke}
            className="text-gray-200 dark:text-gray-700"
          />
          <circle
            cx={s.outer / 2}
            cy={s.outer / 2}
            r={radius}
            fill="none"
            strokeWidth={s.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={`${band.ring} transition-all duration-700 ease-out`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-bold ${s.fontSize} ${band.color}`}>{score}</span>
        </div>
      </div>
      {label && (
        <span className={`font-medium text-gray-600 dark:text-gray-400 ${s.labelSize}`}>
          {label}
        </span>
      )}
      <span className={`font-semibold ${s.labelSize} ${band.color}`}>{band.label}</span>
    </div>
  );
}
