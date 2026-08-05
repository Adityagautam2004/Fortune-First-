"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";

const services = [
  {
    title: "Investment Options",
    description: "Invest through SIP or one-time payment",
    image: "/investmentoption_img.png",
  },
  {
    title: "Fund Management",
    description: "Manage and grow your wealth securely",
    image: "/FundManagement_img.png",
  },
];

export default function ServicesSection() {
  return (
    <section
      id="services"
      className="pt-24 pb-16 md:pt-32 md:pb-24"
      style={{ backgroundColor: "#ffffff" }}
    >
      <div className="container-max">
        {/* Section Header */}
        <div className="text-center mb-10 md:mb-14">
          <h2 className="text-2xl md:text-4xl font-bold text-[#1f2937]">
            Our Services
          </h2>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 max-w-5xl mx-auto px-4 md:px-0">
          {services.map((service) => (
            <div
              key={service.title}
              className="group cursor-pointer flex flex-col items-center"
            >
              {/* Image — natural size, light card background, soft shadow */}
              <div
                className="w-full rounded-2xl mb-6 overflow-hidden transition-shadow duration-300
                  shadow-[0_6px_24px_rgba(0,0,0,0.08)] group-hover:shadow-[0_12px_40px_rgba(0,0,0,0.14)]"
                style={{ backgroundColor: "#f5ebe0" }}
              >
                <Image
                  src={service.image}
                  alt={service.title}
                  width={900}
                  height={600}
                  className="w-full h-auto object-contain transition-transform duration-500 group-hover:scale-[1.03]"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>

              {/* Text Content */}
              <div className="flex flex-col items-center text-center px-4">
                <h3 className="text-lg md:text-xl font-bold mb-2 text-[#1f2937]">
                  {service.title}
                </h3>
                <p className="text-[#6b7280] text-sm mb-4 max-w-sm leading-relaxed">
                  {service.description}
                </p>
                <button className="inline-flex items-center justify-center gap-1.5 border border-[#f97316] text-[#f97316] rounded-full px-5 py-1.5 text-sm font-medium hover:bg-[#fff7ed] transition-all duration-200">
                  Learn More
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
