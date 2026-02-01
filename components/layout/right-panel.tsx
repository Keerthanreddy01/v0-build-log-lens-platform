"use client";

import { X, Copy, ExternalLink, Clock, Link2, ChevronLeft, ChevronRight, Bookmark, BookmarkPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLogStore } from "@/lib/store";
import { getRelatedLogs } from "@/lib/log-parser";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function MetadataRow({
  label,
  value,
  highlight,
  copyable,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  copyable?: boolean;
}) {
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    toast.success(`Copied ${label}`);
  };

  return (
    <div className="flex justify-between items-center py-2 gap-2">
      <span className="text-xs text-muted-foreground font-mono shrink-0">{label}:</span>
      <div className="flex items-center gap-2 min-w-0">
        <span
          className={cn(
            "text-xs font-mono truncate",
            highlight ? "text-primary" : "text-foreground"
          )}
          title={value}
        >
          {value}
        </span>
        {copyable && (
          <button
            onClick={handleCopy}
            className="text-muted-foreground hover:text-foreground shrink-0 p-1 rounded hover:bg-secondary interactive-element"
          >
            <Copy className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

export function RightPanel() {
  const { selectedLogId, parsedLogs, isDetailsPanelOpen, toggleDetailsPanel, selectLog, addSavedQuery, filter } =
    useLogStore();

  const selectedLog = parsedLogs.find((log) => log.id === selectedLogId);
  const selectedIndex = selectedLog ? parsedLogs.findIndex(l => l.id === selectedLogId) : -1;
  const relatedLogs = selectedLog?.requestId
    ? getRelatedLogs(parsedLogs, selectedLog.requestId).filter(
        (l) => l.id !== selectedLogId
      )
    : [];

  // Navigation handlers
  const goToPrevious = () => {
    if (selectedIndex > 0) {
      selectLog(parsedLogs[selectedIndex - 1].id);
    }
  };

  const goToNext = () => {
    if (selectedIndex < parsedLogs.length - 1) {
      selectLog(parsedLogs[selectedIndex + 1].id);
    }
  };

  if (!isDetailsPanelOpen) {
    return (
      <button
        onClick={toggleDetailsPanel}
        className="w-10 border-l border-border bg-card flex items-center justify-center hover:bg-secondary transition-colors shrink-0 interactive-element"
        aria-label="Show details panel"
      >
        <ChevronLeft className="w-4 h-4 text-muted-foreground" />
      </button>
    );
  }
  
  if (!selectedLog) {
    return (
      <aside className="w-[320px] border-l border-border bg-card flex flex-col shrink-0">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              Log Context
            </h2>
            <p className="text-xs text-muted-foreground">
              Select a log to view details
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={toggleDetailsPanel} className="interactive-element">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <div>
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Bookmark className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Click on a log entry to view its details and metadata</p>
          </div>
        </div>
      </aside>
    );
  }

  const levelColors: Record<string, string> = {
    ERROR: "bg-destructive text-white",
    WARN: "bg-warning text-black",
    INFO: "bg-primary text-white",
    DEBUG: "bg-muted-foreground text-white",
    TRACE: "bg-muted text-foreground",
  };

  const handleCopyLog = () => {
    navigator.clipboard.writeText(selectedLog.rawLine);
    toast.success("Log copied to clipboard");
  };

  const handleInspectJSON = () => {
    const ts = selectedLog.timestamp instanceof Date ? selectedLog.timestamp : new Date(selectedLog.timestamp);
    const json = JSON.stringify(
      {
        timestamp: ts.toISOString(),
        level: selectedLog.level,
        service: selectedLog.service,
        message: selectedLog.message,
        requestId: selectedLog.requestId,
        metadata: selectedLog.metadata,
        rawLine: selectedLog.rawLine,
      },
      null,
      2
    );
    navigator.clipboard.writeText(json);
    toast.success("Full JSON copied to clipboard");
  };

  const handleSaveAsQuery = () => {
    const queryName = `${selectedLog.service} - ${selectedLog.level}`;
    addSavedQuery({
      id: Date.now().toString(),
      name: queryName,
      filter: {
        ...filter,
        search: selectedLog.service,
        levels: [selectedLog.level],
      },
      icon: 'star',
    });
    toast.success(`Saved query: ${queryName}`);
  };

  return (
    <aside className="w-[320px] border-l border-border bg-card flex flex-col overflow-hidden shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-border shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
            Log Context
          </h2>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 interactive-element"
              onClick={goToPrevious}
              disabled={selectedIndex <= 0}
              title="Previous log (k)"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs text-muted-foreground tabular-nums px-1">
              {selectedIndex + 1}/{parsedLogs.length}
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 interactive-element"
              onClick={goToNext}
              disabled={selectedIndex >= parsedLogs.length - 1}
              title="Next log (j)"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 interactive-element" onClick={toggleDetailsPanel}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Detailed properties for selected entry
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-5">
        {/* Overview */}
        <section>
          <div className="flex items-center gap-3 mb-3">
            <Badge className={cn("px-2 py-1 text-xs", levelColors[selectedLog.level])}>
              {selectedLog.level}
            </Badge>
            <span className="text-sm text-primary font-mono">
              [{selectedLog.service}]
            </span>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {(selectedLog.timestamp instanceof Date ? selectedLog.timestamp : new Date(selectedLog.timestamp)).toLocaleString()}
          </p>
        </section>

        {/* Metadata */}
        <section>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Metadata
          </h3>
          <div className="bg-secondary/50 rounded-lg p-3 divide-y divide-border/50">
            {selectedLog.requestId && (
              <MetadataRow
                label="Request ID"
                value={selectedLog.requestId}
                copyable
              />
            )}
            <MetadataRow label="Service" value={selectedLog.service} highlight />
            {selectedLog.metadata?.ip && (
              <MetadataRow label="IP" value={selectedLog.metadata.ip} copyable />
            )}
            {selectedLog.metadata?.statusCode && (
              <MetadataRow
                label="Status"
                value={selectedLog.metadata.statusCode}
              />
            )}
            {selectedLog.metadata?.duration && (
              <MetadataRow
                label="Duration"
                value={selectedLog.metadata.duration}
              />
            )}
            {selectedLog.metadata?.url && (
              <MetadataRow label="URL" value={selectedLog.metadata.url} copyable />
            )}
            <MetadataRow label="Environment" value="production" />
          </div>
        </section>

        {/* Message */}
        <section>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Message
          </h3>
          <div className="bg-secondary/50 rounded-lg p-3 relative group">
            <pre className="text-xs font-mono text-foreground whitespace-pre-wrap break-all leading-relaxed">
              {selectedLog.message}
            </pre>
            <button
              onClick={() => {
                navigator.clipboard.writeText(selectedLog.message);
                toast.success("Message copied");
              }}
              className="absolute top-2 right-2 p-1.5 rounded bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity interactive-element"
            >
              <Copy className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
            </button>
          </div>
        </section>

        {/* Related Logs */}
        {relatedLogs.length > 0 && (
          <section>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <Link2 className="w-3.5 h-3.5" />
              Related Logs ({relatedLogs.length})
            </h3>
            <div className="space-y-2">
              {relatedLogs.slice(0, 5).map((log) => (
                <button
                  key={log.id}
                  onClick={() => selectLog(log.id)}
                  className="w-full text-left bg-secondary/50 rounded-lg p-2.5 hover:bg-secondary transition-colors interactive-element"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      className={cn(
                        "text-[10px] px-1 py-0",
                        levelColors[log.level]
                      )}
                    >
                      {log.level}
                    </Badge>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {(log.timestamp instanceof Date ? log.timestamp : new Date(log.timestamp)).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-foreground truncate">
                    {log.message}
                  </p>
                </button>
              ))}
              {relatedLogs.length > 5 && (
                <p className="text-xs text-muted-foreground text-center py-1">
                  +{relatedLogs.length - 5} more related logs
                </p>
              )}
            </div>
          </section>
        )}

        {/* Quick Actions */}
        <section>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Quick Actions
          </h3>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={handleCopyLog} className="text-xs h-8 interactive-element">
              <Copy className="w-3.5 h-3.5 mr-1.5" />
              Copy Log
            </Button>
            <Button variant="secondary" size="sm" onClick={handleSaveAsQuery} className="text-xs h-8 interactive-element">
              <BookmarkPlus className="w-3.5 h-3.5 mr-1.5" />
              Save Query
            </Button>
          </div>
        </section>
      </div>

      {/* Footer Action */}
      <div className="p-4 border-t border-border shrink-0">
        <Button
          className="w-full gap-2 interactive-element"
          variant="secondary"
          onClick={handleInspectJSON}
        >
          <ExternalLink className="w-4 h-4" />
          Copy Full JSON
        </Button>
      </div>
    </aside>
  );
}
