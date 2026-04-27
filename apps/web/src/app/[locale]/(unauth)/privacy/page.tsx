import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Section } from '@/features/landing/Section';
import { LandingFooter } from '@/templates/LandingFooter';
import { LandingNavbar } from '@/templates/LandingNavbar';

export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: 'Privacy',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

const PrivacyPage = async (props: { params: Promise<{ locale: string }> }) => {
  const { locale } = await props.params;
  setRequestLocale(locale);

  return (
    <>
      <LandingNavbar />

      <Section className="py-16 md:py-24">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-8 text-4xl font-bold text-gray-900 dark:text-white">
            Privacy Policy
          </h1>

          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Last updated: January 2026
            </p>

            <h2>1. Introduction</h2>
            <p>
              CrawlReady (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy.
              This Privacy Policy explains how we collect, use, disclose, and safeguard your
              information when you use our website and services.
            </p>

            <h2>2. Information We Collect</h2>

            <h3>2.1 Information You Provide</h3>
            <ul>
              <li>
                <strong>Account Information:</strong>
                {' '}
                When you create an account, we collect your email address, name, and organization details.
              </li>
              <li>
                <strong>Payment Information:</strong>
                {' '}
                Payment processing is handled by our third-party payment processor (Stripe). We do not store your full credit card details.
              </li>
              <li>
                <strong>Website URLs:</strong>
                {' '}
                When you use our crawler checker or rendering services, we process the URLs you submit.
              </li>
              <li>
                <strong>Communications:</strong>
                {' '}
                When you contact us, we collect the information you provide in your messages.
              </li>
            </ul>

            <h3>2.2 Information Collected Automatically</h3>
            <ul>
              <li>
                <strong>Usage Data:</strong>
                {' '}
                We collect information about how you use our services, including pages visited, features used, and actions taken.
              </li>
              <li>
                <strong>Device Information:</strong>
                {' '}
                We collect device type, browser type, IP address, and operating system.
              </li>
              <li>
                <strong>Analytics:</strong>
                {' '}
                We use PostHog for product analytics to understand how users interact with our services.
              </li>
            </ul>

            <h2>3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Send technical notices, updates, and support messages</li>
              <li>Respond to your comments, questions, and requests</li>
              <li>Monitor and analyze trends, usage, and activities</li>
              <li>Detect, investigate, and prevent fraudulent transactions and abuse</li>
              <li>Personalize and improve your experience</li>
            </ul>

            <h2>4. Information Sharing</h2>
            <p>We may share your information in the following circumstances:</p>
            <ul>
              <li>
                <strong>Service Providers:</strong>
                {' '}
                We share information with third-party vendors who perform services on our behalf (hosting, analytics, payment processing).
              </li>
              <li>
                <strong>Legal Requirements:</strong>
                {' '}
                We may disclose information if required by law or in response to valid legal requests.
              </li>
              <li>
                <strong>Business Transfers:</strong>
                {' '}
                In connection with any merger, sale of company assets, or acquisition.
              </li>
              <li>
                <strong>With Your Consent:</strong>
                {' '}
                We may share information with your consent or at your direction.
              </li>
            </ul>

            <h2>5. Third-Party Services</h2>
            <p>We use the following third-party services:</p>
            <ul>
              <li>
                <strong>Clerk:</strong>
                {' '}
                For authentication and user management
              </li>
              <li>
                <strong>Stripe:</strong>
                {' '}
                For payment processing
              </li>
              <li>
                <strong>PostHog:</strong>
                {' '}
                For product analytics
              </li>
              <li>
                <strong>Sentry:</strong>
                {' '}
                For error tracking and monitoring
              </li>
              <li>
                <strong>Vercel:</strong>
                {' '}
                For hosting and deployment
              </li>
              <li>
                <strong>Supabase:</strong>
                {' '}
                For database and storage
              </li>
            </ul>

            <h2>6. Data Retention</h2>
            <p>
              We retain your information for as long as your account is active or as needed to
              provide you services. We will retain and use your information as necessary to comply
              with our legal obligations, resolve disputes, and enforce our agreements.
            </p>

            <h2>7. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your
              personal information. However, no method of transmission over the Internet or
              electronic storage is 100% secure.
            </p>

            <h2>8. Your Rights</h2>
            <p>Depending on your location, you may have the following rights:</p>
            <ul>
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your information</li>
              <li>Object to or restrict processing</li>
              <li>Data portability</li>
              <li>Withdraw consent</li>
            </ul>
            <p>
              To exercise these rights, please contact us at
              {' '}
              <a href="mailto:privacy@crawlready.com" className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                privacy@crawlready.com
              </a>
              .
            </p>

            <h2>9. Cookies</h2>
            <p>
              We use cookies and similar tracking technologies to collect information and improve
              our services. You can control cookies through your browser settings.
            </p>

            <h2>10. Children&apos;s Privacy</h2>
            <p>
              Our services are not directed to children under 16. We do not knowingly collect
              personal information from children under 16.
            </p>

            <h2>11. International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your
              own. We ensure appropriate safeguards are in place for such transfers.
            </p>

            <h2>12. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any
              changes by posting the new Privacy Policy on this page and updating the
              &quot;Last updated&quot; date.
            </p>

            <h2>13. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us:
            </p>
            <ul>
              <li>
                Email:
                {' '}
                <a href="mailto:privacy@crawlready.com" className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                  privacy@crawlready.com
                </a>
              </li>
              <li>
                Twitter:
                {' '}
                <a href="https://twitter.com/medartus" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                  @medartus
                </a>
              </li>
            </ul>
          </div>
        </div>
      </Section>

      <LandingFooter />
    </>
  );
};

export default PrivacyPage;
