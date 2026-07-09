"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import {
  getResultFields,
  createResultField,
  updateResultField,
  deleteResultField,
} from "./actions";
import {
  getCommodities,
} from "../commodities/actions";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { CrudDataTable } from "@/components/crud/data-table";
import { controlRounded, cardLayout } from "@/components/ui/styles";
import { formatSystemMessage } from "@/types/system-codes";
import type { ResultField, Commodity, CommodityMetadata } from "@/types/models";

type Mode = "list" | "edit" | "create";
type MessageType = { type: "success" | "error"; text: string } | null;

const FIELD_TYPES = ["numeric", "char", "bool"];
const ANALYSIS_TYPES = ["string", "int32", "int64", "float32", "float64", "bool", "object"];

function ResultFieldsPage() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [fields, setFields] = useState<ResultField[]>([]);
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [mode, setMode] = useState<Mode>("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<ResultField>>({});
  const [readonly, setReadonly] = useState(false);
  const [message, setMessage] = useState<MessageType>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const [fRes, cRes] = await Promise.all([getResultFields(), getCommodities()]);
    if (fRes.ok) setFields(fRes.data);
    else setMessage({ type: "error", text: formatSystemMessage(fRes.code, fRes.args) });
    if (cRes.ok) setCommodities(cRes.data);
  }, []);

  useEffect(() => { load(); }, [load]);

  const reset = useCallback(() => {
    setMode("list"); setEditingId(null); setForm({}); setReadonly(false);
  }, []);

  const openField = useCallback((id: string, asReadonly: boolean) => {
    const f = fields.find((x) => x.id === id);
    if (f) { setMode("edit"); setEditingId(id); setForm(f); setReadonly(asReadonly); setMessage(null); }
  }, [fields]);

  const startCreate = useCallback(() => {
    setMode("create"); setForm({}); setReadonly(false); setMessage(null);
  }, []);

  const updateField = useCallback(<K extends keyof ResultField>(key: K, value: ResultField[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    setLoading(true); setMessage(null);
    try {
      if (mode === "create" && !form.id) throw new Error("Code is required");
      if (mode === "create") {
        const payload: Omit<ResultField, "createdAt" | "createdBy" | "updatedAt" | "updatedBy"> = {
          id: form.id!,
          type: form.type,
          unit: form.unit,
          description: form.description,
          category: form.category,
          order: form.order,
          iso2Code: form.iso2Code,
          period: form.period,
          source: form.source,
          comments: form.comments,
          powerBiMetadata: form.powerBiMetadata,
          commodityMetadata: form.commodityMetadata,
          displayMetadata: form.displayMetadata,
          analysisMetadata: form.analysisMetadata,
        };
        const res = await createResultField(payload);
        if (!res.ok) throw new Error(formatSystemMessage(res.code, res.args));
        setMessage({ type: "success", text: "Result field created" });
      } else {
        const updates: Partial<ResultField> = {
          type: form.type,
          unit: form.unit,
          description: form.description,
          category: form.category,
          order: form.order,
          iso2Code: form.iso2Code,
          period: form.period,
          source: form.source,
          comments: form.comments,
          powerBiMetadata: form.powerBiMetadata,
          commodityMetadata: form.commodityMetadata,
          displayMetadata: form.displayMetadata,
          analysisMetadata: form.analysisMetadata,
        };
        const res = await updateResultField(editingId!, updates);
        if (!res.ok) throw new Error(formatSystemMessage(res.code, res.args));
        setMessage({ type: "success", text: "Result field updated" });
      }
      await load();
      reset();
      router.refresh();
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Error" });
    } finally { setLoading(false); }
  }, [mode, form, editingId, load, reset, router]);

  const afterDelete = useCallback(async () => {
    await load();
    router.refresh();
  }, [load, router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && mode !== "list") reset(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, reset]);

  const columns = useMemo(() => [
    { key: "order" as const, header: "Order" },
    { key: "id" as const, header: "Code" },
    { key: "category" as const, header: "Category" },
    { key: "description" as const, header: "Description", truncate: true },
  ], []);

  const formatDate = (v?: Date | string) => v ? new Date(v).toLocaleString() : "";

  const sortedCommodities = useMemo(() =>
    [...commodities].sort((a, b) => a.id.localeCompare(b.id)),
  [commodities]);

  const updateCommodityMeta = useCallback((code: string, patch: Partial<CommodityMetadata>) => {
    setForm((prev) => {
      const current = prev.commodityMetadata ?? {};
      const existing = current[code] ?? {};
      const merged = { ...existing, ...patch };
      const hasValues = merged.usedForRisk != null || (merged.dataTheme != null && merged.dataTheme !== "");
      const next = { ...current };
      if (hasValues) next[code] = merged;
      else delete next[code];
      return { ...prev, commodityMetadata: next };
    });
  }, []);

  const disabled = readonly;

  return (
    <div className="-mx-6 -my-8 flex flex-1 flex-col self-stretch overflow-hidden">
      {message && (
        <div className="shrink-0 px-[14px] py-2">
          <Alert type={message.type} message={message.text} onClose={() => setMessage(null)} />
        </div>
      )}

      {mode !== "list" ? (
        <div className="flex flex-1 items-start justify-center overflow-auto p-8">
        <Card className={cardLayout.xl}>
          <CardHeader>
            <CardTitle>
              {mode === "create" ? "New Result Field" : readonly ? `Result Field: ${editingId}` : `Edit ${editingId}`}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Code</Label>
                <Input value={form.id ?? ""} disabled={mode === "edit" || disabled} placeholder="e.g. TMF_plant"
                  onChange={(e) => updateField("id", e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Order</Label>
                <Input type="number" value={form.order ?? ""} disabled={disabled} placeholder="0"
                  onChange={(e) => updateField("order", Number(e.target.value))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Type</Label>
                <Select value={String(form.type ?? "")} onValueChange={(v) => updateField("type", v ?? "")} disabled={disabled}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Unit</Label>
                <Input value={form.unit ?? ""} disabled={disabled} placeholder="e.g. ha / %"
                  onChange={(e) => updateField("unit", e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Period</Label>
                <Input value={form.period ?? ""} disabled={disabled} placeholder="e.g. 2020"
                  onChange={(e) => updateField("period", e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>ISO2 Code</Label>
                <Input value={form.iso2Code ?? ""} disabled={disabled} placeholder="ISO2"
                  onChange={(e) => updateField("iso2Code", e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Category</Label>
                <Input value={form.category ?? ""} disabled={disabled} placeholder="e.g. indicators"
                  onChange={(e) => updateField("category", e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label>Short description</Label>
                <Input value={form.description ?? ""} disabled={disabled} placeholder="Description"
                  onChange={(e) => updateField("description", e.target.value)} />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Source</Label>
              <Textarea value={form.source ?? ""} disabled={disabled} placeholder="Source"
                onChange={(e) => updateField("source", e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Comments</Label>
              <Textarea value={form.comments ?? ""} disabled={disabled} placeholder="Comments"
                onChange={(e) => updateField("comments", e.target.value)} />
            </div>

            <div className={`${controlRounded} border border-border p-4 space-y-4`}>
              <h3 className="text-sm font-medium">Display metadata</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label>Display name override</Label>
                  <Input value={form.displayMetadata?.displayName ?? ""} disabled={disabled} placeholder="Display name"
                    onChange={(e) => updateField("displayMetadata", { ...form.displayMetadata, displayName: e.target.value || undefined })} />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox checked={!!form.displayMetadata?.excludeFromResults} disabled={disabled}
                    onCheckedChange={(v) => updateField("displayMetadata", { ...form.displayMetadata, excludeFromResults: !!v })} />
                  <Label className="mb-0">Exclude from results</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox checked={!!form.displayMetadata?.visibleByDefault} disabled={disabled}
                    onCheckedChange={(v) => updateField("displayMetadata", { ...form.displayMetadata, visibleByDefault: !!v })} />
                  <Label className="mb-0">Visible by default</Label>
                </div>
              </div>
            </div>

            <div className={`${controlRounded} border border-border p-4 space-y-4`}>
              <h3 className="text-sm font-medium">Power BI metadata</h3>
              <div className="flex items-center gap-2">
                <Checkbox checked={!!form.powerBiMetadata?.dashboard} disabled={disabled}
                  onCheckedChange={(v) => updateField("powerBiMetadata", { ...form.powerBiMetadata, dashboard: !!v })} />
                <Label className="mb-0">Dashboard</Label>
              </div>
            </div>

            <div className={`${controlRounded} border border-border p-4 space-y-4`}>
              <h3 className="text-sm font-medium">Analysis metadata</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label>Type (Python)</Label>
                  <Select value={String(form.analysisMetadata?.type ?? "")} onValueChange={(v) => updateField("analysisMetadata", { ...form.analysisMetadata, type: v ?? undefined })} disabled={disabled}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {ANALYSIS_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Corresponding variable</Label>
                  <Input value={form.analysisMetadata?.correspondingVariable ?? ""} disabled={disabled} placeholder="Variable"
                    onChange={(e) => updateField("analysisMetadata", { ...form.analysisMetadata, correspondingVariable: e.target.value || undefined })} />
                </div>
                <div />
                <div className="flex items-center gap-2">
                  <Checkbox checked={!!form.analysisMetadata?.excludeFromOutput} disabled={disabled}
                    onCheckedChange={(v) => updateField("analysisMetadata", { ...form.analysisMetadata, excludeFromOutput: !!v })} />
                  <Label className="mb-0">Exclude from output</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox checked={!!form.analysisMetadata?.isNullable} disabled={disabled}
                    onCheckedChange={(v) => updateField("analysisMetadata", { ...form.analysisMetadata, isNullable: !!v })} />
                  <Label className="mb-0">Is nullable</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox checked={!!form.analysisMetadata?.isRequired} disabled={disabled}
                    onCheckedChange={(v) => updateField("analysisMetadata", { ...form.analysisMetadata, isRequired: !!v })} />
                  <Label className="mb-0">Is required</Label>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>GEE assets (one per line)</Label>
                <Textarea value={form.analysisMetadata?.geeAssets?.join("\n") ?? ""} disabled={disabled} placeholder="One asset ID per line"
                  onChange={(e) => updateField("analysisMetadata", { ...form.analysisMetadata, geeAssets: e.target.value ? e.target.value.split(/\r?\n/).map((s) => s.trim()).filter(Boolean) : undefined })} />
              </div>
            </div>

            {sortedCommodities.length > 0 && (
              <div className={`${controlRounded} border border-border p-4 space-y-4`}>
                <h3 className="text-sm font-medium">Commodity metadata</h3>
                <div className="space-y-3">
                  {sortedCommodities.map((c) => {
                    const meta = form.commodityMetadata?.[c.id] ?? {};
                    const label = c.description ? `${c.id} — ${c.description}` : c.id;
                    return (
                      <div key={c.id} className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-md bg-muted/30 p-3">
                        <div className="text-sm font-medium">{label}</div>
                        <div className="flex items-center gap-2">
                          <Checkbox checked={!!meta.usedForRisk} disabled={disabled}
                            onCheckedChange={(v) => updateCommodityMeta(c.id, { ...meta, usedForRisk: !!v })} />
                          <Label className="mb-0">Used for risk</Label>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <Label>Data theme</Label>
                          <Input value={meta.dataTheme ?? ""} disabled={disabled} placeholder="e.g. deforestation"
                            onChange={(e) => updateCommodityMeta(c.id, { ...meta, dataTheme: e.target.value || undefined })} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {(mode === "edit" || readonly) && (
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                <span>Created: {formatDate(form.createdAt)}{form.createdBy ? ` by ${form.createdBy}` : ""}</span>
                <span>Updated: {formatDate(form.updatedAt)}{form.updatedBy ? ` by ${form.updatedBy}` : ""}</span>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex gap-2">
            {readonly ? (
              <>
                {isAdmin && <Button onClick={() => setReadonly(false)}>Edit</Button>}
                <Button variant="secondary" onClick={reset}>Close</Button>
              </>
            ) : (
              <>
                <Button onClick={handleSave} disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
                <Button variant="secondary" onClick={reset} disabled={loading}>Cancel</Button>
              </>
            )}
          </CardFooter>
        </Card>
        </div>
      ) : (
        <CrudDataTable
          title="Result Fields"
          entityLabel="result field"
          columns={columns}
          data={fields}
          isAdmin={isAdmin}
          searchFields={["id", "category", "description", "type"]}
          deleteAction={deleteResultField}
          onAfterDelete={afterDelete}
          onEdit={isAdmin ? (id) => openField(id, false) : undefined}
          onView={(id) => openField(id, true)}
          onCreate={isAdmin ? startCreate : undefined}
        />
      )}
    </div>
  );
}

export default ResultFieldsPage;
