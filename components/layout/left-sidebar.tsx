"use client";

import { cn } from "@/lib/utils";
import { useLogStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  Filter,
  AlertCircle,
  Database,
  Shield,
  User,
  Star,
  TrendingUp,
  TrendingDown,
  Trash2,
  X,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

export function LeftSidebar() {
  const {
    parsedLogs,
    stats,
    smartFilters,
    toggleSmartFilter,
    savedQueries,
    applySavedQuery,
    removeSavedQuery,
    filter,
    updateFilter,
    setLevelFilter,
    clearLogs,
  } = useLogStore();

  // Determine active state
  const isAllProduction = !smartFilters.criticalOnly && !smartFilters.performanceIssues && !smartFilters.securityEvents && !smartFilters.userActions;
  
  const resetAllFilters = () => {
    // Reset smart filters
    if (smartFilters.criticalOnly) toggleSmartFilter("criticalOnly");
    if (smartFilters.performanceIssues) toggleSmartFilter("performanceIssues");
    if (smartFilters.securityEvents) toggleSmartFilter("securityEvents");
    if (smartFilters.userActions) toggleSmartFilter("userActions");
    // Reset level filter to all
    setLevelFilter(['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE']);
    // Clear search
    updateFilter({ search: '' });
    toast.success("All filters cleared");
  };

  const handleApplySavedQuery = (query: typeof savedQueries[0]) => {
    applySavedQuery(query);
    toast.success(`Applied filter: ${query.name}`);
  };

  const handleRemoveSavedQuery = (id: string, name: string) => {
    removeSavedQuery(id);
    toast.success(`Removed: ${name}`);
  };

  const handleClearLogs = () => {
    clearLogs();
    toast.success("All logs cleared");
  };

  // Count logs for each filter
  const errorCount = parsedLogs.filter(l => l.level === 'ERROR').length;
  const slowQueryCount = parsedLogs.filter(l => 
    l.rawLine.toLowerCase().includes('slow') || 
    l.rawLine.toLowerCase().includes('timeout')
  ).length;
  const securityCount = parsedLogs.filter(l => 
    l.rawLine.toLowerCase().includes('auth') || 
    l.rawLine.toLowerCase().includes('security')
  ).length;

  return (
    <aside className="w-[250px] border-r border-border bg-background flex flex-col shrink-0 overflow-hidden">
      {/* Quick Stats - Fixed Header */}
      <div className="border-b border-border p-4 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Quick Stats
          </h3>
          {parsedLogs.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive interactive-element"
              onClick={handleClearLogs}
              title="Clear all logs"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
        <div className="space-y-3">
          {/* Total Logs Card */}
          <div className="rounded-lg border border-border bg-card p-3 interactive-element hover:border-primary/30">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Total Logs (24h)</p>
            <div className="flex items-end justify-between">
              <p className="text-2xl font-semibold text-foreground tabular-nums">
                {stats.totalLogs > 1000
                  ? `${(stats.totalLogs / 1000).toFixed(1)}K`
                  : stats.totalLogs || '0'}
              </p>
              {stats.totalLogs > 0 && (
                <span className="flex items-center gap-0.5 text-xs font-medium text-success">
                  <TrendingUp className="h-3 w-3" />
                  +{Math.min(100, Math.round(stats.totalLogs / 10))}%
                </span>
              )}
            </div>
          </div>

          {/* Error Rate Card */}
          <div className="rounded-lg border border-border bg-card p-3 interactive-element hover:border-primary/30">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Error Rate</p>
            <div className="flex items-end justify-between">
              <p className="text-2xl font-semibold text-foreground tabular-nums">
                {stats.errorRate.toFixed(2)}%
              </p>
              <span className={cn(
                "flex items-center gap-0.5 text-xs font-medium",
                stats.errorRate > 5 ? "text-destructive" : "text-success"
              )}>
                {stats.errorRate > 5 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {stats.errorRate > 5 ? '+' : '-'}{Math.abs(stats.errorRate - 2).toFixed(0)}%
              </span>
            </div>
          </div>
          
          {/* Additional Stats Grid */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-card rounded-md p-2 border border-border">
              <span className="text-[10px] text-muted-foreground block">Errors</span>
              <span className="text-foreground font-semibold text-destructive tabular-nums">{stats.errorCount}</span>
            </div>
            <div className="bg-card rounded-md p-2 border border-border">
              <span className="text-[10px] text-muted-foreground block">Warnings</span>
              <span className="text-foreground font-semibold text-warning tabular-nums">{stats.warnCount}</span>
            </div>
          </div>
          <div className="flex justify-between text-sm px-1">
            <span className="text-muted-foreground text-xs">Active Services</span>
            <span className="text-foreground font-medium tabular-nums">{stats.activeServices}</span>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Smart Filters */}
        <div className="border-b border-border p-4">
          <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Smart Filters
          </h3>
          <div className="space-y-1">
            <button
              onClick={resetAllFilters}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-150 text-left group interactive-element",
                isAllProduction
                  ? "bg-primary/10 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent"
              )}
            >
              <Filter className={cn("w-4 h-4", isAllProduction ? "text-primary" : "text-muted-foreground group-hover:text-primary")} />
              <span className="flex-1">All Production</span>
              {isAllProduction && <ChevronRight className="w-3 h-3 opacity-50" />}
            </button>

            <button
              onClick={() => {
                toggleSmartFilter("criticalOnly");
                toast.info(smartFilters.criticalOnly ? "Showing all logs" : "Filtering critical errors");
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-150 text-left group interactive-element",
                smartFilters.criticalOnly
                  ? "bg-destructive/10 text-destructive border border-destructive/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent"
              )}
            >
              <AlertCircle className={cn("w-4 h-4", smartFilters.criticalOnly ? "text-destructive" : "text-muted-foreground group-hover:text-destructive")} />
              <span className="flex-1">Critical Errors</span>
              {errorCount > 0 && (
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full tabular-nums",
                  smartFilters.criticalOnly ? "bg-destructive/20 text-destructive" : "bg-muted text-muted-foreground"
                )}>
                  {errorCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                toggleSmartFilter("performanceIssues");
                toast.info(smartFilters.performanceIssues ? "Showing all logs" : "Filtering slow queries");
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-150 text-left group interactive-element",
                smartFilters.performanceIssues
                  ? "bg-warning/10 text-warning border border-warning/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent"
              )}
            >
              <Database className={cn("w-4 h-4", smartFilters.performanceIssues ? "text-warning" : "text-muted-foreground group-hover:text-warning")} />
              <span className="flex-1">DB Slow Queries</span>
              {slowQueryCount > 0 && (
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full tabular-nums",
                  smartFilters.performanceIssues ? "bg-warning/20 text-warning" : "bg-muted text-muted-foreground"
                )}>
                  {slowQueryCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                toggleSmartFilter("securityEvents");
                toast.info(smartFilters.securityEvents ? "Showing all logs" : "Filtering security events");
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-150 text-left group interactive-element",
                smartFilters.securityEvents
                  ? "bg-purple-500/10 text-purple-400 border border-purple-500/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent"
              )}
            >
              <Shield className={cn("w-4 h-4", smartFilters.securityEvents ? "text-purple-400" : "text-muted-foreground group-hover:text-purple-400")} />
              <span className="flex-1">Security Events</span>
              {securityCount > 0 && (
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full tabular-nums",
                  smartFilters.securityEvents ? "bg-purple-500/20 text-purple-400" : "bg-muted text-muted-foreground"
                )}>
                  {securityCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                toggleSmartFilter("userActions");
                toast.info(smartFilters.userActions ? "Showing all logs" : "Filtering user actions");
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-150 text-left group interactive-element",
                smartFilters.userActions
                  ? "bg-primary/10 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent"
              )}
            >
              <User className={cn("w-4 h-4", smartFilters.userActions ? "text-primary" : "text-muted-foreground group-hover:text-primary")} />
              <span className="flex-1">User Actions</span>
            </button>
          </div>
        </div>

        {/* Saved Queries */}
        <div className="p-4">
          <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Saved Queries
          </h3>
          <div className="space-y-1">
            {savedQueries.map((query) => (
              <div
                key={query.id}
                className="group flex items-center w-full"
              >
                <button
                  onClick={() => handleApplySavedQuery(query)}
                  className="flex-1 flex items-center gap-3 px-3 py-2.5 rounded-l-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-150 text-left interactive-element"
                >
                  <Star className="w-4 h-4 text-warning" />
                  <span className="truncate">{query.name}</span>
                </button>
                <button
                  onClick={() => handleRemoveSavedQuery(query.id, query.name)}
                  className="p-2.5 rounded-r-md text-muted-foreground hover:text-destructive hover:bg-secondary transition-all duration-150 opacity-0 group-hover:opacity-100 interactive-element"
                  title="Remove query"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {savedQueries.length === 0 && (
              <p className="text-xs text-muted-foreground px-3 py-2 italic">No saved queries yet</p>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
