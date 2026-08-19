import { CalculatorsSection } from './components/calculators-section';
import { GrowthChartSection } from './components/growth-chart-section';
import { HeroSection } from './components/hero-section';
import { JoinSection } from './components/join-section';
import { ServicesSection } from './components/services-section';
import { SiteFooter } from './components/site-footer';
import { SiteHeader } from './components/site-header';
import { TermsBannerSection } from './components/terms-banner-section';
import { TrustedSection } from './components/trusted-section';
import { WhyChooseSection } from './components/why-choose-section';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <SiteHeader />
      <HeroSection />
      <ServicesSection />
      <WhyChooseSection />
      <GrowthChartSection />
      <CalculatorsSection />
      <TrustedSection />
      <JoinSection />
      <TermsBannerSection />
      <SiteFooter />
    </div>
  );
}
