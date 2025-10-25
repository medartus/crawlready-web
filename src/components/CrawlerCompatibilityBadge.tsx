'use client';

import type { CrawlerCompatibility } from '@/types/crawler-checker';

interface CrawlerBadgeProps {
  name: string;
  vendor: string;
  status: 'full' | 'partial' | 'poor';
  icon?: string;
}

function CrawlerBadge({ name, vendor, status, icon }: CrawlerBadgeProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'full':
        return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-400 dark:border-green-700';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-700';
      case 'poor':
        return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'full':
        return '✓';
      case 'partial':
        return '!';
      case 'poor':
        return '✗';
      default:
        return '?';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'full':
        return 'Full Support';
      case 'partial':
        return 'Partial Support';
      case 'poor':
        return 'Poor Support';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className={`flex items-center justify-between rounded-lg border-2 p-4 ${getStatusColor(status)}`}>
      <div className="flex items-center gap-3">
        {icon && <span className="text-2xl">{icon}</span>}
        <div>
          <div className="font-semibold">{name}</div>
          <div className="text-xs opacity-75">{vendor}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold">{getStatusIcon(status)}</span>
        <span className="text-sm font-medium">{getStatusLabel(status)}</span>
      </div>
    </div>
  );
}

interface CrawlerCompatibilityBadgeProps {
  compatibility: CrawlerCompatibility;
  className?: string;
}

export function CrawlerCompatibilityBadge({ compatibility, className = '' }: CrawlerCompatibilityBadgeProps) {
  const crawlers = [
    { name: 'ChatGPT', vendor: 'OpenAI', key: 'GPTBot', icon: '🤖' },
    { name: 'Claude', vendor: 'Anthropic', key: 'ClaudeBot', icon: '🧠' },
    { name: 'Perplexity', vendor: 'Perplexity AI', key: 'PerplexityBot', icon: '🔍' },
    { name: 'Googlebot', vendor: 'Google', key: 'GoogleBot', icon: '🌐' },
  ];

  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
        AI Crawler Compatibility
      </h3>
      {crawlers.map(crawler => (
        <CrawlerBadge
          key={crawler.key}
          name={crawler.name}
          vendor={crawler.vendor}
          status={compatibility[crawler.key as keyof CrawlerCompatibility]}
          icon={crawler.icon}
        />
      ))}
    </div>
  );
}
