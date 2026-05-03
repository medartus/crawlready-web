'use client';

import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useState } from 'react';

import { buttonVariants } from '@/components/ui/buttonVariants';
import { Section } from '@/features/landing/Section';

export const CTA = () => {
  const posthog = usePostHog();
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [spotsLeft, setSpotsLeft] = useState<number>(100);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await fetch('/api/waitlist/count');
        const data = await response.json();
        if (data.success) {
          setSpotsLeft(data.spotsLeft);
        }
      } catch (err) {
        console.error('Failed to fetch waitlist count:', err);
      }
    };

    fetchCount();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, website }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join waitlist');
      }

      posthog?.identify(email, { email, website, source: 'waitlist' });
      posthog?.capture('waitlist_registration', {
        email,
        website,
        spots_left: spotsLeft,
        timestamp: new Date().toISOString(),
      });

      setSuccess(true);
      setEmail('');
      setWebsite('');

      if (data.count) {
        setSpotsLeft(Math.max(0, 100 - data.count));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="early-access">
      <Section className="py-20">
        <div className="mx-auto max-w-lg">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-cr-fg">
              {spotsLeft > 0 ? 'Join early access' : 'Join the waitlist'}
            </h2>
            <p className="mt-3 text-lg text-cr-fg-secondary">
              {spotsLeft > 0
                ? 'Early access users get 50% off for life, priority support, and input on the roadmap.'
                : 'Spots are full. Join the waitlist and we\'ll notify you when the next batch opens.'}
            </p>
            {spotsLeft > 0 && (
              <p className="mt-2 text-sm text-cr-fg-muted">
                {spotsLeft}
                {' '}
                of 100 spots remaining
              </p>
            )}
          </div>

          <div className="mt-8">
            {success
              ? (
                  <div className="rounded-xl border border-cr-border bg-cr-bg p-6 text-center">
                    <CheckCircle2 className="mx-auto mb-3 size-10 text-cr-score-good" />
                    <h3 className="text-lg font-semibold text-cr-fg">You're on the list</h3>
                    <p className="mt-1 text-cr-fg-secondary">
                      Check your email for confirmation. We'll reach out when your access is ready.
                    </p>
                  </div>
                )
              : (
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                      <label htmlFor="cta-email" className="sr-only">Work email</label>
                      <input
                        id="cta-email"
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="Work email"
                        className="w-full rounded-lg border border-cr-border bg-cr-bg px-4 py-3 text-cr-fg transition-colors placeholder:text-cr-fg-muted focus:border-cr-primary focus:outline-none"
                        required
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label htmlFor="cta-website" className="sr-only">Website URL</label>
                      <input
                        id="cta-website"
                        type="url"
                        value={website}
                        onChange={e => setWebsite(e.target.value)}
                        placeholder="Website URL"
                        className="w-full rounded-lg border border-cr-border bg-cr-bg px-4 py-3 text-cr-fg transition-colors placeholder:text-cr-fg-muted focus:border-cr-primary focus:outline-none"
                        required
                        disabled={loading}
                      />
                    </div>
                    {error && (
                      <div className="rounded-lg bg-cr-score-critical-soft p-3 text-sm text-cr-score-critical">
                        {error}
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={loading}
                      className={`${buttonVariants({ size: 'lg' })} w-full bg-cr-primary text-cr-primary-fg transition-colors hover:bg-cr-primary-hover disabled:opacity-50`}
                    >
                      {loading
                        ? (
                            <>
                              <div className="mr-2 size-5 animate-spin rounded-full border-2 border-cr-primary-fg border-t-transparent" />
                              Joining...
                            </>
                          )
                        : (
                            <>
                              {spotsLeft > 0 ? 'Join early access' : 'Join waitlist'}
                              <ArrowRight className="ml-2 size-5" />
                            </>
                          )}
                    </button>
                  </form>
                )}

            {!success && (
              <p className="mt-4 text-center text-sm text-cr-fg-muted">
                No credit card required. Cancel anytime.
              </p>
            )}
          </div>
        </div>
      </Section>
    </div>
  );
};
