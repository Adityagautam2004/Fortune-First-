"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";

export default function HeroSection() {
  return (
    <section
      id="hero"
      className="relative w-full h-[450px] sm:h-[520px] md:h-[600px] lg:h-[650px] flex flex-col justify-center overflow-hidden"
    >
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/Hero_image.png"
          alt="Fortune First Hero Background"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/40 md:bg-black/20 md:bg-gradient-to-r from-black/80 to-transparent"></div>
      </div>

      <div className="container-max relative z-10 px-6 lg:px-6 mt-16">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            Grow Your <br />Wealth Smartly
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-10 max-w-lg">
            Manage investments, plan finances, and secure your future with Fortune First.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button className="inline-flex items-center gap-2 bg-[#f97316] hover:bg-[#ea580c] text-white px-8 py-4 text-lg font-bold rounded-lg transition-colors shadow-lg">
              Get Started <ArrowRight size={22} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
