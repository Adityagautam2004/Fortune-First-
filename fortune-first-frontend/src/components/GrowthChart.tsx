"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import { TrendingUp, IndianRupee, Percent } from "lucide-react";

const monthlyData = [
  { month: "Apr", value: 5.8 },
  { month: "May", value: 7.2 },
  { month: "Jun", value: 6.5 },
  { month: "Jul", value: 8.1 },
  { month: "Aug", value: 9.3 },
  { month: "Sep", value: 7.8 },
  { month: "Oct", value: 11.2 },
  { month: "Nov", value: 10.5 },
  { month: "Dec", value: 12.4 },
  { month: "Jan", value: 13.1 },
  { month: "Feb", value: 14.2 },
  { month: "Mar", value: 15.8 },
];

const summaryStats = [
  {
    icon: IndianRupee,
    label: "Total Investment",
    value: "₹31,04,320",
    color: "var(--primary)",
  },
  {
    icon: TrendingUp,
    label: "Net Profit",
    value: "₹2,25,548",
    color: "#22c55e",
  },
  {
    icon: Percent,
    label: "Growth",
    value: "3.8%–5.94%",
    color: "#3b82f6",
  },
];

export default function GrowthChart() {
  return (
    <section
      id="investments"
      className="py-16 md:py-24 bg-white"
    >
      <div className="container-max">
        {/* Section Header */}
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-4xl font-bold text-[#1f2937] mb-2">
            Track Your Growth
          </h2>
          <p className="text-[#f97316] text-xs md:text-sm font-semibold tracking-wide">
            Fortune First — FY 2025-26
          </p>
        </div>

        {/* Chart */}
        <div className="w-full h-[260px] md:h-[400px] mb-12">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyData}
              margin={{ top: 25, right: 10, left: 0, bottom: 5 }}
              barCategoryGap="30%"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f3f4f6"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fill: "#6b7280", fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: "#e5e7eb" }}
              />
              <YAxis
                tick={{ fill: "#6b7280", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `₹${v}L`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  color: "#1f2937",
                  fontSize: "12px",
                }}
                formatter={(value) => [`₹${value}L`, "Growth"]}
                cursor={{ fill: "#f3f4f6", opacity: 0.5 }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
                {monthlyData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill="#f97316"
                  />
                ))}
                <LabelList
                  dataKey="value"
                  position="top"
                  formatter={(v) => `₹${v}L`}
                  style={{
                    fill: "#6b7280",
                    fontSize: "10px",
                    fontWeight: 600,
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center divide-y sm:divide-y-0">
          <div className="py-2 sm:py-0">
            <p className="text-xs md:text-sm text-[#6b7280] mb-1">Total Investment</p>
            <p className="text-lg md:text-2xl font-bold text-[#f97316]">₹12,43,226</p>
          </div>
          <div className="py-2 sm:py-0">
            <p className="text-xs md:text-sm text-[#6b7280] mb-1">Total Actual Return</p>
            <p className="text-lg md:text-2xl font-bold text-[#f97316]">₹2,20,548</p>
          </div>
          <div className="py-2 sm:py-0">
            <p className="text-xs md:text-sm text-[#6b7280] mb-1">Avg Monthly Return</p>
            <p className="text-lg md:text-2xl font-bold text-[#f97316]">1.5%–2.54%</p>
          </div>
        </div>
      </div>
    </section>
  );
}
