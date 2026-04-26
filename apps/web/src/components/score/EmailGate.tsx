'use client';

import { AlertCircle, CheckCircle2, Lock, Mail } from 'lucide-react';
import { useState } from 'react';

import { api } from '@/libs/api-client';

type EmailGateProps = {
  domain: string;
  onUnlocked: () => void;
};

export function EmailGate({ domain, onUnlocked }: EmailGateProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmed = email.trim();
    if (!trimmed) {
      setError('Please enter your email');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/v1/subscribe', {
        email: trimmed,
        domain,
        source: 'email_gate',
      });

      if (response.ok || response.status === 409) {
        // 409 = already subscribed, still unlock
        setSuccess(true);
        setTimeout(() => onUnlocked(), 800);
      } else {
        const data = await response.json();
        setError(data?.error?.message ?? 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-800 dark:bg-emerald-950/20">
        <CheckCircle2 className="size-5 text-emerald-600" />
        <span className="font-medium text-emerald-700 dark:text-emerald-300">
          Unlocked! Loading full results...
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 p-6 dark:border-indigo-800 dark:from-indigo-950/30 dark:to-purple-950/30">
      <div className="mb-4 flex items-center gap-2">
        <Lock className="size-5 text-indigo-600 dark:text-indigo-400" />
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
          Unlock Full Report
        </h4>
      </div>
      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        Enter your email to see all recommendations, schema generation preview,
        and get notified when your score changes.
      </p>
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@company.com"
            disabled={loading}
            className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="shrink-0 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Unlocking...' : 'Unlock'}
        </button>
      </form>
      {error && (
        <div className="mt-2 flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="size-3.5" />
          {error}
        </div>
      )}
      <p className="mt-3 text-xs text-gray-500 dark:text-gray-500">
        No spam. We&apos;ll only send score change notifications.
      </p>
    </div>
  );
}
