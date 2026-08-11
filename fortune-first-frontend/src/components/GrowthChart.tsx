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

// Data matches screenshot: monthly payout values in thousands
const monthlyData = [
  { month: "Apr\n2025", value: 15.6 },
  { month: "May", value: 17.2 },
  { month: "Jun", value: 17.9 },
  { month: "Jul", value: 19.8 },
  { month: "Aug", value: 19.4 },
  { month: "Sep", value: 19.9 },
  { month: "Oct", value: 19.5 },
  { month: "Nov", value: 20.8 },
  { month: "Dec", value: 21.0 },
  { month: "Jan\n2026", value: 19.4 },
  { month: "Feb", value: 19.5 },
  { month: "Mar", value: 19.5 },
];

export default function GrowthChart() {
  return (
    <section
      id="investments"
      className="py-12 md:py-16"
      style={{ backgroundColor: "#ffffff" }}
    >
      <div className="container-max">
        {/* Section Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-4xl font-bold text-[#1f2937] mb-4">
            Track Your Growth
          </h2>
          {/* Chart title bar like screenshot */}
          <div className="max-w-3xl mx-auto">
            <p className="text-[#f97316] text-base md:text-lg font-bold tracking-wide">
              Fortune First — FY 2025-26
            </p>
            <p className="text-[#6b7280] text-xs mt-1">
              Monthly Payout Overview · April 2025 – March 2026
            </p>
          </div>
        </div>

        {/* Orange top border line like screenshot */}
        <div className="max-w-5xl mx-auto mb-2">
          <div className="h-0.5 bg-[#f97316] rounded-full" />
        </div>

        {/* Chart */}
        <div className="w-full h-[300px] md:h-[420px] mb-0 max-w-5xl mx-auto bg-[#fdf8f4] rounded-2xl border border-gray-100 p-4 md:p-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyData}
              margin={{ top: 28, right: 10, left: -10, bottom: 5 }}
              barCategoryGap="20%"
            >
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity={1} />
                  <stop offset="100%" stopColor="#fb923c" stopOpacity={0.85} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e5e7eb"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fill: "#6b7280", fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: "#e5e7eb" }}
              />
              <YAxis
                tick={{ fill: "#6b7280", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `₹${v}K`}
                domain={[0, 25]}
                ticks={[0, 5, 10, 15, 20, 25]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #f97316",
                  borderRadius: "8px",
                  color: "#1f2937",
                  fontSize: "12px",
                }}
                formatter={(value) => [`₹${value}K`, "Monthly Payout"]}
                cursor={{ fill: "rgba(249,115,22,0.08)" }}
              />
              <Bar
                dataKey="value"
                radius={[5, 5, 0, 0]}
                maxBarSize={45}
                fill="url(#barGradient)"
              >
                {monthlyData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill="url(#barGradient)" />
                ))}
                <LabelList
                  dataKey="value"
                  position="top"
                  formatter={(v) => `₹${v ?? ''}K`}
                  style={{
                    fill: "#92400e",
                    fontSize: "9px",
                    fontWeight: 700,
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Stats — colored orange to match bars */}
        <div className="max-w-5xl mx-auto mt-0 px-4 md:px-6 py-5 bg-[#fdf8f4] rounded-b-2xl border border-t-0 border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center divide-y sm:divide-y-0 sm:divide-x divide-orange-100">
            <div className="py-2 sm:py-0 sm:px-4">
              <p className="text-xs md:text-sm text-[#6b7280] mb-1 font-medium">Total Investment</p>
              <p className="text-xl md:text-2xl font-extrabold text-[#f97316]">₹13,03,225</p>
            </div>
            <div className="py-2 sm:py-0 sm:px-4">
              <p className="text-xs md:text-sm text-[#6b7280] mb-1 font-medium">Total Annual Payout</p>
              <p className="text-xl md:text-2xl font-extrabold text-[#f97316]">₹2,29,448</p>
            </div>
            <div className="py-2 sm:py-0 sm:px-4">
              <p className="text-xs md:text-sm text-[#6b7280] mb-1 font-medium">Avg Monthly Interest</p>
              <p className="text-xl md:text-2xl font-extrabold text-[#f97316]">1.5%–1.54%</p>
            </div>
          </div>
        </div>

        {/* Past Returns heading — sits visually below the chart block */}
        <div className="text-center mt-12">
          <h2 className="text-2xl md:text-4xl font-bold text-[#1f2937]">Past Returns</h2>
        </div>
      </div>
    </section>
  );
}
