"use client";

import Image from "next/image";

export default function HeroSection() {
  return (
    <section
      id="hero"
      className="relative w-full h-[450px] sm:h-[520px] md:h-[600px] lg:h-[650px] flex items-center overflow-hidden"
    >
      {/* Background Image containing the text and button */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/Hero_img.png"
          alt="Fortune First Hero Background"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
      </div>
    </section>
  );
}
