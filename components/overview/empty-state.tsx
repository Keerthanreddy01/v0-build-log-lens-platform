"use client";

import React from "react"

import { useState, useRef } from "react";
import { useLogStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { CloudUpload, ClipboardPaste, FileText, Sparkles } from "lucide-react";
import { toast } from "sonner";

export function EmptyState() {
  const { loadLogs, loadSampleLogs } = useLogStore();
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [pasteContent, setPasteContent] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        loadLogs(content);
        toast.success(`Loaded ${content.split("\n").length} log lines from ${file.name}`);
      }
    };
    reader.onerror = () => {
      toast.error("Failed to read file");
    };
    reader.readAsText(file);
  };

  const handlePaste = () => {
    if (pasteContent.trim()) {
      loadLogs(pasteContent);
      toast.success(`Loaded ${pasteContent.split("\n").filter(l => l.trim()).length} log lines`);
      setIsPasteModalOpen(false);
      setPasteContent("");
    }
  };

  const handleLoadSample = () => {
    loadSampleLogs();
    toast.success("Loaded sample logs for demonstration");
  };

  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="max-w-2xl w-full text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <CloudUpload className="h-10 w-10 text-muted-foreground" />
        </div>

        {/* Title and Description */}
        <h2 className="mb-2 text-2xl font-semibold text-foreground">
          Start analyzing your logs
        </h2>
        <p className="mb-8 text-muted-foreground">
          Import your logs to get started with pattern detection, error analysis, and real-time insights.
        </p>

        {/* Action Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card
            className="cursor-pointer p-6 transition-all hover:border-primary hover:bg-muted/50 interactive-element"
            onClick={() => setIsPasteModalOpen(true)}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <ClipboardPaste className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Paste Logs</h3>
                <p className="text-xs text-muted-foreground">
                  Paste log content directly
                </p>
              </div>
            </div>
          </Card>

          <Card
            className="cursor-pointer p-6 transition-all hover:border-primary hover:bg-muted/50 interactive-element"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Upload File</h3>
                <p className="text-xs text-muted-foreground">
                  .log, .txt files supported
                </p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".log,.txt,.json"
              className="hidden"
              onChange={handleFileUpload}
            />
          </Card>

          <Card
            className="cursor-pointer p-6 transition-all hover:border-primary hover:bg-muted/50 interactive-element"
            onClick={handleLoadSample}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Load Sample</h3>
                <p className="text-xs text-muted-foreground">
                  Try with example logs
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Paste Modal */}
        <Dialog open={isPasteModalOpen} onOpenChange={setIsPasteModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Paste Your Logs</DialogTitle>
            </DialogHeader>
            <Textarea
              placeholder="Paste your log content here...
Example:
2024-02-01T10:15:23.456Z INFO [server] Application started
2024-02-01T10:15:24.123Z ERROR [api] Connection failed"
              className="min-h-[300px] font-mono text-sm"
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
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
      </div>
    </div>
  );
}
