'use client'

import { cn } from '@/lib/utils'
import { useLogStore } from '@/lib/store'
import { Badge } from '@/components/ui/badge'

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'live-logs', label: 'Live Logs' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'alerts', label: 'Alerts' },
] as const

export function SecondaryNav() {
  const { activeTab, setActiveTab, stats, parsedLogs } = useLogStore()
  
  // Count active alerts (simulated - in real app would come from alerts state)
  const activeAlertsCount = stats.errorRate > 5 ? 2 : 0
  
  return (
    <div className="h-12 border-b border-border bg-background flex items-center px-4 gap-1 shrink-0">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        const showBadge = tab.id === 'alerts' && activeAlertsCount > 0
        const showLogCount = tab.id === 'live-logs' && parsedLogs.length > 0
        
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'relative flex items-center gap-2 px-4 text-sm font-medium py-3 border-b-2 transition-all duration-150 -mb-[1px] interactive-element',
              isActive
                ? 'text-foreground border-primary'
                : 'text-muted-foreground border-transparent hover:text-foreground hover:border-border'
            )}
          >
            {tab.label}
            {showBadge && (
              <Badge 
                variant="destructive" 
                className="h-5 min-w-[20px] px-1.5 text-[10px] font-semibold animate-pulse"
              >
                {activeAlertsCount}
              </Badge>
            )}
            {showLogCount && (
              <span className="text-xs text-muted-foreground tabular-nums">
                ({parsedLogs.length > 1000 ? `${(parsedLogs.length / 1000).toFixed(1)}K` : parsedLogs.length})
              </span>
            )}
          </button>
        )
      })}
      
      {/* Spacer */}
      <div className="flex-1" />
      
      {/* Quick status indicator */}
      {parsedLogs.length > 0 && (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
            </span>
            <span className="hidden sm:inline">Connected</span>
          </span>
          <span className="hidden md:flex items-center gap-1">
            <span className="text-muted-foreground">Error rate:</span>
            <span className={cn(
              "font-medium tabular-nums",
              stats.errorRate > 5 ? "text-destructive" : "text-success"
            )}>
              {stats.errorRate.toFixed(1)}%
            </span>
          </span>
        </div>
      )}
    </div>
  )
}
