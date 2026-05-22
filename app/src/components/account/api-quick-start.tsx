'use client';

import { useState } from 'react';
import { ChevronDown, Code2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Link } from '@/components/ui/link';
import { Label } from '@/components/ui/label';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function ApiQuickStart({ apiBase, className }: { apiBase: string; className?: string }) {
  const [open, setOpen] = useState(false);

  const samples = {
    geojson: `curl -X POST "${apiBase}/submit/geojson" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"type":"FeatureCollection","features":[...]}'`,
    wkt: `curl -X POST "${apiBase}/submit/wkt" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"wkt":"POLYGON((...))"}'`,
    geoids: `curl -X POST "${apiBase}/submit/geo-ids" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"geoIds":["id1","id2"]}'`,
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen} className={className}>
      <div className="border border-border rounded-[10px] bg-surface overflow-hidden">
        <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-3.5 text-text-muted hover:text-text-primary transition-colors cursor-pointer">
          <span className="flex items-center gap-2 text-sm font-medium">
            <Code2 className="size-3.5" />
            Quick start
          </span>
          <ChevronDown className={cn('size-3.5 transition-transform', open && 'rotate-180')} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t border-border p-4 flex flex-col gap-4">
            <div>
              <Label className="mb-2 block">1 — Authenticate every request with this header</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-lg border border-border bg-bg px-3 py-2 font-mono text-xs text-foreground">
                  x-api-key: <span className="text-muted-foreground">YOUR_API_KEY</span>
                </code>
                <Button type="button" variant="outline" onClick={() => copy('x-api-key: YOUR_API_KEY')}>
                  Copy
                </Button>
              </div>
            </div>
            <div>
              <Label className="mb-2 block">2 — Submit your data</Label>
              <Tabs defaultValue="geojson">
                <TabsList>
                  <TabsTrigger value="geojson">GeoJSON</TabsTrigger>
                  <TabsTrigger value="wkt">WKT</TabsTrigger>
                  <TabsTrigger value="geoids">Geo IDs</TabsTrigger>
                </TabsList>
                <TabsContent value="geojson" className="relative mt-2">
                  <Button type="button" variant="outline" className="absolute top-2 right-2" onClick={() => copy(samples.geojson)}>
                    Copy
                  </Button>
                  <pre className="overflow-x-auto rounded-lg border border-border bg-bg p-3 pr-16 font-mono text-xs text-muted-foreground leading-relaxed whitespace-pre">
                    {samples.geojson}
                  </pre>
                </TabsContent>
                <TabsContent value="wkt" className="relative mt-2">
                  <Button type="button" variant="outline" className="absolute top-2 right-2" onClick={() => copy(samples.wkt)}>
                    Copy
                  </Button>
                  <pre className="overflow-x-auto rounded-lg border border-border bg-bg p-3 pr-16 font-mono text-xs text-muted-foreground leading-relaxed whitespace-pre">
                    {samples.wkt}
                  </pre>
                </TabsContent>
                <TabsContent value="geoids" className="relative mt-2">
                  <Button type="button" variant="outline" className="absolute top-2 right-2" onClick={() => copy(samples.geoids)}>
                    Copy
                  </Button>
                  <pre className="overflow-x-auto rounded-lg border border-border bg-bg p-3 pr-16 font-mono text-xs text-muted-foreground leading-relaxed whitespace-pre">
                    {samples.geoids}
                  </pre>
                </TabsContent>
              </Tabs>
            </div>
            <p className="border-t border-border pt-3 text-sm">
              <Link href="https://github.com/openforis/whisp" target="_blank">
                Full API documentation →
              </Link>
            </p>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
