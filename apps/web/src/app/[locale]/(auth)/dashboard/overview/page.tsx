'use client';

import { Activity, AlertTriangle, ArrowRight, CheckCircle2, Globe, Key, RefreshCw, TrendingUp, Zap } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { buttonVariants } from '@/components/ui/buttonVariants';
import { TitleBar } from '@/features/dashboard/TitleBar';

type OverviewData = {
  healthScore: number;
  sites: Array<{
    id: string;
    domain: string;
    status: 'active' | 'pending' | 'error';
    healthScore: number;
  }>;
  stats: {
    rendersToday: number;
    rendersChange: number;
    cacheHitRate: number;
    aiCrawlersToday: number;
    activeAlerts: number;
  };
  recentActivity: Array<{
    id: string;
    type: 'crawler_visit' | 'render' | 'error' | 'cache_hit';
    crawlerName?: string;
    url: string;
    timestamp: string;
  }>;
  alerts: Array<{
    id: string;
    type: 'warning' | 'error' | 'info';
    title: string;
    message: string;
    dismissible: boolean;
  }>;
  integrationStatus: {
    isConnected: boolean;
    lastCheck: string | null;
    rendersThisWeek: number;
  };
  apiKey?: {
    prefix: string;
    suffix: string;
    lastUsed: string | null;
  };
};

function HealthScoreCircle({ score }: { score: number }) {
  const getColor = (s: number) => {
    if (s >= 80) {
      return { bg: 'bg-green-500', text: 'text-green-500', label: 'Excellent' };
    }
    if (s >= 60) {
      return { bg: 'bg-yellow-500', text: 'text-yellow-500', label: 'Good' };
    }
    if (s >= 40) {
      return { bg: 'bg-orange-500', text: 'text-orange-500', label: 'Fair' };
    }
    return { bg: 'bg-red-500', text: 'text-red-500', label: 'Poor' };
  };

  const { text, label } = getColor(score);
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="size-32 -rotate-90">
        <circle
          cx="64"
          cy="64"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-gray-200 dark:text-gray-700"
        />
        <circle
          cx="64"
          cy="64"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          className={text}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-3xl font-bold ${text}`}>{score}</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  change,
  changeLabel,
  colorClass,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  colorClass: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center gap-3">
        <div className={`flex size-10 items-center justify-center rounded-lg ${colorClass}`}>
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            {change !== undefined && (
              <span className={`text-xs font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {change >= 0 ? '+' : ''}
                {change}
                %
                {changeLabel && <span className="ml-1 text-gray-400">{changeLabel}</span>}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AlertBanner({ alert, onDismiss }: { alert: OverviewData['alerts'][0]; onDismiss: (id: string) => void }) {
  const styles = {
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200',
    error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200',
    info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200',
  };

  const icons = {
    warning: <AlertTriangle className="size-5" />,
    error: <AlertTriangle className="size-5" />,
    info: <Activity className="size-5" />,
  };

  return (
    <div className={`flex items-start gap-3 rounded-lg border p-4 ${styles[alert.type]}`}>
      {icons[alert.type]}
      <div className="flex-1">
        <p className="font-medium">{alert.title}</p>
        <p className="text-sm opacity-90">{alert.message}</p>
      </div>
      {alert.dismissible && (
        <button type="button" onClick={() => onDismiss(alert.id)} className="opacity-60 hover:opacity-100">
          ✕
        </button>
      )}
    </div>
  );
}

function ActivityItem({ item }: { item: OverviewData['recentActivity'][0] }) {
  const icons = {
    crawler_visit: { icon: '🤖', label: 'AI Crawler Visit' },
    render: { icon: '⚡', label: 'Page Rendered' },
    error: { icon: '⚠️', label: 'Error' },
    cache_hit: { icon: '✓', label: 'Cache Hit' },
  };

  const { icon, label } = icons[item.type];
  const timeAgo = new Date(item.timestamp).toLocaleTimeString();

  return (
    <div className="flex items-center gap-3 border-b border-gray-100 py-3 last:border-0 dark:border-gray-700">
      <span className="text-lg">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
          {item.crawlerName ? `${item.crawlerName} - ` : ''}
          {label}
        </p>
        <p className="truncate text-xs text-gray-500 dark:text-gray-400">{item.url}</p>
      </div>
      <span className="whitespace-nowrap text-xs text-gray-400">{timeAgo}</span>
    </div>
  );
}

function ApiKeyCard({
  apiKey,
  onCreateKey,
  isCreating,
}: {
  apiKey?: OverviewData['apiKey'];
  onCreateKey: () => void;
  isCreating: boolean;
}) {
  if (apiKey) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white">API Key</h3>
          <Key className="size-5 text-gray-400" />
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-3 font-mono text-sm dark:bg-gray-900">
            <span className="text-gray-600 dark:text-gray-400">
              {apiKey.prefix}
              ...
            </span>
            <span className="text-gray-900 dark:text-white">{apiKey.suffix}</span>
          </div>
          {apiKey.lastUsed && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Last used:
              {' '}
              {new Date(apiKey.lastUsed).toLocaleDateString()}
            </p>
          )}
        </div>
        <Link
          href="/dashboard/api-keys"
          className={`${buttonVariants({ variant: 'outline', size: 'sm' })} mt-4 w-full`}
        >
          Manage API Keys
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white">API Key</h3>
        <Key className="size-5 text-gray-400" />
      </div>
      <div className="space-y-3">
        <div className="rounded-lg border-2 border-dashed border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            No API key yet
          </p>
          <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
            Create an API key to start serving pre-rendered pages to AI crawlers.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onCreateKey}
        disabled={isCreating}
        className={`${buttonVariants({ variant: 'default', size: 'sm' })} mt-4 w-full`}
      >
        {isCreating ? 'Creating...' : 'Create API Key'}
      </button>
    </div>
  );
}

export default function DashboardOverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/user/dashboard/overview');
      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else {
        // Set default data for new users
        setData({
          healthScore: 0,
          sites: [],
          stats: {
            rendersToday: 0,
            rendersChange: 0,
            cacheHitRate: 0,
            aiCrawlersToday: 0,
            activeAlerts: 0,
          },
          recentActivity: [],
          alerts: [],
          integrationStatus: {
            isConnected: false,
            lastCheck: null,
            rendersThisWeek: 0,
          },
        });
      }
    } catch {
      // Set default data on error
      setData({
        healthScore: 0,
        sites: [],
        stats: {
          rendersToday: 0,
          rendersChange: 0,
          cacheHitRate: 0,
          aiCrawlersToday: 0,
          activeAlerts: 0,
        },
        recentActivity: [],
        alerts: [],
        integrationStatus: {
          isConnected: false,
          lastCheck: null,
          rendersThisWeek: 0,
        },
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  const handleDismissAlert = async (alertId: string) => {
    try {
      await fetch('/api/user/dashboard/dismiss-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId }),
      });
      setData(prev =>
        prev
          ? { ...prev, alerts: prev.alerts.filter(a => a.id !== alertId) }
          : null,
      );
    } catch {
      // Ignore dismiss errors
    }
  };

  const handleCreateApiKey = useCallback(async () => {
    setIsCreatingKey(true);
    try {
      const response = await fetch('/api/admin/generate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: 'free' }),
      });

      if (response.ok) {
        const result = await response.json();
        setNewApiKey(result.key);
        // Refresh data to show new key
        fetchData();
      }
    } catch {
      // Handle error
    } finally {
      setIsCreatingKey(false);
    }
  }, []);

  if (isLoading) {
    return (
      <>
        <TitleBar title="Overview" description="Your AI visibility dashboard" />
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="size-8 animate-spin text-gray-400" />
        </div>
      </>
    );
  }

  const hasNoSites = !data?.sites || data.sites.length === 0;

  return (
    <>
      <TitleBar
        title="Overview"
        description="Your AI visibility dashboard"
      />

      <div className="space-y-6">
        {/* Alerts */}
        {data?.alerts && data.alerts.length > 0 && (
          <div className="space-y-3">
            {data.alerts.map(alert => (
              <AlertBanner key={alert.id} alert={alert} onDismiss={handleDismissAlert} />
            ))}
          </div>
        )}

        {/* New User CTA */}
        {hasNoSites && (
          <div className="rounded-xl border-2 border-dashed border-indigo-300 bg-gradient-to-r from-indigo-50 to-purple-50 p-8 text-center dark:border-indigo-700 dark:from-indigo-950/30 dark:to-purple-950/30">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/50">
              <Globe className="size-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
              Add Your First Site
            </h3>
            <p className="mx-auto mb-6 max-w-md text-gray-600 dark:text-gray-400">
              Start making your website visible to AI crawlers like ChatGPT, Claude, and Perplexity.
            </p>
            <Link
              href="/onboarding/add-site"
              className={`${buttonVariants({ variant: 'default', size: 'lg' })} gap-2`}
            >
              Get Started
              <ArrowRight className="size-4" />
            </Link>
          </div>
        )}

        {/* New API Key Modal */}
        {newApiKey && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
                  <CheckCircle2 className="size-5 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">API Key Created!</h3>
              </div>
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                Save this key now - you won&apos;t be able to see it again.
              </p>
              <div className="mb-4 overflow-x-auto rounded-lg bg-gray-900 p-3">
                <code className="whitespace-nowrap font-mono text-sm text-green-400">{newApiKey}</code>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(newApiKey);
                  }}
                  className={buttonVariants({ variant: 'outline', size: 'sm' })}
                >
                  Copy to Clipboard
                </button>
                <button
                  type="button"
                  onClick={() => setNewApiKey(null)}
                  className={buttonVariants({ variant: 'default', size: 'sm' })}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        {!hasNoSites && (
          <>
            <div className="grid gap-6 lg:grid-cols-4">
              {/* Health Score */}
              <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white">AI Visibility Score</h3>
                  <button
                    type="button"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <RefreshCw className={`size-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                <div className="flex justify-center">
                  <HealthScoreCircle score={data?.healthScore || 0} />
                </div>
                <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  Based on your site configuration and crawler activity
                </p>
              </div>

              {/* Integration Status */}
              <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">Integration Status</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    {data?.integrationStatus.isConnected
                      ? (
                          <CheckCircle2 className="size-6 text-green-500" />
                        )
                      : (
                          <AlertTriangle className="size-6 text-yellow-500" />
                        )}
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {data?.integrationStatus.isConnected ? 'Connected' : 'Not Connected'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {data?.integrationStatus.lastCheck
                          ? `Last verified ${new Date(data.integrationStatus.lastCheck).toLocaleDateString()}`
                          : 'Verify your integration'}
                      </p>
                    </div>
                  </div>
                  <div className="border-t border-gray-100 pt-3 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Renders this week</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {data?.integrationStatus.rendersThisWeek || 0}
                    </p>
                  </div>
                </div>
                <Link
                  href="/dashboard/test-render"
                  className={`${buttonVariants({ variant: 'outline', size: 'sm' })} mt-4 w-full`}
                >
                  Test Integration
                </Link>
              </div>

              {/* API Key */}
              <ApiKeyCard
                apiKey={data?.apiKey}
                onCreateKey={handleCreateApiKey}
                isCreating={isCreatingKey}
              />

              {/* Recent Activity */}
              <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
                  <Link href="/dashboard/activity" className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                    View all
                  </Link>
                </div>
                {data?.recentActivity && data.recentActivity.length > 0
                  ? (
                      <div className="space-y-1">
                        {data.recentActivity.slice(0, 5).map(item => (
                          <ActivityItem key={item.id} item={item} />
                        ))}
                      </div>
                    )
                  : (
                      <div className="py-8 text-center">
                        <Activity className="mx-auto mb-2 size-8 text-gray-300 dark:text-gray-600" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">No recent activity</p>
                      </div>
                    )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 sm:grid-cols-4">
              <StatCard
                icon={Zap}
                label="Renders Today"
                value={data?.stats.rendersToday || 0}
                change={data?.stats.rendersChange}
                changeLabel="vs yesterday"
                colorClass="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
              />
              <StatCard
                icon={TrendingUp}
                label="Cache Hit Rate"
                value={`${data?.stats.cacheHitRate || 0}%`}
                colorClass="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
              />
              <StatCard
                icon={() => <span className="text-lg">🤖</span>}
                label="AI Crawlers Today"
                value={data?.stats.aiCrawlersToday || 0}
                colorClass="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
              />
              <StatCard
                icon={AlertTriangle}
                label="Active Alerts"
                value={data?.stats.activeAlerts || 0}
                colorClass={`${data?.stats.activeAlerts ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400'}`}
              />
            </div>
          </>
        )}

        {/* Quick Links */}
        <section className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">
            Quick Actions
          </h3>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/sites" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              Manage Sites
            </Link>
            <Link href="/dashboard/pages" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              View Rendered Pages
            </Link>
            <Link href="/dashboard/analytics" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              View Analytics
            </Link>
            <Link href="/docs" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              Documentation
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
