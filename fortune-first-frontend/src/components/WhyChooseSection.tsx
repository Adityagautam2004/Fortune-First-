"use client";

import {
  TrendingUp,
  ShieldCheck,
  MessageSquare,
  BadgePercent,
} from "lucide-react";

const features = [
  {
    icon: TrendingUp,
    title: "Easy Investments",
    description: "Invest easily in top funds and stocks",
  },
  {
    icon: ShieldCheck,
    title: "Secure Platform",
    description: "Your investments are safe and protected",
  },
  {
    icon: MessageSquare,
    title: "Expert Advice",
    description: "Get expert financial advice anytime",
  },
  {
    icon: BadgePercent,
    title: "Low Fees",
    description: "Maximize your returns with minimal fees",
  },
];

export default function WhyChooseSection() {
  return (
    <section
      id="why-choose"
      className="py-12 md:py-16"
      style={{ backgroundColor: "#fdf8f4" }}
    >
      <div className="container-max">
        {/* Section Header */}
        <div className="text-center mb-10 md:mb-14">
          <h2 className="text-2xl md:text-4xl font-bold text-[#1f2937]">
            Why Choose Fortune First?
          </h2>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 max-w-6xl mx-auto px-4 md:px-0">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="bg-white rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.05)] text-center p-6 md:p-8 flex flex-col items-center hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-300"
              >
                {/* Plain Icon */}
                <Icon
                  size={32}
                  strokeWidth={2}
                  className="text-[#f97316] mb-4"
                />
                <h3 className="text-sm md:text-base font-bold text-[#1f2937] mb-2">{feature.title}</h3>
                <p className="text-xs md:text-sm text-[#6b7280] leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
