"use client";

import React from "react"

import { useRef, useState, useEffect } from "react";
import { Search, Bell, Settings, ChevronRight, Upload, Trash2, Keyboard, FileUp, ClipboardPaste, Database } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useLogStore } from "@/lib/store";
import { toast } from "sonner";
import Link from "next/link";

export function TopNav() {
  const { loadLogs, loadSampleLogs, clearLogs, updateFilter, parsedLogs, stats } = useLogStore();
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [pasteContent, setPasteContent] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA";

      // Cmd/Ctrl + K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }

      // Cmd/Ctrl + O to open file
      if ((e.metaKey || e.ctrlKey) && e.key === "o" && !isInput) {
        e.preventDefault();
        fileInputRef.current?.click();
      }

      // Cmd/Ctrl + V to paste (when not in input)
      if ((e.metaKey || e.ctrlKey) && e.key === "v" && !isInput) {
        e.preventDefault();
        setIsPasteModalOpen(true);
      }

      // ? to show shortcuts
      if (e.key === "?" && !isInput) {
        e.preventDefault();
        setIsShortcutsOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        loadLogs(content);
        toast.success(`Loaded ${content.split("\n").filter(l => l.trim()).length} log lines from ${file.name}`);
      }
    };
    reader.onerror = () => {
      toast.error("Failed to read file");
    };
    reader.readAsText(file);
    // Reset input so same file can be uploaded again
    event.target.value = "";
  };

  const handlePaste = () => {
    if (pasteContent.trim()) {
      loadLogs(pasteContent);
      const lineCount = pasteContent.split("\n").filter((l) => l.trim()).length;
      toast.success(`Loaded ${lineCount} log lines`);
      setIsPasteModalOpen(false);
      setPasteContent("");
    }
  };

  const handleGlobalSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      updateFilter({ search: globalSearch });
      toast.info(`Searching for: ${globalSearch}`);
    }
    if (e.key === "Escape") {
      setGlobalSearch("");
      searchInputRef.current?.blur();
    }
  };

  const handleLoadSample = () => {
    loadSampleLogs();
    toast.success("Sample logs loaded");
  };

  const handleClearLogs = () => {
    clearLogs();
    toast.success("All logs cleared");
  };

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity interactive-element">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">L</span>
          </div>
          <span className="font-semibold text-foreground hidden sm:inline">LogLens</span>
        </Link>

        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          <span className="hover:text-foreground cursor-pointer transition-colors">Projects</span>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground font-medium">Production</span>
        </nav>
      </div>

      <div className="flex-1 max-w-md mx-4 lg:mx-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            ref={searchInputRef}
            placeholder="Search logs..."
            className="pl-10 pr-20 bg-secondary border-border text-sm h-9 focus:border-primary"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            onKeyDown={handleGlobalSearch}
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] bg-muted rounded border border-border text-muted-foreground">
            {navigator.platform?.includes("Mac") ? "Cmd" : "Ctrl"}+K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {/* Upload/Import Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground interactive-element">
              <Upload className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => setIsPasteModalOpen(true)} className="gap-2">
              <ClipboardPaste className="w-4 h-4" />
              Paste Logs
              <DropdownMenuShortcut>{navigator.platform?.includes("Mac") ? "Cmd" : "Ctrl"}+V</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="gap-2">
              <FileUp className="w-4 h-4" />
              Upload File
              <DropdownMenuShortcut>{navigator.platform?.includes("Mac") ? "Cmd" : "Ctrl"}+O</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLoadSample} className="gap-2">
              <Database className="w-4 h-4" />
              Load Sample Data
            </DropdownMenuItem>
            {parsedLogs.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleClearLogs} className="text-destructive gap-2">
                  <Trash2 className="w-4 h-4" />
                  Clear All Logs
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <input
          ref={fileInputRef}
          type="file"
          accept=".log,.txt,.json"
          className="hidden"
          onChange={handleFileUpload}
        />

        {/* Notifications */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative interactive-element">
              <Bell className="w-5 h-5" />
              {stats.errorRate > 5 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80">
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Notifications</h3>
              {stats.errorRate > 5 ? (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  <p className="text-sm font-medium text-destructive">High Error Rate Alert</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Error rate is currently at {stats.errorRate.toFixed(1)}% which exceeds the 5% threshold.
                  </p>
                </div>
              ) : parsedLogs.length > 0 ? (
                <p className="text-sm text-muted-foreground">All systems operating normally.</p>
              ) : (
                <p className="text-sm text-muted-foreground">No notifications. Load some logs to get started.</p>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Keyboard Shortcuts */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-muted-foreground hover:text-foreground interactive-element"
          onClick={() => setIsShortcutsOpen(true)}
        >
          <Keyboard className="w-5 h-5" />
        </Button>

        {/* Settings */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-muted-foreground hover:text-foreground interactive-element"
          onClick={() => setIsSettingsOpen(true)}
        >
          <Settings className="w-5 h-5" />
        </Button>

        {/* User Avatar */}
        <Avatar className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 ml-2">
          <AvatarFallback className="bg-transparent text-white text-xs font-medium">
            JD
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Paste Modal */}
      <Dialog open={isPasteModalOpen} onOpenChange={setIsPasteModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Paste Your Logs</DialogTitle>
            <DialogDescription>
              Paste raw log content below. Supported formats: standard logs, JSON, Apache/Nginx access logs.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Paste your logs here...

Example formats:
2024-02-01T10:15:23.456Z INFO [server] Application started on port 3000
2024-02-01T10:15:24.123Z ERROR [api] Connection timeout after 30000ms
Jan 15 10:30:45 api-server nginx: 192.168.1.100 - - [15/Jan/2024:10:30:45 +0000] GET /api/users 200"
            className="min-h-[300px] font-mono text-sm"
            value={pasteContent}
            onChange={(e) => setPasteContent(e.target.value)}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPasteModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePaste} disabled={!pasteContent.trim()}>
              Parse Logs
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Modal */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>
              Configure your LogLens preferences.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Settings panel coming soon. This will include theme options, log parsing preferences, and notification settings.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsSettingsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Keyboard Shortcuts Modal */}
      <Dialog open={isShortcutsOpen} onOpenChange={setIsShortcutsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">Navigation</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Focus search</span>
                <kbd className="px-2 py-1 bg-secondary rounded text-xs text-right">/ or Cmd+K</kbd>
                <span className="text-muted-foreground">Navigate logs</span>
                <kbd className="px-2 py-1 bg-secondary rounded text-xs text-right">j / k or Arrows</kbd>
                <span className="text-muted-foreground">Clear selection</span>
                <kbd className="px-2 py-1 bg-secondary rounded text-xs text-right">Escape</kbd>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">Filters</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Show errors</span>
                <kbd className="px-2 py-1 bg-secondary rounded text-xs text-right">e</kbd>
                <span className="text-muted-foreground">Show warnings</span>
                <kbd className="px-2 py-1 bg-secondary rounded text-xs text-right">w</kbd>
                <span className="text-muted-foreground">Show info</span>
                <kbd className="px-2 py-1 bg-secondary rounded text-xs text-right">i</kbd>
                <span className="text-muted-foreground">Show all</span>
                <kbd className="px-2 py-1 bg-secondary rounded text-xs text-right">a</kbd>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">Actions</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Copy selected log</span>
                <kbd className="px-2 py-1 bg-secondary rounded text-xs text-right">c</kbd>
                <span className="text-muted-foreground">Paste logs</span>
                <kbd className="px-2 py-1 bg-secondary rounded text-xs text-right">Cmd+V</kbd>
                <span className="text-muted-foreground">Upload file</span>
                <kbd className="px-2 py-1 bg-secondary rounded text-xs text-right">Cmd+O</kbd>
                <span className="text-muted-foreground">Show shortcuts</span>
                <kbd className="px-2 py-1 bg-secondary rounded text-xs text-right">?</kbd>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsShortcutsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
