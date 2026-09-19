"use client";

import { Suspense, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { verifyEmail } from "@/lib/auth/actions";
import { useSystemMessage } from "@/lib/shared/use-system-message";
import { CenteredShell } from "@/components/layout/page-section";
import { cardLayout } from "@/components/ui/styles";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";

function VerifyContent() {
  const t = useTranslations("VerifyEmail");
  const systemMessage = useSystemMessage();
  const params = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setStatus("error");
      setMessage(t("missingToken"));
      return;
    }
    verifyEmail(token).then((result) => {
      if (result.ok) {
        setStatus("success");
      } else {
        setStatus("error");
        setMessage(systemMessage(result.code, result.args));
      }
    });
  }, [params, t, systemMessage]);

  return (
    <Card className={cardLayout.sm}>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>
          {status === "loading" && t("verifying")}
          {status === "success" && t("verified")}
          {status === "error" && t("failed")}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        {status === "loading" && <Loader2 className="size-8 animate-spin text-text-muted" />}
        {status === "success" && <CheckCircle2 className="size-10 text-accent-green" />}
        {status === "error" && <XCircle className="size-10 text-risk-high" />}
        {message && <p className="text-sm text-text-muted text-center">{message}</p>}
        {status !== "loading" && (
          <Button nativeButton={false} render={<Link href="/login" />} className="w-full">
            {t("signIn")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <CenteredShell>
      <Suspense fallback={<Loader2 className="size-8 animate-spin text-text-muted" />}>
        <VerifyContent />
      </Suspense>
    </CenteredShell>
  );
}
