"use client";

import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CenteredShell } from "@/components/layout/page-section";
import { ScrollArea } from "@/components/ui/scroll-area";

export function AnalysisProgress({
  featureCount,
  percent,
  messages,
}: {
  featureCount?: number;
  percent?: number;
  messages?: string[];
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages?.length]);

  const title = featureCount
    ? `Processing ${featureCount} feature${featureCount !== 1 ? "s" : ""}...`
    : "Processing analysis...";

  return (
    <CenteredShell>
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <Loader2 className="mb-2 size-8 animate-spin text-text-muted" />
          <CardTitle>{title}</CardTitle>
          <CardDescription>This page updates automatically.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {typeof percent === "number" && percent > 0 && (
            <div className="flex flex-col gap-1.5">
              <div className="h-1.5 overflow-hidden rounded-full bg-border">
                <div className="h-full bg-accent-green transition-all" style={{ width: `${percent}%` }} />
              </div>
              <p className="text-center text-xs text-text-muted">{percent}% complete</p>
            </div>
          )}
          {messages && messages.length > 0 && (
            <ScrollArea className="h-40 rounded-md border border-border bg-surface-raised">
              <div className="space-y-1 p-3 font-mono text-xs text-text-muted">
                {messages.map((msg, index) => (
                  <p key={index}>{msg}</p>
                ))}
                <div ref={bottomRef} />
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </CenteredShell>
  );
}
