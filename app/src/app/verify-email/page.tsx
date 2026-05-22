"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { verifyEmail } from "@/lib/auth/actions";
import { formatSystemMessage } from "@/types/system-codes";
import { CenteredShell } from "@/components/layout/page-section";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";

function VerifyContent() {
  const params = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setStatus("error");
      setMessage("Verification token is missing.");
      return;
    }
    verifyEmail(token).then((result) => {
      if (result.ok) {
        setStatus("success");
        setMessage(result.data);
      } else {
        setStatus("error");
        setMessage(formatSystemMessage(result.code, result.args));
      }
    });
  }, [params]);

  return (
    <Card className="w-full max-w-[400px]">
      <CardHeader>
        <CardTitle>Email verification</CardTitle>
        <CardDescription>
          {status === "loading" && "Verifying your email address…"}
          {status === "success" && "Your email has been verified."}
          {status === "error" && "Verification could not be completed."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        {status === "loading" && <Loader2 className="size-8 animate-spin text-text-muted" />}
        {status === "success" && <CheckCircle2 className="size-10 text-accent-green" />}
        {status === "error" && <XCircle className="size-10 text-red-400" />}
        {message && <p className="text-sm text-text-muted text-center">{message}</p>}
        {status !== "loading" && (
          <Button nativeButton={false} render={<Link href="/login" />} className="w-full">
            Sign in
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
