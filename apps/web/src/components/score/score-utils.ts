export const SCORE_BANDS = [
  { max: 20, label: 'Critical', color: 'text-red-600 dark:text-red-400', ring: 'stroke-red-500', bg: 'bg-red-50 dark:bg-red-950/20', barColor: 'bg-red-500' },
  { max: 40, label: 'Poor', color: 'text-orange-600 dark:text-orange-400', ring: 'stroke-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/20', barColor: 'bg-orange-500' },
  { max: 60, label: 'Fair', color: 'text-yellow-600 dark:text-yellow-400', ring: 'stroke-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-950/20', barColor: 'bg-yellow-500' },
  { max: 80, label: 'Good', color: 'text-green-600 dark:text-green-400', ring: 'stroke-green-500', bg: 'bg-green-50 dark:bg-green-950/20', barColor: 'bg-green-500' },
  { max: 100, label: 'Excellent', color: 'text-emerald-600 dark:text-emerald-400', ring: 'stroke-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/20', barColor: 'bg-emerald-500' },
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
