"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth/auth-context";
import { Alert } from "@/components/ui/alert";
import { CenteredShell } from "@/components/layout/page-section";

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
    const ok = await login(email, password);
    if (ok) window.location.assign(next.startsWith("/") ? next : "/");
    setIsLoading(false);
  };

  return (
    <Card className="w-full max-w-[400px]">
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Sign in to access your API key and run history.</CardDescription>
      </CardHeader>
      <CardContent>
        {error && <Alert type="error" message={error} onClose={clearError} className="mb-4" />}
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
          No account yet? <Link href="/register">Register free</Link>
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
