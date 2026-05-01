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
            className="bg-cr-score-fair-soft border-cr-score-fair/20 flex items-start gap-3 rounded-lg border px-4 py-3"
          >
            <Icon className="text-cr-score-fair mt-0.5 size-5 shrink-0" />
            <p className="text-cr-score-fair text-sm">
              {w.message}
            </p>
          </div>
        );
      })}
    </div>
  );
}
