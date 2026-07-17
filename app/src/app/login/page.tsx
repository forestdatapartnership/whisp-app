"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Link, linkVariants } from "@/components/ui/link";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth/auth-context";
import { Alert } from "@/components/ui/alert";
import { CenteredShell } from "@/components/layout/page-section";
import { cardLayout } from "@/components/ui/styles";
import { SystemCode } from "@/types/system-codes";

function ssoLoginUrl(next: string, loginHint?: string) {
  const url = new URL("/auth/sso/login", window.location.origin);
  url.searchParams.set("next", next.startsWith("/") ? next : "/");
  if (loginHint) url.searchParams.set("login_hint", loginHint);
  return url.toString();
}

function LoginForm() {
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const { login, error, clearError, isAuthenticated, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      window.location.assign(next.startsWith("/") ? next : "/");
    }
  }, [isAuthenticated, authLoading, next]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setIsLoading(true);
    const result = await login(email, password);
    if (result.ok) {
      window.location.assign(next.startsWith("/") ? next : "/");
      return;
    }
    if (result.code === SystemCode.AUTH_SSO_REQUIRED) {
      window.location.assign(ssoLoginUrl(next, email));
      return;
    }
    setIsLoading(false);
  };

  return (
    <Card className={cardLayout.sm}>
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Sign in to access your API key and run history.</CardDescription>
      </CardHeader>
      <CardContent>
        {error && <Alert type="error" message={error} onClose={clearError} className="mb-4" />}
        <Button
          type="button"
          variant="outline"
          className="w-full mb-4"
          onClick={() => window.location.assign(ssoLoginUrl(next))}
        >
          Sign in with SSO
        </Button>
        <div className="flex items-center gap-3 mb-4 text-[11px] uppercase text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          or
          <span className="h-px flex-1 bg-border" />
        </div>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@organisation.org"
              autoComplete="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (error) clearError(); }}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Your password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); if (error) clearError(); }}
              required
            />
          </div>
          <div className="flex justify-end -mt-1">
            <Link href="/forgot-password" variant="subtle" className="text-xs">
              Forgot password?
            </Link>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        <p className="mt-5 text-center text-[13px] text-muted-foreground">
          No account yet? <a href="/auth/sso/register" className={cn("transition-colors", linkVariants.accent)}>Register free</a>
        </p>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <CenteredShell>
      <Suspense>
        <LoginForm />
      </Suspense>
    </CenteredShell>
  );
}
