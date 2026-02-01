"use client";

import { useState, useRef, useEffect, useCallback, memo } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLogStore } from "@/lib/store";
import { highlightLogMessage } from "@/lib/log-parser";
import type { ParsedLog, LogLevel } from "@/lib/types";
import {
  Search,
  X,
  Download,
  ChevronDown,
  Copy,
  FileJson,
  FileText,
  Clipboard,
  ArrowDown,
  ArrowUp,
  SearchX,
  RotateCcw,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const levelStyles: Record<LogLevel, { badge: string; bg: string; text: string }> = {
  ERROR: { badge: "bg-destructive text-white", bg: "bg-destructive/5 hover:bg-destructive/10", text: "text-destructive" },
  WARN: { badge: "bg-warning text-black", bg: "bg-warning/5 hover:bg-warning/10", text: "text-warning" },
  INFO: { badge: "bg-primary text-white", bg: "hover:bg-primary/5", text: "text-primary" },
  DEBUG: { badge: "bg-muted-foreground text-white", bg: "hover:bg-muted/30", text: "text-muted-foreground" },
  TRACE: { badge: "bg-muted text-foreground", bg: "hover:bg-muted/20", text: "text-muted-foreground" },
};

interface LogEntryProps {
  log: ParsedLog;
  isSelected: boolean;
  onSelect: () => void;
  viewMode: "compact" | "comfortable";
  index: number;
}

const LogEntry = memo(function LogEntry({ log, isSelected, onSelect, viewMode, index }: LogEntryProps) {
  const styles = levelStyles[log.level];
  const dateObj = log.timestamp instanceof Date ? log.timestamp : new Date(log.timestamp);
  const timestamp = dateObj.toLocaleTimeString("en-US", {
    hour12: false,
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
  });

  const highlightedMessage = highlightLogMessage(log.message);

  const handleDoubleClick = () => {
    navigator.clipboard.writeText(log.rawLine);
    toast.success("Log copied to clipboard");
  };

  return (
    <button
      onClick={onSelect}
      onDoubleClick={handleDoubleClick}
      data-index={index}
      className={cn(
        "w-full text-left border-b border-border/50 transition-all duration-100 log-entry focus-ring",
        viewMode === "compact" ? "px-4 py-1.5" : "px-4 py-2.5",
        isSelected ? "selected bg-primary/10 border-l-[3px] border-l-primary pl-[calc(1rem-3px)]" : styles.bg,
      )}
      style={{ contain: "layout style paint" }}
    >
      <div className="flex items-start gap-3">
        <span className="text-[11px] font-mono text-muted-foreground whitespace-nowrap tabular-nums">
          {timestamp}
        </span>
        <span className="text-[11px] font-mono text-primary whitespace-nowrap">
          [{log.service}]
        </span>
        <Badge className={cn("text-[10px] font-semibold px-1.5 py-0 h-[18px] shrink-0 rounded", styles.badge)}>
          {log.level}
        </Badge>
        <span className="text-[13px] text-foreground flex-1 break-all font-mono leading-relaxed">
          {highlightedMessage.map((part, i) => (
            <span
              key={i}
              className={cn(
                part.type === "ip" && "text-cyan-400",
                part.type === "url" && "text-purple-400 underline underline-offset-2",
                part.type === "uuid" && "text-emerald-400",
                part.type === "status" && "text-destructive font-semibold"
              )}
            >
              {part.text}
            </span>
          ))}
        </span>
      </div>
    </button>
  );
});

interface LiveStreamLogProps {
  logs: ParsedLog[];
}

export function LiveStreamLog({ logs }: LiveStreamLogProps) {
  const {
    selectedLogId,
    selectLog,
    isLiveTailEnabled,
    viewMode,
    setViewMode,
    filter,
    updateFilter,
    setLevelFilter,
    smartFilters,
    toggleSmartFilter,
    parsedLogs,
  } = useLogStore();

  const [localSearch, setLocalSearch] = useState(filter.search);
  const [showScrollButtons, setShowScrollButtons] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [isAtTop, setIsAtTop] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA";
      
      // Focus search with /
      if (e.key === "/" && !isInput && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
      
      // Only handle shortcuts when not in input
      if (isInput && e.key !== "Escape") return;
      
      switch (e.key) {
        case "e":
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            setLevelFilter(['ERROR']);
            toast.info("Showing errors only");
          }
          break;
        case "w":
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            setLevelFilter(['WARN']);
            toast.info("Showing warnings only");
          }
          break;
        case "i":
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            setLevelFilter(['INFO']);
            toast.info("Showing info only");
          }
          break;
        case "a":
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            setLevelFilter(['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE']);
            toast.info("Showing all logs");
          }
          break;
        case "Escape":
          setLocalSearch("");
          updateFilter({ search: "" });
          searchInputRef.current?.blur();
          selectLog(null);
          break;
        case "ArrowDown":
        case "j":
          if (!isInput) {
            e.preventDefault();
            navigateLog(1);
          }
          break;
        case "ArrowUp":
        case "k":
          if (!isInput) {
            e.preventDefault();
            navigateLog(-1);
          }
          break;
        case "c":
          if (!e.ctrlKey && !e.metaKey && !isInput && selectedLogId) {
            const log = logs.find(l => l.id === selectedLogId);
            if (log) {
              navigator.clipboard.writeText(log.rawLine);
              toast.success("Log copied");
            }
          }
          break;
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setLevelFilter, updateFilter, selectLog, selectedLogId, logs]);

  // Navigate between logs
  const navigateLog = useCallback((direction: number) => {
    if (logs.length === 0) return;
    
    const currentIndex = selectedLogId ? logs.findIndex(l => l.id === selectedLogId) : -1;
    let newIndex: number;
    
    if (currentIndex === -1) {
      newIndex = direction > 0 ? 0 : logs.length - 1;
    } else {
      newIndex = currentIndex + direction;
      if (newIndex < 0) newIndex = 0;
      if (newIndex >= logs.length) newIndex = logs.length - 1;
    }
    
    const newLog = logs[newIndex];
    if (newLog) {
      selectLog(newLog.id);
      // Scroll the selected log into view
      const element = scrollContainerRef.current?.querySelector(`[data-index="${newIndex}"]`);
      element?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [logs, selectedLogId, selectLog]);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      updateFilter({ search: localSearch });
    }, 200);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [localSearch, updateFilter]);

  // Track scroll position
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const threshold = 100;
    
    setIsAtTop(scrollTop < threshold);
    setIsAtBottom(scrollHeight - scrollTop - clientHeight < threshold);
    setShowScrollButtons(scrollHeight > clientHeight + 200);
  }, []);

  // Auto-scroll when live tail is enabled
  useEffect(() => {
    if (isLiveTailEnabled && scrollContainerRef.current && isAtBottom) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [logs.length, isLiveTailEnabled, isAtBottom]);

  useEffect(() => {
    handleScroll();
  }, [handleScroll, logs.length]);

  const scrollToTop = useCallback(() => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const scrollToBottom = useCallback(() => {
    scrollContainerRef.current?.scrollTo({ 
      top: scrollContainerRef.current.scrollHeight, 
      behavior: "smooth" 
    });
  }, []);

  const handleExport = useCallback((format: "txt" | "json" | "csv" | "clipboard") => {
    if (logs.length === 0) {
      toast.error("No logs to export");
      return;
    }

    let content = "";
    let filename = `logs-export-${Date.now()}`;

    switch (format) {
      case "txt":
        content = logs.map((l) => l.rawLine).join("\n");
        filename += ".txt";
        break;
      case "json":
        content = JSON.stringify(
          logs.map((l) => {
            const ts = l.timestamp instanceof Date ? l.timestamp : new Date(l.timestamp);
            return {
              timestamp: ts.toISOString(),
              level: l.level,
              service: l.service,
              message: l.message,
              requestId: l.requestId,
              metadata: l.metadata,
            };
          }),
          null,
          2
        );
        filename += ".json";
        break;
      case "csv":
        const headers = "Timestamp,Level,Service,Message,Request ID\n";
        const rows = logs
          .map((l) => {
            const ts = l.timestamp instanceof Date ? l.timestamp : new Date(l.timestamp);
            return `"${ts.toISOString()}","${l.level}","${l.service}","${l.message.replace(/"/g, '""')}","${l.requestId || ""}"`;
          })
          .join("\n");
        content = headers + rows;
        filename += ".csv";
        break;
      case "clipboard":
        content = logs.map((l) => l.rawLine).join("\n");
        navigator.clipboard.writeText(content);
        toast.success(`Copied ${logs.length} logs to clipboard`);
        return;
    }

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${logs.length} logs as ${format.toUpperCase()}`);
  }, [logs]);

  const clearAllFilters = useCallback(() => {
    setLocalSearch("");
    updateFilter({ search: "" });
    setLevelFilter(['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE']);
    if (smartFilters.criticalOnly) toggleSmartFilter("criticalOnly");
    if (smartFilters.performanceIssues) toggleSmartFilter("performanceIssues");
    if (smartFilters.securityEvents) toggleSmartFilter("securityEvents");
    if (smartFilters.userActions) toggleSmartFilter("userActions");
    toast.success("All filters cleared");
  }, [setLevelFilter, updateFilter, smartFilters, toggleSmartFilter]);

  const levels: LogLevel[] = ["ERROR", "WARN", "INFO", "DEBUG", "TRACE"];

  return (
    <div className="flex flex-col h-full relative bg-background">
      {/* Control Bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border flex-wrap shrink-0 bg-background/95 backdrop-blur-sm">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            ref={searchInputRef}
            placeholder="Search logs..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-9 pr-8 h-8 text-sm bg-secondary border-border focus:border-primary focus:ring-1 focus:ring-primary/30"
          />
          {localSearch && (
            <button
              onClick={() => {
                setLocalSearch("");
                updateFilter({ search: "" });
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-muted interactive-element"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>

        {/* Level Filters */}
        <div className="flex items-center gap-1">
          <Button
            variant={filter.levels.length === 5 ? "secondary" : "ghost"}
            size="sm"
            className="h-7 text-xs px-2 interactive-element"
            onClick={() => setLevelFilter(["ERROR", "WARN", "INFO", "DEBUG", "TRACE"])}
          >
            ALL
          </Button>
          {levels.map((level) => (
            <Button
              key={level}
              variant={filter.levels.length === 1 && filter.levels[0] === level ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                "h-7 text-xs px-2 interactive-element",
                levelStyles[level].text
              )}
              onClick={() => setLevelFilter([level])}
            >
              {level}
            </Button>
          ))}
        </div>

        {/* Export */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1 bg-transparent interactive-element">
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => handleExport("txt")} className="gap-2">
              <FileText className="w-4 h-4" />
              Download as .txt
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("json")} className="gap-2">
              <FileJson className="w-4 h-4" />
              Download as .json
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("csv")} className="gap-2">
              <FileText className="w-4 h-4" />
              Download as .csv
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("clipboard")} className="gap-2">
              <Clipboard className="w-4 h-4" />
              Copy to clipboard
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Header Row */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-foreground">Live Stream</span>
          {isLiveTailEnabled && (
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
              </span>
              <span className="text-xs text-success font-medium">LIVE</span>
            </div>
          )}
          <span className="text-xs text-muted-foreground">
            {logs.length} of {parsedLogs.length} logs
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant={viewMode === "compact" ? "secondary" : "ghost"}
            size="sm"
            className="text-xs h-6 px-2 interactive-element"
            onClick={() => setViewMode("compact")}
          >
            Compact
          </Button>
          <Button
            variant={viewMode === "comfortable" ? "secondary" : "ghost"}
            size="sm"
            className="text-xs h-6 px-2 interactive-element"
            onClick={() => setViewMode("comfortable")}
          >
            Comfortable
          </Button>
        </div>
      </div>

      {/* Log Entries */}
      <div 
        ref={scrollContainerRef} 
        className="flex-1 overflow-y-auto log-viewer-scroll"
        onScroll={handleScroll}
      >
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center p-8">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <SearchX className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No logs match your filters</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              Try adjusting your search query, level filters, or smart filters to see more results.
            </p>
            <Button 
              variant="outline" 
              onClick={clearAllFilters}
              className="gap-2 bg-transparent interactive-element"
            >
              <RotateCcw className="w-4 h-4" />
              Clear All Filters
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {logs.map((log, index) => (
              <LogEntry
                key={log.id}
                log={log}
                isSelected={selectedLogId === log.id}
                onSelect={() => selectLog(log.id)}
                viewMode={viewMode}
                index={index}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating Scroll Buttons */}
      {showScrollButtons && logs.length > 0 && (
        <div className="absolute bottom-14 right-4 flex flex-col gap-2 z-20">
          <button
            onClick={scrollToTop}
            disabled={isAtTop}
            className={cn(
              "p-2 rounded-lg border shadow-lg transition-all duration-200 interactive-element",
              "bg-card/90 backdrop-blur-sm border-border",
              "hover:bg-primary hover:border-primary hover:text-primary-foreground",
              "disabled:opacity-30 disabled:pointer-events-none disabled:hover:bg-card/90"
            )}
            aria-label="Scroll to top"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <button
            onClick={scrollToBottom}
            disabled={isAtBottom}
            className={cn(
              "p-2 rounded-lg border shadow-lg transition-all duration-200 interactive-element",
              "bg-card/90 backdrop-blur-sm border-border",
              "hover:bg-primary hover:border-primary hover:text-primary-foreground",
              "disabled:opacity-30 disabled:pointer-events-none disabled:hover:bg-card/90"
            )}
            aria-label="Scroll to bottom"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-border text-xs text-muted-foreground bg-muted/30 shrink-0">
        <span className="tabular-nums">{logs.length} logs displayed</span>
        <div className="flex items-center gap-2">
          <span className="hidden md:flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 text-[10px] bg-secondary rounded border border-border">/</kbd>
            <span className="text-muted-foreground">search</span>
          </span>
          <span className="hidden md:flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 text-[10px] bg-secondary rounded border border-border">e</kbd>
            <span className="text-muted-foreground">errors</span>
          </span>
          <span className="hidden lg:flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 text-[10px] bg-secondary rounded border border-border">j/k</kbd>
            <span className="text-muted-foreground">navigate</span>
          </span>
          <span className="text-muted-foreground">Double-click to copy</span>
        </div>
      </div>
    </div>
  );
}
