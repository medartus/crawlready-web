'use client';

import { ArrowRight, Mail, MessageCircle, Twitter } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { buttonVariants } from '@/components/ui/buttonVariants';
import { Section } from '@/features/landing/Section';
import { LandingFooter } from '@/templates/LandingFooter';
import { LandingNavbar } from '@/templates/LandingNavbar';

const ContactPage = () => {
  const _t = useTranslations('Contact');
  const [formState, setFormState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormState('submitting');

    // For now, just simulate a submission
    // In production, this would send to an API endpoint
    await new Promise(resolve => setTimeout(resolve, 1000));
    setFormState('success');
  };

  return (
    <>
      <LandingNavbar />

      {/* Hero Section */}
      <Section className="relative overflow-hidden py-20 md:py-28">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/20 dark:via-purple-950/20 dark:to-pink-950/20" />

        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 md:text-5xl dark:text-white">
            Get in Touch
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-gray-600 dark:text-gray-300">
            Have questions about CrawlReady? Want to discuss a partnership? We&apos;d love to hear from you.
          </p>
        </div>
      </Section>

      {/* Contact Options */}
      <Section className="border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-8 md:grid-cols-3">
            {/* Twitter */}
            <a
              href="https://twitter.com/medartus"
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-2xl border border-gray-200 bg-white p-8 text-center transition-all hover:border-indigo-300 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800 dark:hover:border-indigo-600"
            >
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-lg transition-transform group-hover:scale-110">
                <Twitter className="size-8" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
                Twitter / X
              </h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                Fastest way to reach us. DMs are open!
              </p>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                @medartus
              </span>
            </a>

            {/* Email */}
            <a
              href="mailto:hello@crawlready.com"
              className="group rounded-2xl border border-gray-200 bg-white p-8 text-center transition-all hover:border-indigo-300 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800 dark:hover:border-indigo-600"
            >
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg transition-transform group-hover:scale-110">
                <Mail className="size-8" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
                Email
              </h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                For detailed inquiries and partnerships.
              </p>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                hello@crawlready.com
              </span>
            </a>

            {/* Support */}
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg">
                <MessageCircle className="size-8" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
                Support
              </h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                Technical help for existing customers.
              </p>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                support@crawlready.com
              </span>
            </div>
          </div>
        </div>
      </Section>

      {/* Contact Form */}
      <Section className="border-t border-gray-200 bg-gradient-to-br from-gray-50 to-white dark:border-gray-700 dark:from-gray-900 dark:to-gray-800">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-8 text-center text-3xl font-bold text-gray-900 dark:text-white">
            Send Us a Message
          </h2>

          {formState === 'success'
            ? (
                <div className="rounded-2xl border-2 border-green-200 bg-green-50 p-8 text-center dark:border-green-800 dark:bg-green-950/30">
                  <div className="mb-4 text-5xl">✓</div>
                  <h3 className="mb-2 text-xl font-bold text-green-900 dark:text-green-100">
                    Message Sent!
                  </h3>
                  <p className="mb-6 text-green-700 dark:text-green-300">
                    Thanks for reaching out. We&apos;ll get back to you as soon as possible.
                  </p>
                  <button
                    type="button"
                    onClick={() => setFormState('idle')}
                    className={buttonVariants({ variant: 'outline' })}
                  >
                    Send Another Message
                  </button>
                </div>
              )
            : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                        Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        placeholder="you@company.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                      Subject
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      required
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="">Select a topic</option>
                      <option value="general">General Inquiry</option>
                      <option value="sales">Sales / Pricing</option>
                      <option value="support">Technical Support</option>
                      <option value="partnership">Partnership</option>
                      <option value="press">Press / Media</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="website" className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                      Website URL
                      {' '}
                      <span className="text-gray-500">(optional)</span>
                    </label>
                    <input
                      type="url"
                      id="website"
                      name="website"
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      placeholder="https://yoursite.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={5}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      placeholder="Tell us how we can help..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={formState === 'submitting'}
                    className={`${buttonVariants({ size: 'lg' })} w-full gap-2`}
                  >
                    {formState === 'submitting'
                      ? (
                          <>
                            <svg className="size-5 animate-spin" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Sending...
                          </>
                        )
                      : (
                          <>
                            Send Message
                            <ArrowRight className="size-5" />
                          </>
                        )}
                  </button>
                </form>
              )}
        </div>
      </Section>

      {/* FAQ Link */}
      <Section className="border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
            Looking for Quick Answers?
          </h2>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            Check out our FAQ section for answers to common questions about CrawlReady.
          </p>
          <Link
            href="/#faq"
            className={`${buttonVariants({ variant: 'outline' })} gap-2`}
          >
            View FAQ
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </Section>

      <LandingFooter />
    </>
  );
};

export default ContactPage;
