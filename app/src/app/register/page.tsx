"use client";

import { useState } from "react";
import { Link } from "@/components/ui/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function getStrength(pw: string): "weak" | "fair" | "strong" | null {
  if (!pw) return null;
  if (pw.length < 8) return "weak";
  if (/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(pw)) return "strong";
  return "fair";
}

const barColor = {
  weak: "bg-[#e05a5a]",
  fair: "bg-[#e09a1a]",
  strong: "bg-accent-green",
} as const;

const strengthLabel = { weak: "Weak", fair: "Fair", strong: "Strong" } as const;

export default function RegisterPage() {
  const [password, setPassword] = useState("");
  const strength = getStrength(password);

  return (
    <Card className="w-full max-w-[400px]">
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>Free access to forest risk assessments via the Whisp API.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" action="">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@organisation.org" autoComplete="email" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Min. 8 characters"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="flex gap-1 mt-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`h-[3px] flex-1 rounded-sm transition-colors ${
                    strength && i <= ["weak", "fair", "strong"].indexOf(strength)
                      ? barColor[strength]
                      : "bg-border"
                  }`}
                />
              ))}
            </div>
            {strength && (
              <span className="text-[11px] text-muted-foreground">{strengthLabel[strength]}</span>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirm-password">Confirm password</Label>
            <Input id="confirm-password" type="password" placeholder="Repeat password" autoComplete="new-password" />
          </div>
          <Button type="submit" className="w-full">Create account</Button>
        </form>
        <p className="mt-5 text-center text-[13px] text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
