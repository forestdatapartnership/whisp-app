"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

type FieldKind = "text" | "number" | "textarea" | "select" | "checkbox";

interface FieldProps {
  label: string;
  kind?: FieldKind;
  value?: string | number | boolean;
  placeholder?: string;
  disabled?: boolean;
  options?: string[];
  onChange: (value: string | number | boolean) => void;
  className?: string;
}

export function Field({
  label,
  kind = "text",
  value,
  placeholder,
  disabled,
  options,
  onChange,
  className,
}: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label>{label}</Label>
      {kind === "textarea" ? (
        <Textarea
          value={String(value ?? "")}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : kind === "select" && options ? (
        <Select
          value={String(value ?? "")}
          onValueChange={(v) => onChange(v ?? "")}
        >
          <SelectTrigger disabled={disabled}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : kind === "checkbox" ? (
        <Checkbox
          checked={!!value}
          onCheckedChange={(v) => onChange(!!v)}
          disabled={disabled}
        />
      ) : (
        <Input
          type={kind === "number" ? "number" : "text"}
          value={String(value ?? "")}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) =>
            onChange(kind === "number" ? Number(e.target.value) : e.target.value)
          }
        />
      )}
    </div>
  );
}
