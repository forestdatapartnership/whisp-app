"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { controlRounded } from "@/components/ui/styles";
import { Card } from "@/components/ui/card";
import { CenteredShell } from "@/components/layout/page-section";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/icons";

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
  const latestIndex = (messages?.length ?? 0) - 1;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages?.length]);

  const title = featureCount
    ? `Processing ${featureCount} feature${featureCount !== 1 ? "s" : ""}`
    : "Processing analysis";

  return (
    <CenteredShell className="px-4">
      <Card className="w-full max-w-[520px] gap-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <Spinner className="size-10 text-accent-green" />
          <div className="flex flex-col gap-1.5">
            <h1 className="text-lg font-semibold text-text-primary">{title}</h1>
            <p className="text-[13px] leading-relaxed text-text-muted">
              This page updates automatically.
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

        {messages && messages.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
              Status
            </span>
            <ScrollArea className={`h-44 ${controlRounded} border border-border bg-bg`}>
              <div className="space-y-0.5 p-3">
                {messages.map((msg, index) => (
                  <p
                    key={index}
                    className={cn(
                      "font-mono text-xs leading-snug",
                      index === latestIndex ? "text-text-primary" : "text-text-dim"
                    )}
                  >
                    {msg}
                  </p>
                ))}
                <div ref={bottomRef} />
              </div>
            </ScrollArea>
          </div>
        )}
      </Card>
    </CenteredShell>
  );
}
