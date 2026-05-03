import { getTranslations, setRequestLocale } from 'next-intl/server';

import { ComparisonSection } from '@/templates/ComparisonSection';
import { CTA } from '@/templates/CTA';
import { DemoSection } from '@/templates/DemoSection';
import { FAQ } from '@/templates/FAQ';
import { Features } from '@/templates/Features';
import { Hero } from '@/templates/Hero';
import { LandingFooter } from '@/templates/LandingFooter';
import { LandingNavbar } from '@/templates/LandingNavbar';
import { MarketOpportunitySection } from '@/templates/MarketOpportunitySection';
import { ProblemSection } from '@/templates/ProblemSection';
import { SocialProofSection } from '@/templates/SocialProofSection';
import { getBaseUrl } from '@/utils/Helpers';

export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: 'LandingPage',
  });

  const baseUrl = getBaseUrl();
  const title = t('meta_title');
  const description = t('meta_description');

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: baseUrl,
      siteName: 'CrawlReady',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image' as const,
      title,
      description,
    },
    alternates: {
      canonical: baseUrl,
    },
  };
}

const IndexPage = async (props: { params: Promise<{ locale: string }> }) => {
  const { locale } = await props.params;
  setRequestLocale(locale);

  return (
    <>
      <LandingNavbar />
      <main>
        <Hero />
        <DemoSection />
        <ProblemSection />
        <SocialProofSection />
        <Features />
        <ComparisonSection />
        <MarketOpportunitySection />
        <FAQ />
        <CTA />
      </main>
      <LandingFooter />
    </>
  );
};

export default IndexPage;
