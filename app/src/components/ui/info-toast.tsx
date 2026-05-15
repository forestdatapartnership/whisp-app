"use client";

import { useEffect, useState, ReactNode } from "react";
import { Info, X } from "lucide-react";

interface InfoToastProps {
  storageKey: string;
  title: string;
  children: ReactNode;
}

export function InfoToast({ storageKey, title, children }: InfoToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(storageKey)) {
      setVisible(true);
    }
  }, [storageKey]);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(storageKey, "1");
  };

  return (
    <div
      className={`fixed bottom-20 right-6 z-50 w-[340px] rounded-xl border border-accent-green-dim bg-toast-bg px-4 py-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="flex gap-3">
        <Info className="mt-0.5 size-4 shrink-0 text-accent-green" aria-hidden />
        <div className="flex-1 min-w-0">
          <p className="mb-1 text-[13px] font-semibold text-text-primary">{title}</p>
          <div className="text-[12px] leading-relaxed text-text-muted">{children}</div>
        </div>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="shrink-0 self-start text-text-muted opacity-60 hover:opacity-100 transition-opacity"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
