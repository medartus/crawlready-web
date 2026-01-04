'use client';

type CompatibilityScoreProps = {
  score: number;
  className?: string;
};

export function CompatibilityScore({ score, className = '' }: CompatibilityScoreProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) {
      return 'text-green-600';
    }
    if (score >= 60) {
      return 'text-yellow-600';
    }
    if (score >= 40) {
      return 'text-orange-600';
    }
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) {
      return 'Excellent';
    }
    if (score >= 60) {
      return 'Good';
    }
    if (score >= 40) {
      return 'Fair';
    }
    return 'Poor';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) {
      return 'bg-green-100 dark:bg-green-900/20';
    }
    if (score >= 60) {
      return 'bg-yellow-100 dark:bg-yellow-900/20';
    }
    if (score >= 40) {
      return 'bg-orange-100 dark:bg-orange-900/20';
    }
    return 'bg-red-100 dark:bg-red-900/20';
  };

  const circumference = 2 * Math.PI * 60;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative">
        {/* Background circle */}
        <svg className="size-40" viewBox="0 0 140 140">
          <circle
            cx="70"
            cy="70"
            r="60"
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            className="text-gray-200 dark:text-gray-700"
          />
          {/* Progress circle */}
          <circle
            cx="70"
            cy="70"
            r="60"
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            strokeLinecap="round"
            className={getScoreColor(score)}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 70 70)"
            style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
          />
        </svg>

        {/* Score text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-bold ${getScoreColor(score)}`}>
            {score}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">/ 100</span>
        </div>
      </div>

      {/* Score label */}
      <div className={`mt-4 rounded-full px-4 py-2 ${getScoreBgColor(score)}`}>
        <span className={`text-sm font-semibold ${getScoreColor(score)}`}>
          {getScoreLabel(score)}
        </span>
      </div>
    </div>
  );
}
