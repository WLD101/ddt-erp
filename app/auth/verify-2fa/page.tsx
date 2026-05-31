"use client";

import React, { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, ShieldCheck, Smartphone } from "lucide-react";
import { toast } from "sonner";

import { completeTwoFactorSignInAction } from "@/modules/security/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function VerifyTwoFactorForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [verificationCode, setVerificationCode] = useState("");
  const [rememberDevice, setRememberDevice] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      toast.error("This security verification link is invalid. Please sign in again.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await completeTwoFactorSignInAction({
        challengeToken: token,
        verificationCode,
        rememberDevice,
      });
      if (result?.error) {
        toast.error(result.error);
      }
    } catch (error: any) {
      if (error && (error.message === "NEXT_REDIRECT" || error.digest?.includes("NEXT_REDIRECT"))) {
        throw error;
      }
      toast.error("We couldn't complete the security challenge. Please sign in again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="glass-card border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] rounded-[32px] overflow-hidden">
      <CardHeader className="space-y-2 text-center pt-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
          <ShieldCheck className="h-6 w-6 text-emerald-400" />
        </div>
        <CardTitle className="text-3xl font-extrabold tracking-tight text-white">Verify your sign-in</CardTitle>
        <CardDescription className="text-sm font-medium text-slate-400">
          Enter the 6-digit code from your authenticator app or a backup recovery code.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="verificationCode" className="text-sm font-semibold text-slate-300">
              Verification code
            </Label>
            <div className="relative">
              <Smartphone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
              <Input
                id="verificationCode"
                value={verificationCode}
                onChange={(event) => setVerificationCode(event.target.value)}
                placeholder="123456 or REC-OVER-Y123"
                className="h-12 rounded-xl border-white/10 bg-white/5 pl-11 text-white placeholder:text-slate-600"
                disabled={isLoading}
                autoFocus
              />
            </div>
          </div>

          <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <Checkbox
              checked={rememberDevice}
              onCheckedChange={(value) => setRememberDevice(Boolean(value))}
              disabled={isLoading}
              className="mt-0.5"
            />
            <span className="text-sm font-medium text-slate-300">
              Trust this device for 30 days so I don&apos;t need a code every time.
            </span>
          </label>

          <Button
            type="submit"
            disabled={isLoading}
            className="h-12 w-full rounded-xl bg-emerald-600 font-bold text-white shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:bg-emerald-500"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Verifying...
              </>
            ) : (
              "Complete Secure Sign-In"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="border-t border-white/5 bg-black/20 pb-8 pt-6">
        <p className="text-center text-xs font-medium text-slate-500">
          Recovery codes are one-time use. If you can&apos;t access your authenticator, contact your workspace owner.
        </p>
      </CardFooter>
    </Card>
  );
}

export default function VerifyTwoFactorPage() {
  return (
    <Suspense
      fallback={
        <Card className="glass-card flex w-full items-center justify-center rounded-[32px] border-white/10 py-24 shadow-2xl">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
        </Card>
      }
    >
      <VerifyTwoFactorForm />
    </Suspense>
  );
}
