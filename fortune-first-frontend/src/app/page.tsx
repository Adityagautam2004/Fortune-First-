"use client";

import Navbar from "@/src/components/Navbar";
import HeroSection from "@/src/components/HeroSection";
import ServicesSection from "@/src/components/ServicesSection";
import WhyChooseSection from "@/src/components/WhyChooseSection";
import GrowthChart from "@/src/components/GrowthChart";
import PastReturns from "@/src/components/PastReturns";
import CalculatorsSection from "@/src/components/CalculatorsSection";
import TrustedSection from "@/src/components/TrustedSection";
import Footer from "@/src/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <ServicesSection />
        <WhyChooseSection />
        <GrowthChart />
        <PastReturns />
        <CalculatorsSection />
        <TrustedSection />
      </main>
      <Footer />
    </>
  );
}