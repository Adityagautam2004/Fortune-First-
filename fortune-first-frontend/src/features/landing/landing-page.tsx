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
import type { PublicDashboardData } from './lib/types';

// This page is statically prerendered (revalidated every 10 min), so a
// single failed fetch here bakes an empty landing page into the build until
// the next revalidation — worth a couple of quick retries rather than
// giving up immediately, since the backend's upstream DB/cache connections
// have shown intermittent transient connectivity drops.
async function getPublicDashboardData(): Promise<PublicDashboardData> {
  const empty = { returns: [], testimonials: [] };
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/dashboard`, {
        next: { revalidate: 600 },
      });
      if (!res.ok) throw new Error(`/public/dashboard responded ${res.status}`);
      const json = await res.json();
      return json.data as PublicDashboardData;
    } catch (error) {
      console.error(`[LandingPage] /public/dashboard fetch attempt ${attempt} failed:`, error);
      if (attempt === 3) return empty;
      await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
    }
  }
  return empty;
}

export async function LandingPage() {
  const { returns, testimonials } = await getPublicDashboardData();

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <SiteHeader />
      <HeroSection />
      <ServicesSection />
      <WhyChooseSection />
      <GrowthChartSection returns={returns} />
      <CalculatorsSection />
      <TrustedSection testimonials={testimonials} />
      <JoinSection />
      <TermsBannerSection />
      <SiteFooter />
    </div>
  );
}
