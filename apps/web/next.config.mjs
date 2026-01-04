import { fileURLToPath } from 'node:url';

import { withSentryConfig } from '@sentry/nextjs';
import createJiti from 'jiti';
import createNextIntlPlugin from 'next-intl/plugin';

const jiti = createJiti(fileURLToPath(import.meta.url));

jiti('./src/libs/Env');

const withNextIntl = createNextIntlPlugin('./src/libs/i18n/request.ts');

// Conditionally use bundle analyzer - only import if ANALYZE is enabled
let bundleAnalyzer = config => config; // No-op by default

if (process.env.ANALYZE === 'true') {
  try {
    const { default: withBundleAnalyzer } = await import('@next/bundle-analyzer');
    bundleAnalyzer = withBundleAnalyzer({ enabled: true });
  } catch (e) {
    console.warn('Bundle analyzer not available:', e.message);
  }
}

/** @type {import('next').NextConfig} */
export default withSentryConfig(
  bundleAnalyzer(
    withNextIntl({
      eslint: {
        dirs: ['.'],
      },
      poweredByHeader: false,
      reactStrictMode: true,
      experimental: {
        serverComponentsExternalPackages: ['@electric-sql/pglite'],
      },
      async rewrites() {
        return [
          {
            source: '/ingest/static/:path*',
            destination: 'https://us-assets.i.posthog.com/static/:path*',
          },
          {
            source: '/ingest/:path*',
            destination: 'https://us.i.posthog.com/:path*',
          },
          {
            source: '/ingest/decide',
            destination: 'https://us.i.posthog.com/decide',
          },
        ];
      },
      // This is required to support PostHog trailing slash API requests
      skipTrailingSlashRedirect: true,
    }),
  ),
  {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options
    // FIXME: Add your Sentry organization and project names
    org: 'nextjs-boilerplate-org',
    project: 'nextjs-boilerplate',

    // Only print logs for uploading source maps in CI
    silent: !process.env.CI,

    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
    // This can increase your server load as well as your hosting bill.
    // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
    // side errors will fail.
    tunnelRoute: '/monitoring',

    // Hides source maps from generated client bundles
    hideSourceMaps: true,

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,

    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Disable Sentry telemetry
    telemetry: false,
  },
);
