'use client';

/**
 * MetricsBarChart Component
 *
 * Real-time metrics visualization with bar chart.
 * Used for displaying comparative metrics like enrollments, active users, etc.
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export interface MetricDataPoint {
  name: string;
  value: number;
  target?: number;
  color?: string;
}

interface MetricsBarChartProps {
  data: MetricDataPoint[];
  height?: number;
  showTarget?: boolean;
  orientation?: 'vertical' | 'horizontal';
}

const DEFAULT_COLORS = [
  'hsl(142 76% 36%)',  // green
  'hsl(217 91% 60%)',  // blue
  'hsl(280 87% 65%)',  // purple
  'hsl(48 96% 53%)',   // yellow
  'hsl(12 76% 61%)',   // orange
  'hsl(173 80% 40%)',  // teal
];

export function MetricsBarChart({
  data,
  height = 200,
  showTarget = false,
  orientation = 'vertical',
}: MetricsBarChartProps) {
  const isHorizontal = orientation === 'horizontal';

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;

    const item = payload[0].payload as MetricDataPoint;

    return (
      <div className="bg-background/95 backdrop-blur border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium text-foreground mb-1">{item.name}</p>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Valor:</span>
          <span className="font-bold text-foreground">{item.value.toLocaleString()}</span>
        </div>
        {showTarget && item.target && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Meta:</span>
            <span className="font-medium text-foreground">{item.target.toLocaleString()}</span>
            <span className={`text-xs ${item.value >= item.target ? 'text-green-500' : 'text-red-500'}`}>
              ({item.value >= item.target ? '+' : ''}{((item.value / item.target - 1) * 100).toFixed(1)}%)
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout={isHorizontal ? 'vertical' : 'horizontal'}
          margin={{ top: 10, right: 10, left: isHorizontal ? 80 : 0, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--muted) / 0.3)"
            horizontal={!isHorizontal}
            vertical={isHorizontal}
          />
          {isHorizontal ? (
            <>
              <XAxis
                type="number"
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                width={70}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                width={40}
              />
            </>
          )}
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.2)' }} />
          <Bar
            dataKey="value"
            radius={[4, 4, 0, 0]}
            animationDuration={300}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
