"use client";

import { Calculator, PieChart, PiggyBank } from "lucide-react";

const calculators = [
  {
    title: "SIP Calculator",
    description: "Calculate future returns on your Systematic Investment Plan",
    icon: <PieChart size={40} className="text-[#f97316]" />,
  },
  {
    title: "EMI Calculator",
    description: "Calculate your loan EMI and plan your monthly payments.",
    icon: <Calculator size={40} className="text-[#f97316]" />,
  },
  {
    title: "Retirement Calculator",
    description: "Plan your retirement corpus and secure your future.",
    icon: <PiggyBank size={40} className="text-[#f97316]" />,
  },
];

export default function CalculatorsSection() {
  return (
    <section
      id="calculators"
      className="py-12 md:py-16"
      style={{ backgroundColor: "#ffffff" }}
    >
      <div className="container-max">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-4xl font-bold text-[#1f2937] mb-2">
            Financial Calculators
          </h2>
          <p className="text-[#6b7280] max-w-lg mx-auto text-sm md:text-base">
            Plan better, Calculate smarter, Achieve your financial goals.
          </p>
        </div>

        {/* Calculator Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto px-4 md:px-0">
          {calculators.map((calc) => (
            <div
              key={calc.title}
              className="group rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.05)] text-center p-8 flex flex-col items-center hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-300"
              style={{ backgroundColor: "#fdf8f4" }}
            >
              {/* Icon */}
              <div className="flex items-center justify-center w-16 h-16 md:w-20 md:h-20 mb-6 bg-white rounded-full group-hover:scale-110 transition-transform duration-300">
                {calc.icon}
              </div>

              <h3 className="text-base md:text-lg font-bold text-[#1f2937] mb-2">{calc.title}</h3>
              <p className="text-xs md:text-sm text-[#6b7280] leading-relaxed mb-6">
                {calc.description}
              </p>
              
              <button className="mt-auto inline-flex items-center justify-center border border-[#f97316] text-[#f97316] rounded-full px-6 py-1.5 text-xs md:text-sm font-medium hover:bg-white transition-all duration-200">
                Calculate
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
