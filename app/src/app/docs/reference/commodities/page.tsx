"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import {
  getCommodities,
  createCommodity,
  updateCommodity,
  deleteCommodity,
} from "./actions";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { CrudDataTable } from "@/components/crud/data-table";
import { formatSystemMessage } from "@/types/system-codes";
import type { Commodity } from "@/types/models";

type Mode = "list" | "edit" | "create";
type MessageType = { type: "success" | "error"; text: string } | null;

function CommoditiesPage() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [mode, setMode] = useState<Mode>("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Commodity>>({});
  const [message, setMessage] = useState<MessageType>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const result = await getCommodities();
    if (result.ok) setCommodities(result.data);
    else setMessage({ type: "error", text: formatSystemMessage(result.code, result.args) });
  }, []);

  useEffect(() => { load(); }, [load]);

  const reset = useCallback(() => {
    setMode("list");
    setEditingId(null);
    setForm({});
  }, []);

  const startEdit = useCallback((id: string) => {
    const c = commodities.find((x) => x.id === id);
    if (c) { setMode("edit"); setEditingId(id); setForm(c); setMessage(null); }
  }, [commodities]);

  const startCreate = useCallback(() => {
    setMode("create"); setForm({}); setMessage(null);
  }, []);

  const updateField = useCallback((key: keyof Commodity, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    setLoading(true); setMessage(null);
    try {
      if (mode === "create" && !form.id) throw new Error("Code is required");
      const payload: Omit<Commodity, "createdAt" | "createdBy" | "updatedAt" | "updatedBy"> = {
        id: form.id!,
        description: form.description ?? undefined,
      };
      if (mode === "create") {
        const res = await createCommodity(payload);
        if (!res.ok) throw new Error(formatSystemMessage(res.code, res.args));
        setMessage({ type: "success", text: "Commodity created" });
      } else {
        const res = await updateCommodity(editingId!, { description: payload.description });
        if (!res.ok) throw new Error(formatSystemMessage(res.code, res.args));
        setMessage({ type: "success", text: "Commodity updated" });
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

  const columns = [
    { key: "id" as const, header: "Code" },
    { key: "description" as const, header: "Description" },
  ];

  return (
    <div className="flex flex-col gap-4 w-full max-w-[960px]">
      <h1 className="text-xl font-semibold">Commodities</h1>
      {message && <Alert type={message.type} message={message.text} onClose={() => setMessage(null)} />}

      {isAdmin && mode !== "list" ? (
        <Card>
          <CardHeader>
            <CardTitle>{mode === "create" ? "New Commodity" : `Edit ${editingId}`}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <Label>Code</Label>
              <Input value={form.id ?? ""} disabled={mode === "edit"} placeholder="e.g. pcrop"
                onChange={(e) => updateField("id", e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Description</Label>
              <Input value={form.description ?? ""} placeholder="Description"
                onChange={(e) => updateField("description", e.target.value)} />
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button onClick={handleSave} disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
            <Button variant="secondary" onClick={reset} disabled={loading}>Cancel</Button>
          </CardFooter>
        </Card>
      ) : (
        <CrudDataTable
          entityLabel="commodity"
          columns={columns}
          data={commodities}
          isAdmin={isAdmin}
          searchFields={["id", "description"]}
          deleteAction={deleteCommodity}
          onAfterDelete={afterDelete}
          onEdit={isAdmin ? startEdit : undefined}
          onCreate={isAdmin ? startCreate : undefined}
        />
      )}
    </div>
  );
}

export default CommoditiesPage;
