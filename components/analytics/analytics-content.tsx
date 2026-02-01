"use client";

import { useLogStore } from "@/lib/store";
import { StatsCards } from "./stats-cards";
import { ServiceHeatmap } from "./service-heatmap";
import { ErrorRateChart } from "./error-rate-chart";
import { TopExceptions } from "./top-exceptions";
import { EmptyState } from "@/components/overview/empty-state";

export function AnalyticsContent() {
  const { parsedLogs, stats } = useLogStore();

  if (parsedLogs.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
        {/* Stats Cards Row */}
        <StatsCards />

        {/* Service Heatmap */}
        <ServiceHeatmap />

        {/* Bottom Row: Error Rate + Top Exceptions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ErrorRateChart />
          <TopExceptions />
        </div>

        {/* Footer Stats */}
        <div className="flex items-center justify-between text-xs text-muted-foreground py-3 border-t border-border">
          <div className="flex items-center gap-6">
            <div>
              <span className="font-medium text-foreground">Total Logs</span>
              <span className="ml-2 tabular-nums">{stats.totalLogs.toLocaleString()}</span>
            </div>
            <div>
              <span className="font-medium text-foreground">Active Services</span>
              <span className="ml-2 tabular-nums">{stats.activeServices}</span>
            </div>
            <div>
              <span className="font-medium text-foreground">Error Count</span>
              <span className="ml-2 tabular-nums text-destructive">{stats.errorCount}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span>Auto-refresh in 8s</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
