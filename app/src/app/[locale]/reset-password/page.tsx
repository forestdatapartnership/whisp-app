"use client";

import { Suspense, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { resetPassword } from "@/lib/auth/actions";
import { useSystemMessage } from "@/lib/shared/use-system-message";
import { isValidPassword, getPasswordErrors, PASSWORD_RULES } from "@/lib/shared/field-validation";
import { CenteredShell } from "@/components/layout/page-section";
import { cardLayout } from "@/components/ui/styles";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { Alert } from "@/components/ui/alert";

function ResetContent() {
  const t = useTranslations("ResetPassword");
  const tPassword = useTranslations("Password");
  const systemMessage = useSystemMessage();
  const params = useSearchParams();
  const token = params.get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!token) {
      setError(t("invalidLink"));
      return;
    }
    if (!isValidPassword(password)) {
      const rule = getPasswordErrors(password)[0];
      setError(rule ? tPassword(`rules.${rule}`) : tPassword("invalid"));
      return;
    }
    if (password !== confirm) {
      setError(tPassword("mismatch"));
      return;
    }
    setLoading(true);
    const result = await resetPassword(token, password);
    if (result.ok) setSuccess(true);
    else setError(systemMessage(result.code, result.args));
    setLoading(false);
  };

  if (!token) {
    return (
      <Card className={cardLayout.sm}>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("invalidLink")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button nativeButton={false} render={<Link href="/forgot-password" />} className="w-full">
            {t("requestNew")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cardLayout.sm}>
      <CardHeader>
        <CardTitle>{t("setTitle")}</CardTitle>
        <CardDescription>
          {success ? t("updatedDescription") : t("description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {success ? (
          <Button nativeButton={false} render={<Link href="/login" />} className="w-full">
            {t("signIn")}
          </Button>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            {error && <Alert type="error" message={error} onClose={() => setError("")} />}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">{tPassword("new")}</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <ul className="text-[11px] text-text-muted space-y-0.5">
                {PASSWORD_RULES.map((r) => (
                  <li key={r.rule}>{tPassword(`rules.${r.rule}`)}</li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirm">{tPassword("confirm")}</Label>
              <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? tPassword("updating") : tPassword("update")}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <CenteredShell>
      <Suspense fallback={<Loader2 className="size-8 animate-spin text-text-muted" />}>
        <ResetContent />
      </Suspense>
    </CenteredShell>
  );
}
