"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { getPathname } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPassword } from "@/lib/auth/actions";
import { ssoLoginUrl } from "@/lib/auth/sso-login-url";
import { useSystemMessage } from "@/lib/shared/use-system-message";
import { SystemCode } from "@/types/system-codes";
import { Alert } from "@/components/ui/alert";
import { CenteredShell } from "@/components/layout/page-section";
import { cardLayout } from "@/components/ui/styles";

export default function ForgotPasswordPage() {
  const t = useTranslations("ForgotPassword");
  const locale = useLocale();
  const systemMessage = useSystemMessage();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    const result = await forgotPassword(email);
    if (result.ok) {
      setSuccess(true);
    } else {
      setError(systemMessage(result.code, result.args));
      if (result.code === SystemCode.AUTH_SSO_REQUIRED) {
        window.location.assign(ssoLoginUrl(getPathname({ href: "/", locale }), email));
        return;
      }
    }
    setIsLoading(false);
  };

  return (
    <CenteredShell>
    <Card className={cardLayout.sm}>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>
          {success ? t("sentDescription") : t("description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {success ? (
          <div className="flex flex-col gap-4">
            <Alert type="success" message={t("sentHint")} />
            <Button nativeButton={false} render={<Link href="/login" />} className="w-full">
              {t("backToSignIn")}
            </Button>
          </div>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            {error && <Alert type="error" message={error} onClose={() => setError("")} />}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@organisation.org"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t("submitting") : t("submit")}
            </Button>
            <Link href="/login" variant="subtle" className="text-center text-xs">
              {t("backToSignIn")}
            </Link>
          </form>
        )}
      </CardContent>
    </Card>
    </CenteredShell>
  );
}
