"use client";

import { useState, useEffect, useRef } from "react";
import { XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { cardLayout, controlRounded, logHeight } from "@/components/ui/styles";
import { Card } from "@/components/ui/card";
import { CenteredShell } from "@/components/layout/page-section";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";

export function AnalysisProgress({
  token,
  code,
  featureCount,
  percent,
  messages,
  asyncMode,
  onCancelled,
}: {
  token: string;
  code?: string;
  featureCount?: number;
  percent?: number;
  messages?: string[];
  asyncMode?: boolean;
  onCancelled?: () => void;
}) {
  const [cancelling, setCancelling] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const latestIndex = (messages?.length ?? 0) - 1;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages?.length]);

  const isQueued = code === 'analysis_queued';
  const queueMode = asyncMode ? 'Concurrent' : 'Sequential';
  const title = isQueued ? 'Analysis Queued' : 'Analysis in Progress';
  const subtitle = isQueued
    ? `Waiting for an available worker · ${queueMode} Mode`
    : featureCount
      ? `Processing ${featureCount} features in ${queueMode} Mode`
      : `Processing in ${queueMode} Mode`;

  return (
    <CenteredShell className="px-4">
      <Card className={cardLayout.md}>
        <div className="flex flex-col items-center gap-4 text-center">
          <Spinner className="size-10 text-accent-green" />
          <div className="flex flex-col gap-1.5">
            <h1 className="text-lg font-semibold text-text-primary">{title}</h1>
            <p className="text-[13px] leading-relaxed text-text-muted">
              {subtitle}
            </p>
          </div>
        </div>

        {typeof percent === "number" && percent > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-text-muted">
              <span>Progress</span>
              <span>{percent}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-accent-green transition-all duration-300 ease-out"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
            Status
          </span>
          <ScrollArea className={`${logHeight} ${controlRounded} border border-border bg-bg`}>
            <div className="space-y-0.5 p-3">
              {messages && messages.length > 0 ? (
                messages.map((msg, index) => (
                  <p
                    key={index}
                    className={cn(
                      "font-mono text-xs leading-snug",
                      index === latestIndex ? "text-text-primary" : "text-text-dim"
                    )}
                  >
                    {msg}
                  </p>
                ))
              ) : (
                <p className="font-mono text-xs leading-snug text-text-dim">
                  {isQueued ? 'Waiting in queue…' : 'Starting…'}
                </p>
              )}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>
        </div>

        <Button
          variant="destructive"
          size="sm"
          className="self-center"
          disabled={cancelling}
          onClick={async () => {
            setCancelling(true);
            try {
              await fetch(`/internal/status/${token}/cancel`, { method: 'POST' });
              onCancelled?.();
            } catch {
              setCancelling(false);
            }
          }}
        >
          <XCircle className="size-3.5" />
          {cancelling ? 'Cancelling…' : 'Cancel analysis'}
        </Button>
      </Card>
    </CenteredShell>
  );
}
