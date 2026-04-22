"use client";

import { useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { verifyPaidSignupOtpAction } from "@/modules/auth/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = useMemo(() => searchParams.get("email") || "", [searchParams]);
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    try {
      const result = await verifyPaidSignupOtpAction({ email, code });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(result.success || "Email verified.");
      router.push(result.next || "/auth/signin");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-bold text-white">Verify Your Email</CardTitle>
        <CardDescription>Enter the 6-digit code before continuing to onboarding.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white/70">Email</Label>
            <Input id="email" value={email} onChange={(event) => setEmail(event.target.value)} className="bg-black/20 border-white/10 text-white" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="code" className="text-white/70">OTP Code</Label>
            <Input id="code" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} className="bg-black/20 border-white/10 text-white tracking-[0.4em] text-center" inputMode="numeric" minLength={6} maxLength={6} required />
          </div>
          <Button className="w-full" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
            Verify and Continue
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-3 border-t border-white/5 text-center text-sm text-muted-foreground">
        <p className="flex items-center gap-2 pt-4"><AlertCircle className="h-4 w-4" /> OTPs expire in 10 minutes.</p>
        <Link href="/auth/signup" className="text-primary hover:underline">Start signup again</Link>
      </CardFooter>
    </Card>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={null}>
      <VerifyOtpContent />
    </Suspense>
  );
}
