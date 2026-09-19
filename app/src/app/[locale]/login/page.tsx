"use client";

import { Suspense, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { getPathname, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
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
  const t = useTranslations("Login");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const params = useSearchParams();
  const router = useRouter();
  const requestedPath = params.get("next");
  const nextPath = requestedPath?.startsWith("/") ? requestedPath : "/";
  const localizedNextPath = getPathname({ href: nextPath, locale });
  const { login, error, clearError, isAuthenticated, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace(nextPath);
    }
  }, [isAuthenticated, authLoading, nextPath, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setIsLoading(true);
    const result = await login(email, password);
    if (result.ok) {
      router.replace(nextPath);
      return;
    }
    if (result.code === SystemCode.AUTH_SSO_REQUIRED) {
      window.location.assign(ssoLoginUrl(localizedNextPath, email));
      return;
    }
    setIsLoading(false);
  };

  return (
    <Card className={cardLayout.sm}>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        {error && <Alert type="error" message={error} onClose={clearError} className="mb-4" />}
        <Button
          type="button"
          variant="outline"
          className="w-full mb-4"
          onClick={() => window.location.assign(ssoLoginUrl(localizedNextPath))}
        >
          {t("sso")}
        </Button>
        <div className="flex items-center gap-3 mb-4 text-[11px] uppercase text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          {tCommon("or")}
          <span className="h-px flex-1 bg-border" />
        </div>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">{t("email")}</Label>
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
            <Label htmlFor="password">{t("password")}</Label>
            <Input
              id="password"
              type="password"
              placeholder={t("passwordPlaceholder")}
              autoComplete="current-password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); if (error) clearError(); }}
              required
            />
          </div>
          <div className="flex justify-end -mt-1">
            <Link href="/forgot-password" variant="subtle" className="text-xs">
              {t("forgot")}
            </Link>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? t("submitting") : t("submit")}
          </Button>
        </form>
        <p className="mt-5 text-center text-[13px] text-muted-foreground">
          {t.rich("noAccount", { link: (chunks) => <Link href="/auth/sso/register" unlocalized>{chunks}</Link> })}
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
