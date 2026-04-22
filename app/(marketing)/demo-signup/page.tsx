"use client";

import { useState } from "react";
import { Loader2, MailCheck, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { requestDemoOtpAction, verifyDemoOtpAction } from "@/modules/leads/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function DemoSignupPage() {
  const [step, setStep] = useState<"details" | "otp" | "done">("details");
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    organizationName: "",
    city: "",
    country: "",
  });
  const [code, setCode] = useState("");

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function requestOtp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    try {
      const result = await requestDemoOtpAction(form);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("OTP sent. Check your email.");
      setStep("otp");
    } finally {
      setIsLoading(false);
    }
  }

  async function verifyOtp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    try {
      const result = await verifyDemoOtpAction({ email: form.email, code });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Demo request verified.");
      setStep("done");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen px-6 py-24 text-white">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_440px] lg:items-start">
        <section className="space-y-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary">
            <PlayCircle className="h-3.5 w-3.5" /> Secure 7-day ERP demo
          </div>
          <h1 className="max-w-3xl text-5xl font-black uppercase italic leading-none tracking-tighter md:text-7xl">
            Verify first. Explore after approval.
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
            Submit your organization details, verify your email with OTP, then our platform admin can approve a protected demo workspace.
          </p>
        </section>

        <section className="rounded-lg border border-white/10 bg-black/50 p-6 shadow-2xl">
          {step === "details" ? (
            <form onSubmit={requestOtp} className="space-y-4">
              <h2 className="text-xl font-black uppercase tracking-tight">Demo registration</h2>
              {(["name", "email", "phone", "organizationName", "city", "country"] as const).map((field) => (
                <div className="space-y-2" key={field}>
                  <Label htmlFor={field} className="text-white/70">
                    {field === "organizationName" ? "Organization name" : field.replace(/^\w/, (char) => char.toUpperCase())}
                  </Label>
                  <Input
                    id={field}
                    value={form[field]}
                    onChange={(event) => update(field, event.target.value)}
                    type={field === "email" ? "email" : "text"}
                    className="border-white/10 bg-black/30 text-white"
                    required
                  />
                </div>
              ))}
              <Button className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MailCheck className="mr-2 h-4 w-4" />}
                Send OTP
              </Button>
            </form>
          ) : step === "otp" ? (
            <form onSubmit={verifyOtp} className="space-y-5">
              <h2 className="text-xl font-black uppercase tracking-tight">Email OTP</h2>
              <p className="text-sm text-muted-foreground">We sent a 6-digit code to {form.email}. It expires in 10 minutes.</p>
              <Input
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                minLength={6}
                maxLength={6}
                className="border-white/10 bg-black/30 text-center text-xl tracking-[0.5em] text-white"
                required
              />
              <Button className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Verify Demo Request
              </Button>
            </form>
          ) : (
            <div className="space-y-4 py-8 text-center">
              <MailCheck className="mx-auto h-12 w-12 text-emerald-400" />
              <h2 className="text-2xl font-black uppercase tracking-tight">Verified pending approval</h2>
              <p className="text-sm text-muted-foreground">Your data is saved. A platform admin can now approve or reject the demo workspace.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
