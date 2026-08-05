"use client";

import { Star } from "lucide-react";

export default function TrustedSection() {
  return (
    <section
      id="trusted"
      className="py-12 md:py-16"
      style={{ backgroundColor: "#fdf8f4" }}
    >
      <div className="container-max text-center">
        <h2 className="text-xl md:text-2xl font-bold text-[#1f2937] mb-1">
          Trusted by 20+ private clients
        </h2>
        <p className="text-[#6b7280] mb-6 text-xs md:text-sm">
          Best financial platform for personal investments
        </p>

        {/* Star Rating */}
        <div className="flex items-center justify-center gap-1.5 mb-10">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              size={24}
              className="text-[#f97316] fill-[#f97316]"
            />
          ))}
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-gray-100 mb-8 max-w-4xl mx-auto" />

        {/* CTA Button */}
        <button
          className="bg-[#111827] text-white px-8 py-2.5 rounded-md text-xs font-semibold hover:bg-gray-800 transition-colors"
        >
          Terms & Conditions
        </button>
      </div>
    </section>
  );
}
