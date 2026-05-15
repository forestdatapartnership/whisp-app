"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { Link } from "@/components/ui/link";
import { VersionLink } from "@/components/layout/version-link";

const docsLinks = [
  { href: "/docs/api", label: "API Reference" },
  { href: "/docs/fields", label: "Reference Fields" },
  { href: "/docs/commodities", label: "Commodities" },
];

const legalLinks = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Use" },
  { divider: true } as const,
  { href: "/license", label: "MIT License" },
];

function FooterDropdown({ label, items }: {
  label: string;
  items: readonly (
    | { href: string; label: string; divider?: undefined }
    | { divider: true; href?: undefined; label?: undefined }
  )[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  return (
    <div ref={ref} className="relative inline-flex items-center">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1 bg-transparent border-none cursor-pointer text-xs transition-colors hover:text-text-muted ${open ? "text-text-muted" : "text-inherit"}`}
      >
        {label}
        <ChevronDown className={`size-2.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 min-w-[180px] rounded-lg border border-border bg-surface-raised py-1.5 shadow-lg z-50 after:absolute after:-bottom-[5px] after:left-1/2 after:-translate-x-1/2 after:rotate-45 after:size-2 after:bg-surface-raised after:border-r after:border-b after:border-border">
          {items.map((item, i) =>
            item.divider ? (
              <hr key={i} className="my-1 border-t border-border" />
            ) : (
              <Link
                key={item.href}
                href={item.href}
                variant="subtle"
                className="block rounded-md px-3 py-1.5 text-[13px] hover:bg-white/[0.04] hover:text-text-primary"
              >
                {item.label}
              </Link>
            )
          )}
        </div>
      )}
    </div>
  );
}

const Sep = () => <span className="px-2 text-xs text-border select-none">·</span>;

export function Footer() {
  return (
    <footer className="flex flex-wrap items-center gap-y-1 border-t border-border px-8 py-4 text-xs text-text-dim">
      <span className="whitespace-nowrap pr-1">
        © 2026{" "}
        <Link href="https://openforis.org" variant="muted">
          Open Foris
        </Link>
      </span>
      <Sep />
      <Link href="/about" variant="muted" className="whitespace-nowrap">
        About
      </Link>
      <Sep />
      <FooterDropdown label="Docs" items={docsLinks} />
      <Sep />
      <FooterDropdown label="Legal" items={legalLinks} />
      <div className="ml-auto flex items-center">
        <VersionLink />
      </div>
    </footer>
  );
}
