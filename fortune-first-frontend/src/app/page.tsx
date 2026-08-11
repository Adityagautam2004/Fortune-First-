"use client";

import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ServicesSection from "@/components/ServicesSection";
import WhyChooseSection from "@/components/WhyChooseSection";
import GrowthChart from "@/components/GrowthChart";
import PastReturns from "@/components/PastReturns";
import CalculatorsSection from "@/components/CalculatorsSection";
import TrustedSection from "@/components/TrustedSection";
import Footer from "@/components/Footer";

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