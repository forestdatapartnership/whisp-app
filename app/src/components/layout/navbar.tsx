"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef, useState } from "react";
import { Moon, Sun, User, Settings, BriefcaseBusiness, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/layout/theme-provider";
import { useAuth } from "@/lib/auth/auth-context";

const ACCOUNT_LINKS = [
  { icon: Settings, href: "/account", label: "Account" },
  { icon: BriefcaseBusiness, href: "/account/jobs", label: "Analysis Jobs" },
];

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleMenuToggle = () => setOpen((v) => !v);

  const handleOutsideClick = (e: React.FocusEvent | React.MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(e.relatedTarget as Node)) {
      setOpen(false);
    }
  };

  return (
    <nav className="sticky top-0 z-[250] flex h-14 items-center gap-4 border-b border-border bg-bg px-8">
      <Link href="/" className="flex items-center gap-2.5 no-underline">
        <Image
          src={theme === "dark" ? "/whisp_logo_2_white.svg" : "/whisp_logo_2.svg"}
          alt="Whisp"
          width={60}
          height={60}
        />
      </Link>

      <div className="flex-1" />

      <Button
        variant="ghost"
        size="icon"
        nativeButton={false}
        render={
          <a href="https://github.com/openforis/whisp" target="_blank" rel="noopener noreferrer" aria-label="GitHub" />
        }
      >
        <svg className="size-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/></svg>
      </Button>

      <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
        {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </Button>

      {isAuthenticated ? (
        <div className="relative" ref={menuRef} onBlur={handleOutsideClick}>
          <button
            onClick={handleMenuToggle}
            aria-expanded={open}
            aria-haspopup="menu"
            aria-label="User menu"
            className="flex size-8 items-center justify-center rounded-full border border-border bg-surface-raised text-text-primary hover:border-accent-green transition-colors"
          >
            <User className="size-4" aria-hidden />
          </button>

          {open && (
            <div
              role="menu"
              className="absolute right-0 top-[calc(100%+8px)] z-[250] min-w-44 rounded-lg border border-border bg-surface py-1 shadow-md"
            >
              {user?.email && (
                <p className="truncate border-b border-border px-4 py-2 text-xs text-text-muted">
                  {user.email}
                </p>
              )}

              {ACCOUNT_LINKS.map(({ icon: Icon, href, label }) => (
                <Link
                  key={href}
                  href={href}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-text-muted hover:bg-surface-raised hover:text-text-primary transition-colors"
                >
                  <Icon className="size-3.5" aria-hidden />
                  {label}
                </Link>
              ))}

              <button
                role="menuitem"
                onClick={() => { logout(); setOpen(false); }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-text-muted hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <LogOut className="size-3.5" aria-hidden />
                Log out
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex shrink-0 overflow-hidden rounded-lg border border-border">
          <Button variant="ghost" size="sm" className="rounded-none border-0" nativeButton={false} render={<Link href="/login" />}>
            Sign in
          </Button>
          <Button variant="ghost" size="sm" className="rounded-none border-0 border-l border-border hover:text-accent-green" nativeButton={false} render={<Link href="/register" />}>
            Register
          </Button>
        </div>
      )}
    </nav>
  );
}
