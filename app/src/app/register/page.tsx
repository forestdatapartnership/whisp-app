"use client";

import { useState } from "react";
import { registerUser } from "@/lib/auth/actions";
import { formatSystemMessage } from "@/types/system-codes";
import { isValidPassword, getPasswordErrors, PASSWORD_RULES } from "@/lib/shared/field-validation";
import { validateEmailFormat } from "@/lib/shared/email-format";
import { CenteredShell } from "@/components/layout/page-section";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { Alert } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [organization, setOrganization] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [terms, setTerms] = useState(false);
  const [subscribe, setSubscribe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validateEmailFormat(email)) {
      setError("Please enter a valid email address.");
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
    if (!terms) {
      setError("You must agree to the Terms of Use.");
      return;
    }
    setLoading(true);
    const result = await registerUser({
      name,
      lastName,
      organization: organization || null,
      email,
      password,
      subscribeNotifications: subscribe,
    });
    if (result.ok) setSuccess(true);
    else setError(formatSystemMessage(result.code, result.args));
    setLoading(false);
  };

  if (success) {
    return (
      <CenteredShell>
        <Card className="w-full max-w-[400px]">
          <CardHeader>
            <CardTitle>Check your email</CardTitle>
            <CardDescription>
              If your address is eligible, you will receive a verification link shortly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button nativeButton={false} render={<Link href="/login" />} className="w-full">
              Back to sign in
            </Button>
          </CardContent>
        </Card>
      </CenteredShell>
    );
  }

  return (
    <CenteredShell>
      <Card className="w-full max-w-[400px]">
        <CardHeader>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>Free access to forest risk assessments via the Whisp API.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            {error && <Alert type="error" message={error} onClose={() => setError("")} />}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">First name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="org">Organization</Label>
              <Input id="org" value={organization} onChange={(e) => setOrganization(e.target.value)} placeholder="Optional" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            </div>
            <label className="flex items-start gap-2 text-[13px] text-text-muted cursor-pointer">
              <Checkbox checked={terms} onCheckedChange={(v) => setTerms(!!v)} className="mt-0.5" />
              <span>
                I agree to the{" "}
                <Link href="/legal/terms-of-service" target="_blank">Terms of Use</Link> and{" "}
                <Link href="/legal/privacy-policy" target="_blank">Privacy Policy</Link>
              </span>
            </label>
            <label className="flex items-start gap-2 text-[13px] text-text-muted cursor-pointer">
              <Checkbox checked={subscribe} onCheckedChange={(v) => setSubscribe(!!v)} className="mt-0.5" />
              <span>Subscribe to service notifications (optional)</span>
            </label>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating…" : "Create account"}
            </Button>
          </form>
          <p className="mt-5 text-center text-[13px] text-text-muted">
            Already have an account? <Link href="/login">Sign in</Link>
          </p>
        </CardContent>
      </Card>
    </CenteredShell>
  );
}
