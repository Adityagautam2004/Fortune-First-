import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

function formatRupees(value: number) {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

interface BreakdownDonutChartProps {
  ready: boolean;
  segments: DonutSegment[];
}

export function BreakdownDonutChart({ ready, segments }: BreakdownDonutChartProps) {
  const chartData = segments.map((s) => ({ ...s, value: Math.max(s.value, 0) }));

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="h-48 w-48">
        {ready && (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={2}
                strokeWidth={0}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.label} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatRupees(Number(value))} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-2 flex flex-wrap justify-center gap-x-6 gap-y-1 text-xs">
        {segments.map((s) => (
          <span key={s.label} className="inline-flex items-center gap-1.5 text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} /> {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
