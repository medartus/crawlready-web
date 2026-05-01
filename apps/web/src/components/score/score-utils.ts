export const SCORE_BANDS = [
  { max: 20, label: 'Critical', color: 'text-cr-score-critical', ring: 'stroke-cr-score-critical', bg: 'bg-cr-score-critical-soft', barColor: 'bg-cr-score-critical' },
  { max: 40, label: 'Poor', color: 'text-cr-score-poor', ring: 'stroke-cr-score-poor', bg: 'bg-cr-score-poor-soft', barColor: 'bg-cr-score-poor' },
  { max: 60, label: 'Fair', color: 'text-cr-score-fair', ring: 'stroke-cr-score-fair', bg: 'bg-cr-score-fair-soft', barColor: 'bg-cr-score-fair' },
  { max: 80, label: 'Good', color: 'text-cr-score-good', ring: 'stroke-cr-score-good', bg: 'bg-cr-score-good-soft', barColor: 'bg-cr-score-good' },
  { max: 100, label: 'Excellent', color: 'text-cr-score-excellent', ring: 'stroke-cr-score-excellent', bg: 'bg-cr-score-excellent-soft', barColor: 'bg-cr-score-excellent' },
] as const;

export function getScoreBand(score: number) {
  return SCORE_BANDS.find(b => score <= b.max) ?? SCORE_BANDS[4];
}

export const SCORE_MESSAGES: Record<string, string> = {
  Critical: 'Your site is invisible to AI crawlers. Immediate action required.',
  Poor: 'AI crawlers struggle to read your site. Major improvements needed.',
  Fair: 'Partially visible to AI, but significant gaps remain.',
  Good: 'AI crawlers can see most of your content. Small optimizations left.',
  Excellent: 'Your site is fully optimized for AI crawlers!',
};
