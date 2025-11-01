'use client';

import { ArrowRight, CheckCircle2, Clock, Sparkles, Users } from 'lucide-react';
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
  const [loadingCount, setLoadingCount] = useState(true);

  // Fetch waitlist count on component mount
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
      } finally {
        setLoadingCount(false);
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, website }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join waitlist');
      }

      // Identify user by email for waitlist registrations
      posthog?.identify(email, {
        email,
        website,
        source: 'waitlist',
      });

      // Track successful waitlist registration
      posthog?.capture('waitlist_registration', {
        email,
        website,
        spots_left: spotsLeft,
        timestamp: new Date().toISOString(),
      });

      setSuccess(true);
      setEmail('');
      setWebsite('');

      // Update count after successful submission
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
        <div className="mx-auto max-w-4xl">
          {/* Main CTA Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-1">
            <div className="rounded-3xl bg-white p-12 dark:bg-gray-900 md:p-16">
              {/* Header */}
              <div className="mb-8 text-center">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-2 dark:bg-indigo-900/30">
                  <Sparkles className="size-5 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                    Limited Time: Early Access
                  </span>
                </div>

                <h2 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white md:text-5xl">
                  {spotsLeft > 0 ? 'Join the First 100 Users' : 'Join the Waitlist'}
                </h2>

                <p className="mx-auto max-w-2xl text-xl text-gray-600 dark:text-gray-300">
                  {spotsLeft > 0
                    ? (
                        <>
                          Get
                          {' '}
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">lifetime 50% discount</span>
                          ,
                          priority support, and help shape the future of AI crawler optimization.
                        </>
                      )
                    : (
                        <>
                          Early access spots are full! Join the waitlist to be notified when the next batch opens.
                          {' '}
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">Priority access guaranteed.</span>
                        </>
                      )}
                </p>
              </div>

              {/* Benefits */}
              <div className="mb-10 grid gap-4 md:grid-cols-3">
                <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
                  <CheckCircle2 className="mt-1 size-5 shrink-0 text-green-600" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">50% Off Forever</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Locked-in pricing for life</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
                  <Clock className="mt-1 size-5 shrink-0 text-indigo-600" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">5-Minute Setup</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">No code changes required</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
                  <Users className="mt-1 size-5 shrink-0 text-purple-600" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Direct Access</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Founding team support</p>
                  </div>
                </div>
              </div>

              {/* Urgency Banner - Only show when spots are limited */}
              {spotsLeft > 0 && spotsLeft <= 20 && (
                <div className="mb-6 animate-pulse rounded-lg bg-orange-50 p-4 text-center dark:bg-orange-900/20">
                  <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                    ⚠️ Only
                    {' '}
                    {spotsLeft}
                    {' '}
                    spots remaining! Act fast to secure your 50% lifetime discount.
                  </p>
                </div>
              )}

              {/* Signup Form */}
              <div className="mx-auto max-w-md">
                {success
                  ? (
                      <div className="rounded-lg bg-green-50 p-6 text-center dark:bg-green-900/20">
                        <CheckCircle2 className="mx-auto mb-3 size-12 text-green-600 dark:text-green-400" />
                        <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
                          You're on the list!
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          We'll notify you as soon as spots open up. Check your email for confirmation.
                        </p>
                      </div>
                    )
                  : (
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                          <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="Enter your work email"
                            className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-gray-900 transition-colors placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400"
                            required
                            disabled={loading}
                          />
                        </div>
                        <div>
                          <input
                            type="url"
                            value={website}
                            onChange={e => setWebsite(e.target.value)}
                            placeholder="Your website URL"
                            className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-gray-900 transition-colors placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400"
                            required
                            disabled={loading}
                          />
                        </div>
                        {error && (
                          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                            {error}
                          </div>
                        )}
                        <button
                          type="submit"
                          disabled={loading}
                          className={`${buttonVariants({ size: 'lg' })} group w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-lg shadow-xl transition-all hover:scale-[1.02] hover:shadow-2xl disabled:opacity-50 disabled:hover:scale-100`}
                        >
                          {loading
                            ? (
                                <>
                                  <div className="mr-2 size-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                  Joining...
                                </>
                              )
                            : (
                                <>
                                  {spotsLeft > 0 ? 'Claim Your 50% Discount' : 'Join Waitlist'}
                                  <ArrowRight className="ml-2 size-5 transition-transform group-hover:translate-x-1" />
                                </>
                              )}
                        </button>
                      </form>
                    )}

                {!success && (
                  <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    ✓ 14-day free trial • ✓ Cancel anytime • ✓ Money-back guarantee
                  </p>
                )}
              </div>

              {/* Social Proof */}
              <div className="mt-10 border-t border-gray-200 pt-8 text-center dark:border-gray-700">
                <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Join Tech Leaders Optimizing for AI Search
                </p>
                <div className="flex flex-wrap items-center justify-center gap-8">
                  <div className="text-center">
                    {loadingCount
                      ? (
                          <div className="flex items-center justify-center">
                            <div className="size-8 animate-spin rounded-full border-4 border-gray-300 border-t-indigo-600" />
                          </div>
                        )
                      : (
                          <>
                            <p className={`text-3xl font-bold ${spotsLeft === 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                              {spotsLeft}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {spotsLeft === 0 ? 'Spots Full' : 'Spots Remaining'}
                            </p>
                          </>
                        )}
                  </div>
                  <div className="h-8 w-px bg-gray-300 dark:bg-gray-700" />
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">400%</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">AI Search Growth</p>
                  </div>
                  <div className="h-8 w-px bg-gray-300 dark:bg-gray-700" />
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">&lt;200ms</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Render Speed</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
};
