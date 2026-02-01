"use client";

import React from "react"

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
  Pause,
  Play,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const levelStyles: Record<LogLevel, { badge: string; bg: string; text: string; border: string }> = {
  ERROR: { 
    badge: "bg-destructive text-white", 
    bg: "bg-destructive/5 hover:bg-destructive/10", 
    text: "text-destructive",
    border: "border-l-destructive"
  },
  WARN: { 
    badge: "bg-warning text-black", 
    bg: "bg-warning/5 hover:bg-warning/10", 
    text: "text-warning",
    border: "border-l-warning"
  },
  INFO: { 
    badge: "bg-primary text-white", 
    bg: "hover:bg-primary/5", 
    text: "text-primary",
    border: "border-l-primary"
  },
  DEBUG: { 
    badge: "bg-muted-foreground text-white", 
    bg: "hover:bg-muted/30", 
    text: "text-muted-foreground",
    border: "border-l-muted-foreground"
  },
  TRACE: { 
    badge: "bg-muted text-foreground", 
    bg: "hover:bg-muted/20", 
    text: "text-muted-foreground",
    border: "border-l-muted"
  },
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
  });

  const highlightedMessage = highlightLogMessage(log.message);

  const handleDoubleClick = useCallback(() => {
    navigator.clipboard.writeText(log.rawLine);
    toast.success("Log copied to clipboard");
  }, [log.rawLine]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect();
    }
  }, [onSelect]);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      data-index={index}
      data-level={log.level}
      className={cn(
        "w-full text-left border-l-[3px] transition-all duration-75 log-entry outline-none",
        "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset",
        viewMode === "compact" ? "px-3 py-1.5" : "px-4 py-2.5",
        isSelected 
          ? "bg-primary/10 border-l-primary" 
          : cn(styles.bg, styles.border, "border-l-transparent hover:border-l-current"),
      )}
      style={{ contain: "layout style paint" }}
    >
      <div className="flex items-start gap-2 sm:gap-3">
        <span className="text-[11px] font-mono text-muted-foreground whitespace-nowrap tabular-nums shrink-0">
          {timestamp}
        </span>
        <span className="text-[11px] font-mono text-primary whitespace-nowrap shrink-0 hidden sm:inline">
          [{log.service}]
        </span>
        <Badge 
          className={cn(
            "text-[10px] font-semibold px-1.5 py-0 h-[18px] shrink-0 rounded",
            styles.badge
          )}
        >
          {log.level}
        </Badge>
        <span className="text-[12px] sm:text-[13px] text-foreground flex-1 break-words font-mono leading-relaxed min-w-0">
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
    </div>
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
    setLiveTail,
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
      
      if (e.key === "/" && !isInput && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
      
      if (isInput && e.key !== "Escape") return;
      
      switch (e.key) {
        case "e":
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            setLevelFilter(["ERROR"]);
            toast.info("Showing errors only");
          }
          break;
        case "w":
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            setLevelFilter(["WARN"]);
            toast.info("Showing warnings only");
          }
          break;
        case "i":
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            setLevelFilter(["INFO"]);
            toast.info("Showing info only");
          }
          break;
        case "a":
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            setLevelFilter(["ERROR", "WARN", "INFO", "DEBUG", "TRACE"]);
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
        case " ":
          if (!isInput) {
            e.preventDefault();
            setLiveTail(!isLiveTailEnabled);
            toast.info(isLiveTailEnabled ? "Live tail paused" : "Live tail resumed");
          }
          break;
        case "c":
          if (!e.ctrlKey && !e.metaKey && !isInput && selectedLogId) {
            const log = logs.find((l) => l.id === selectedLogId);
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
  }, [setLevelFilter, updateFilter, selectLog, selectedLogId, logs, isLiveTailEnabled, setLiveTail]);

  const navigateLog = useCallback((direction: number) => {
    if (logs.length === 0) return;
    
    const currentIndex = selectedLogId ? logs.findIndex((l) => l.id === selectedLogId) : -1;
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
    }, 150);

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
    const threshold = 50;
    
    setIsAtTop(scrollTop < threshold);
    setIsAtBottom(scrollHeight - scrollTop - clientHeight < threshold);
    setShowScrollButtons(scrollHeight > clientHeight + 100);
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
    setLevelFilter(["ERROR", "WARN", "INFO", "DEBUG", "TRACE"]);
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
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border flex-wrap shrink-0 bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/80">
        {/* Search */}
        <div className="relative flex-1 min-w-[150px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <Input
            ref={searchInputRef}
            placeholder="Search... (press /)"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-8 pr-7 h-7 text-xs bg-secondary border-border focus:border-primary focus:ring-1 focus:ring-primary/30"
          />
          {localSearch && (
            <button
              onClick={() => {
                setLocalSearch("");
                updateFilter({ search: "" });
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-muted"
            >
              <X className="w-3 h-3 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>

        {/* Level Filters */}
        <div className="flex items-center gap-0.5 bg-secondary/50 rounded-md p-0.5">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-6 text-[10px] px-1.5 font-medium",
              filter.levels.length === 5 && "bg-background shadow-sm"
            )}
            onClick={() => setLevelFilter(["ERROR", "WARN", "INFO", "DEBUG", "TRACE"])}
          >
            ALL
          </Button>
          {levels.slice(0, 3).map((level) => (
            <Button
              key={level}
              variant="ghost"
              size="sm"
              className={cn(
                "h-6 text-[10px] px-1.5 font-medium",
                filter.levels.length === 1 && filter.levels[0] === level && "bg-background shadow-sm",
                levelStyles[level].text
              )}
              onClick={() => setLevelFilter([level])}
            >
              {level}
            </Button>
          ))}
        </div>

        {/* Live/Pause Toggle */}
        <Button
          variant={isLiveTailEnabled ? "default" : "outline"}
          size="sm"
          className={cn(
            "h-7 text-xs gap-1.5 px-2",
            isLiveTailEnabled && "bg-success hover:bg-success/90 text-white"
          )}
          onClick={() => setLiveTail(!isLiveTailEnabled)}
        >
          {isLiveTailEnabled ? (
            <>
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
              </span>
              LIVE
            </>
          ) : (
            <>
              <Pause className="w-3 h-3" />
              PAUSED
            </>
          )}
        </Button>

        {/* Export */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1 px-2 bg-transparent">
              <Download className="w-3 h-3" />
              <ChevronDown className="w-2.5 h-2.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => handleExport("txt")} className="gap-2 text-xs">
              <FileText className="w-3.5 h-3.5" />
              Download .txt
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("json")} className="gap-2 text-xs">
              <FileJson className="w-3.5 h-3.5" />
              Download .json
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("csv")} className="gap-2 text-xs">
              <FileText className="w-3.5 h-3.5" />
              Download .csv
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("clipboard")} className="gap-2 text-xs">
              <Clipboard className="w-3.5 h-3.5" />
              Copy to clipboard
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-muted/20 shrink-0">
        <span className="text-xs text-muted-foreground tabular-nums">
          {logs.length} of {parsedLogs.length} logs
        </span>
        <div className="flex items-center gap-0.5 bg-secondary/50 rounded p-0.5">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-5 text-[10px] px-2",
              viewMode === "compact" && "bg-background shadow-sm"
            )}
            onClick={() => setViewMode("compact")}
          >
            Compact
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-5 text-[10px] px-2",
              viewMode === "comfortable" && "bg-background shadow-sm"
            )}
            onClick={() => setViewMode("comfortable")}
          >
            Comfortable
          </Button>
        </div>
      </div>

      {/* Log Entries */}
      <div 
        ref={scrollContainerRef} 
        className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain touch-pan-y custom-scrollbar"
        onScroll={handleScroll}
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center p-6">
            <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <SearchX className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1.5">No logs match filters</h3>
            <p className="text-xs text-muted-foreground mb-4 max-w-xs">
              Try adjusting your search or level filters
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={clearAllFilters}
              className="gap-1.5 h-8 text-xs bg-transparent"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear Filters
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
        <div className="absolute bottom-16 right-3 flex flex-col gap-1.5 z-20">
          <button
            onClick={scrollToTop}
            disabled={isAtTop}
            className={cn(
              "p-1.5 rounded-md border shadow-lg transition-all duration-150",
              "bg-card/95 backdrop-blur-sm border-border",
              "hover:bg-primary hover:border-primary hover:text-primary-foreground",
              "disabled:opacity-20 disabled:pointer-events-none"
            )}
            aria-label="Scroll to top"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={scrollToBottom}
            disabled={isAtBottom}
            className={cn(
              "p-1.5 rounded-md border shadow-lg transition-all duration-150",
              "bg-card/95 backdrop-blur-sm border-border",
              "hover:bg-primary hover:border-primary hover:text-primary-foreground",
              "disabled:opacity-20 disabled:pointer-events-none"
            )}
            aria-label="Scroll to bottom"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Footer with shortcuts hint */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-border text-[10px] text-muted-foreground bg-muted/20 shrink-0">
        <div className="flex items-center gap-3">
          <span className="hidden sm:flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-secondary rounded text-[9px]">/</kbd>
            <span>search</span>
          </span>
          <span className="hidden md:flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-secondary rounded text-[9px]">e</kbd>
            <span>errors</span>
          </span>
          <span className="hidden md:flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-secondary rounded text-[9px]">Space</kbd>
            <span>pause</span>
          </span>
        </div>
        <span>Double-click to copy</span>
      </div>
    </div>
  );
}
