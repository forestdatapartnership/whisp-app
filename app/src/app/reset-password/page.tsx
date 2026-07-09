"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { resetPassword } from "@/lib/auth/actions";
import { formatSystemMessage } from "@/types/system-codes";
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
      setError("Invalid or missing reset token.");
      return;
    }
    if (!isValidPassword(password)) {
      setError(getPasswordErrors(password)[0] ?? "Password does not meet requirements.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const result = await resetPassword(token, password);
    if (result.ok) setSuccess(true);
    else setError(formatSystemMessage(result.code, result.args));
    setLoading(false);
  };

  if (!token) {
    return (
      <Card className={cardLayout.sm}>
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
          <CardDescription>Invalid or missing reset link.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button nativeButton={false} render={<Link href="/forgot-password" />} className="w-full">
            Request a new link
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cardLayout.sm}>
      <CardHeader>
        <CardTitle>Set new password</CardTitle>
        <CardDescription>
          {success ? "Your password has been updated." : "Choose a strong new password."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {success ? (
          <Button nativeButton={false} render={<Link href="/login" />} className="w-full">
            Sign in
          </Button>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            {error && <Alert type="error" message={error} onClose={() => setError("")} />}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">New password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <ul className="text-[11px] text-text-muted space-y-0.5">
                {PASSWORD_RULES.map((r) => (
                  <li key={r.message}>{r.message}</li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Updating…" : "Update password"}
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
