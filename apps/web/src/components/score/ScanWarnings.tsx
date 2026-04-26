'use client';

import { AlertTriangle, Ban, Clock, FileX, Globe, Lock } from 'lucide-react';

type ScanWarning = {
  code: string;
  message: string;
};

const WARNING_ICONS: Record<string, typeof AlertTriangle> = {
  BOT_BLOCKED: Ban,
  BOT_TIMEOUT: Clock,
  EMPTY_PAGE: FileX,
  LOGIN_WALL: Lock,
  REDIRECT_DOMAIN: Globe,
};

export function ScanWarnings({ warnings }: { warnings: ScanWarning[] }) {
  if (!warnings || warnings.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {warnings.map((w) => {
        const Icon = WARNING_ICONS[w.code] ?? AlertTriangle;
        return (
          <div
            key={w.code}
            className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/20"
          >
            <Icon className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-sm text-amber-800 dark:text-amber-300">
              {w.message}
            </p>
          </div>
        );
      })}
    </div>
  );
}
