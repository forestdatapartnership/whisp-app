import { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type AlertType = "error" | "success" | "warning";

const config: Record<AlertType, { icon: typeof XCircle; className: string }> = {
  error: {
    icon: XCircle,
    className: "border-destructive/40 bg-destructive/10 text-destructive",
  },
  success: {
    icon: CheckCircle2,
    className: "border-accent-green/40 bg-accent-green/10 text-accent-green",
  },
  warning: {
    icon: AlertTriangle,
    className: "border-amber-400/40 bg-amber-400/10 text-amber-600 dark:text-amber-400",
  },
};

interface AlertProps {
  type: AlertType;
  message: string | ReactNode;
  onClose?: () => void;
  className?: string;
}

export function Alert({ type, message, onClose, className }: AlertProps) {
  if (!message) return null;

  const { icon: Icon, className: typeClass } = config[type];

  return (
    <div className={cn("flex items-start gap-2 rounded-lg border px-3 py-2 text-sm", typeClass, className)}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span className="flex-1 text-left">{message}</span>
      {onClose && (
        <button onClick={onClose} aria-label="Dismiss" className="shrink-0 opacity-60 hover:opacity-100">
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
