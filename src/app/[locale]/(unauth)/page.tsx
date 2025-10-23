import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';

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

export async function generateMetadata(props: { params: { locale: string } }) {
  const t = await getTranslations({
    locale: props.params.locale,
    namespace: 'LandingPage',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

const IndexPage = (props: { params: { locale: string } }) => {
  unstable_setRequestLocale(props.params.locale);

  return (
    <>
      <LandingNavbar />
      <Hero />
      <DemoSection />
      <ProblemSection />
      <SocialProofSection />
      <Features />
      <ComparisonSection />
      <MarketOpportunitySection />
      <FAQ />
      <CTA />
      <LandingFooter />
    </>
  );
};

export default IndexPage;
