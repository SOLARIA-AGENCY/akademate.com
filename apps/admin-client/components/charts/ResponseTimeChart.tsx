'use client';

/**
 * ResponseTimeChart Component
 *
 * Real-time response time visualization using Recharts.
 * Displays latency data over time with animated updates.
 */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

export interface ResponseTimeDataPoint {
  time: string;
  api: number;
  database: number;
  cache: number;
}

interface ResponseTimeChartProps {
  data: ResponseTimeDataPoint[];
  height?: number;
  showLegend?: boolean;
  thresholdMs?: number;
}

export function ResponseTimeChart({
  data,
  height = 200,
  showLegend = true,
  thresholdMs = 200,
}: ResponseTimeChartProps) {
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;

    return (
      <div className="bg-background/95 backdrop-blur border border-border rounded-lg p-3 shadow-lg">
        <p className="text-xs text-muted-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium text-foreground">{entry.value}ms</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--muted) / 0.3)"
            vertical={false}
          />
          <XAxis
            dataKey="time"
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
            tickFormatter={(value) => `${value}ms`}
            width={50}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Threshold reference line */}
          <ReferenceLine
            y={thresholdMs}
            stroke="hsl(var(--destructive) / 0.5)"
            strokeDasharray="5 5"
            label={{
              value: `${thresholdMs}ms`,
              position: 'right',
              fill: 'hsl(var(--destructive))',
              fontSize: 10,
            }}
          />

          <Line
            type="monotone"
            dataKey="api"
            name="API"
            stroke="hsl(142 76% 36%)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
            animationDuration={300}
          />
          <Line
            type="monotone"
            dataKey="database"
            name="Database"
            stroke="hsl(217 91% 60%)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
            animationDuration={300}
          />
          <Line
            type="monotone"
            dataKey="cache"
            name="Cache"
            stroke="hsl(48 96% 53%)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
            animationDuration={300}
          />
        </LineChart>
      </ResponsiveContainer>

      {showLegend && (
        <div className="flex items-center justify-center gap-6 mt-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-green-500 rounded" />
            <span className="text-muted-foreground">API</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-blue-500 rounded" />
            <span className="text-muted-foreground">Database</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-yellow-500 rounded" />
            <span className="text-muted-foreground">Cache</span>
          </div>
        </div>
      )}
    </div>
  );
}
