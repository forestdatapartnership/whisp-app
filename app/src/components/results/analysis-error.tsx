"use client";

import { AlertTriangle, ArrowLeft } from "lucide-react";
import { controlRounded } from "@/components/ui/styles";
import { Card } from "@/components/ui/card";
import { CenteredShell } from "@/components/layout/page-section";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

export function AnalysisError({
  message,
  cause,
  onBack,
}: {
  message?: string;
  cause?: string;
  onBack: () => void;
}) {
  return (
    <CenteredShell className="px-4">
      <Card className="w-full max-w-[560px] gap-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-red-500/10">
            <AlertTriangle className="size-6 text-red-400" />
          </div>
          <div className="flex flex-col gap-1.5">
            <h1 className="text-lg font-semibold text-text-primary">Analysis failed</h1>
            {message && (
              <p className="text-[13px] leading-relaxed text-text-muted">{message}</p>
            )}
          </div>
        </div>

        {cause && (
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
              Error details
            </span>
            <ScrollArea className={`h-44 ${controlRounded} border border-border bg-bg`}>
              <div className="p-3">
                <p className="font-mono text-xs leading-relaxed text-text-muted">{cause}</p>
              </div>
            </ScrollArea>
          </div>
        )}

        <Button variant="outline" size="sm" className="self-start" onClick={onBack}>
          <ArrowLeft className="size-3.5" /> Go Back
        </Button>
      </Card>
    </CenteredShell>
  );
}
