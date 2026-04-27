import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Section } from '@/features/landing/Section';
import { LandingFooter } from '@/templates/LandingFooter';
import { LandingNavbar } from '@/templates/LandingNavbar';

export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: 'Terms',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

const TermsPage = async (props: { params: Promise<{ locale: string }> }) => {
  const { locale } = await props.params;
  setRequestLocale(locale);

  return (
    <>
      <LandingNavbar />

      <Section className="py-16 md:py-24">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-8 text-4xl font-bold text-gray-900 dark:text-white">
            Terms of Service
          </h1>

          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Last updated: January 2026
            </p>

            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using CrawlReady&apos;s services, you agree to be bound by these Terms
              of Service (&quot;Terms&quot;). If you do not agree to these Terms, you may not use our
              services.
            </p>

            <h2>2. Description of Service</h2>
            <p>
              CrawlReady provides AI crawler optimization services, including but not limited to:
            </p>
            <ul>
              <li>JavaScript pre-rendering for AI crawlers</li>
              <li>AI crawler compatibility checking</li>
              <li>Schema markup analysis and optimization</li>
              <li>AI citation tracking and analytics</li>
              <li>Caching and content delivery optimization</li>
            </ul>

            <h2>3. Account Registration</h2>
            <p>
              To use certain features of our services, you must create an account. You agree to:
            </p>
            <ul>
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Promptly update any changes to your information</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>

            <h2>4. Acceptable Use</h2>
            <p>You agree not to use our services to:</p>
            <ul>
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on intellectual property rights</li>
              <li>Transmit malware, viruses, or harmful code</li>
              <li>Engage in unauthorized access or hacking</li>
              <li>Send spam or unsolicited communications</li>
              <li>Interfere with or disrupt our services</li>
              <li>Attempt to reverse engineer our technology</li>
              <li>Use our services for illegal or fraudulent purposes</li>
            </ul>

            <h2>5. Subscription and Payment</h2>

            <h3>5.1 Pricing</h3>
            <p>
              Our services are offered on a subscription basis. Prices are as displayed on our
              website and may be subject to change with notice.
            </p>

            <h3>5.2 Billing</h3>
            <p>
              Subscriptions are billed in advance on a monthly or annual basis. Payment is due
              at the start of each billing period.
            </p>

            <h3>5.3 Refunds</h3>
            <p>
              We offer a 14-day money-back guarantee for new subscriptions. After this period,
              refunds are provided at our discretion.
            </p>

            <h3>5.4 Cancellation</h3>
            <p>
              You may cancel your subscription at any time. Access continues until the end of
              the current billing period.
            </p>

            <h2>6. Free Tools</h2>
            <p>
              Our free tools (AI Crawler Checker, Schema Checker) are provided &quot;as is&quot; without
              warranty. We reserve the right to modify, limit, or discontinue free tools at
              any time.
            </p>

            <h2>7. Intellectual Property</h2>

            <h3>7.1 Our Property</h3>
            <p>
              CrawlReady and its licensors retain all rights to our services, including software,
              content, trademarks, and other intellectual property.
            </p>

            <h3>7.2 Your Content</h3>
            <p>
              You retain ownership of content you submit to our services. By using our services,
              you grant us a license to process your content as necessary to provide the services.
            </p>

            <h2>8. Privacy</h2>
            <p>
              Your use of our services is also governed by our
              {' '}
              <a href="/privacy" className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                Privacy Policy
              </a>
              , which is incorporated into these Terms by reference.
            </p>

            <h2>9. Disclaimer of Warranties</h2>
            <p>
              OUR SERVICES ARE PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY
              KIND, EXPRESS OR IMPLIED. WE DO NOT GUARANTEE THAT OUR SERVICES WILL BE
              UNINTERRUPTED, ERROR-FREE, OR SECURE.
            </p>

            <h2>10. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, CRAWLREADY SHALL NOT BE LIABLE FOR ANY
              INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS
              OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY.
            </p>
            <p>
              OUR TOTAL LIABILITY FOR ANY CLAIMS ARISING FROM THESE TERMS OR YOUR USE OF OUR
              SERVICES SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE TWELVE (12) MONTHS
              PRECEDING THE CLAIM.
            </p>

            <h2>11. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless CrawlReady and its officers, directors,
              employees, and agents from any claims, damages, losses, or expenses arising from
              your use of our services or violation of these Terms.
            </p>

            <h2>12. Service Level Agreement</h2>
            <p>
              For paid subscriptions, we target 99.9% uptime for our rendering services. Service
              credits may be available for extended outages as described in our SLA documentation.
            </p>

            <h2>13. Modifications to Terms</h2>
            <p>
              We may modify these Terms at any time. We will provide notice of material changes
              via email or through our services. Continued use after changes constitutes
              acceptance of the modified Terms.
            </p>

            <h2>14. Termination</h2>
            <p>
              We may suspend or terminate your access to our services at any time for violation
              of these Terms or for any other reason at our discretion. Upon termination, your
              right to use our services ceases immediately.
            </p>

            <h2>15. Governing Law</h2>
            <p>
              These Terms are governed by the laws of France. Any disputes shall be resolved
              in the courts of France.
            </p>

            <h2>16. Severability</h2>
            <p>
              If any provision of these Terms is found to be unenforceable, the remaining
              provisions will continue in full force and effect.
            </p>

            <h2>17. Entire Agreement</h2>
            <p>
              These Terms, together with our Privacy Policy, constitute the entire agreement
              between you and CrawlReady regarding our services.
            </p>

            <h2>18. Contact Us</h2>
            <p>
              If you have questions about these Terms, please contact us:
            </p>
            <ul>
              <li>
                Email:
                {' '}
                <a href="mailto:legal@crawlready.com" className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                  legal@crawlready.com
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

export default TermsPage;
