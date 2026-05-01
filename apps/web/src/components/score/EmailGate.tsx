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
      <div className="bg-cr-score-excellent-soft border-cr-score-excellent/20 flex items-center justify-center gap-2 rounded-xl border p-6">
        <CheckCircle2 className="text-cr-score-excellent size-5" />
        <span className="text-cr-score-excellent font-medium">
          Unlocked! Loading full results...
        </span>
      </div>
    );
  }

  return (
    <div className="border-cr-primary/20 bg-cr-primary-soft rounded-xl border p-6">
      <div className="mb-4 flex items-center gap-2">
        <Lock className="text-cr-primary size-5" />
        <h4 className="text-cr-fg text-lg font-semibold">
          Unlock Full Report
        </h4>
      </div>
      <p className="text-cr-fg-secondary mb-4 text-sm">
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
            className="border-cr-border bg-cr-surface text-cr-fg placeholder:text-cr-fg-muted focus:border-cr-primary focus:ring-cr-primary/20 w-full rounded-lg border py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 disabled:opacity-50"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-cr-primary text-cr-primary-fg hover:bg-cr-primary-hover shrink-0 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {loading ? 'Unlocking...' : 'Unlock'}
        </button>
      </form>
      {error && (
        <div className="text-cr-score-critical mt-2 flex items-center gap-1.5 text-sm">
          <AlertCircle className="size-3.5" />
          {error}
        </div>
      )}
      <p className="text-cr-fg-muted mt-3 text-xs">
        No spam. We&apos;ll only send score change notifications.
      </p>
    </div>
  );
}
