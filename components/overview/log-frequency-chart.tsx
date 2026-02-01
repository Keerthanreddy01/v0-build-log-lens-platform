"use client";

import { useMemo, useCallback, useState } from "react";
import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  ReferenceDot,
  CartesianGrid,
  Bar,
  ComposedChart,
} from "recharts";
import { useLogStore } from "@/lib/store";
import { generateTimelineData } from "@/lib/log-parser";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TimeRange = "1h" | "6h" | "12h" | "24h" | "all";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
    payload: {
      time: string;
      total: number;
      errors: number;
      warnings: number;
      info: number;
    };
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0]?.payload;
  if (!data) return null;

  return (
    <div className="bg-popover border border-border rounded-lg shadow-xl p-3 min-w-[160px]">
      <p className="text-xs text-muted-foreground mb-2 font-medium">{label}</p>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary" />
            Total
          </span>
          <span className="text-xs font-semibold tabular-nums">{data.total.toLocaleString()}</span>
        </div>
        {data.errors > 0 && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-destructive" />
              Errors
            </span>
            <span className="text-xs font-semibold tabular-nums text-destructive">
              {data.errors.toLocaleString()}
            </span>
          </div>
        )}
        {data.warnings > 0 && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-warning" />
              Warnings
            </span>
            <span className="text-xs font-semibold tabular-nums text-warning">
              {data.warnings.toLocaleString()}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Info
          </span>
          <span className="text-xs font-semibold tabular-nums">{data.info.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

export function LogFrequencyChart() {
  const { parsedLogs, setLevelFilter } = useLogStore();
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  const data = useMemo(() => {
    if (parsedLogs.length === 0) return [];

    const allData = generateTimelineData(parsedLogs);

    if (timeRange === "all") return allData;

    const now = new Date();
    const hoursMap: Record<TimeRange, number> = {
      "1h": 1,
      "6h": 6,
      "12h": 12,
      "24h": 24,
      all: Infinity,
    };
    const hours = hoursMap[timeRange];
    const cutoff = new Date(now.getTime() - hours * 60 * 60 * 1000);

    return allData.filter((point) => {
      const pointTime = point.timestamp instanceof Date ? point.timestamp : new Date(point.timestamp);
      return pointTime >= cutoff;
    });
  }, [parsedLogs, timeRange]);

  const handleChartClick = useCallback(
    (chartData: { activePayload?: Array<{ payload: { errors: number } }> }) => {
      if (chartData?.activePayload?.[0]?.payload?.errors > 0) {
        setLevelFilter(["ERROR"]);
      }
    },
    [setLevelFilter]
  );

  const chartColors = {
    stroke: "#0070f3",
    fill: "rgba(0, 112, 243, 0.15)",
    errorStroke: "#ef4444",
    grid: "#262626",
  };

  const errorSpikes = data.filter((point) => point.errors > 0);
  const maxValue = Math.max(...data.map((d) => d.total), 1);
  const hasErrors = errorSpikes.length > 0;

  if (data.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          </div>
          <p className="text-sm">No timeline data available</p>
        </div>
      </div>
    );
  }

  const timeRanges: { value: TimeRange; label: string }[] = [
    { value: "1h", label: "1H" },
    { value: "6h", label: "6H" },
    { value: "12h", label: "12H" },
    { value: "24h", label: "24H" },
    { value: "all", label: "All" },
  ];

  return (
    <div className="h-full w-full flex flex-col">
      {/* Time Range Filters */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-1 bg-secondary/50 rounded-md p-0.5">
          {timeRanges.map((range) => (
            <Button
              key={range.value}
              variant="ghost"
              size="sm"
              className={cn(
                "h-6 px-2 text-xs font-medium transition-all",
                timeRange === range.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setTimeRange(range.value)}
            >
              {range.label}
            </Button>
          ))}
        </div>
        {hasErrors && (
          <div className="flex items-center gap-1.5 text-xs text-destructive">
            <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
            {errorSpikes.length} error spike{errorSpikes.length > 1 ? "s" : ""} detected
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 5, right: 5, left: -15, bottom: 0 }}
            onClick={handleChartClick}
            onMouseMove={(state) => {
              if (state?.activeTooltipIndex !== undefined) {
                setHoveredPoint(state.activeTooltipIndex);
              }
            }}
            onMouseLeave={() => setHoveredPoint(null)}
          >
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chartColors.stroke} stopOpacity={0.4} />
                <stop offset="100%" stopColor={chartColors.stroke} stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="colorError" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chartColors.errorStroke} stopOpacity={0.8} />
                <stop offset="100%" stopColor={chartColors.errorStroke} stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={chartColors.grid}
              vertical={false}
              opacity={0.5}
            />
            <XAxis
              dataKey="time"
              stroke="#525252"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              tick={{ fill: "#a1a1aa" }}
            />
            <YAxis
              stroke="#525252"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => (value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value)}
              width={30}
              tick={{ fill: "#a1a1aa" }}
              domain={[0, maxValue * 1.1]}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: "#525252", strokeDasharray: "3 3" }}
            />
            {/* Error bars underneath */}
            <Bar
              dataKey="errors"
              fill="url(#colorError)"
              radius={[2, 2, 0, 0]}
              maxBarSize={8}
            />
            {/* Main area */}
            <Area
              type="monotone"
              dataKey="total"
              stroke={chartColors.stroke}
              strokeWidth={2}
              fill="url(#colorTotal)"
              dot={false}
              activeDot={{
                r: 5,
                fill: chartColors.stroke,
                stroke: "#000",
                strokeWidth: 2,
              }}
            />
            {/* Error spike markers */}
            {errorSpikes.map((point, index) => (
              <ReferenceDot
                key={`error-${index}`}
                x={point.time}
                y={point.total}
                r={6}
                fill="#ef4444"
                stroke="#000"
                strokeWidth={2}
                className="cursor-pointer"
              >
                <animate
                  attributeName="r"
                  values="6;8;6"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </ReferenceDot>
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
