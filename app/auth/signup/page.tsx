// app/auth/signup/page.tsx
"use client";

import React, { useState, Suspense, useRef } from "react";
import Link from "next/link";
import Script from "next/script";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Mail, Lock, Building, Loader2, AlertCircle, CheckCircle2, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";
import { signUpAction } from "@/modules/auth/actions";

const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(5, "Phone number is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  organizationName: z.string().min(2, "Organization name must be at least 2 characters"),
  city: z.string().min(2, "City is required"),
  country: z.string().min(2, "Country is required"),
  referralCode: z.string().optional(),
  industry: z.string().optional(),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
  });

  React.useEffect(() => {
    const savedRef = localStorage.getItem("whatsquery_ref_code");
    if (savedRef) {
      setValue("referralCode", savedRef);
    }

    const industryParam = searchParams.get("industry");
    if (industryParam) {
      setValue("industry", industryParam);
    }

    const handleTurnstile = (e: any) => setTurnstileToken(e.detail);
    window.addEventListener('turnstile-token', handleTurnstile);
    return () => window.removeEventListener('turnstile-token', handleTurnstile);
  }, [setValue, searchParams]);

  const onSubmit = async (data: SignUpFormValues) => {
    if (!turnstileToken) {
      toast.error("Please complete the security check.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await signUpAction({ ...data, turnstileToken });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Verification code sent to your email.");
        setIsSuccess(true);
        setTimeout(() => {
          router.push(result.next || `/auth/verify-otp?email=${encodeURIComponent(data.email)}`);
        }, 1500);
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <Card className="glass-card border-green-500/20 bg-green-500/5 text-center py-16 px-6 animate-in fade-in zoom-in duration-500 rounded-[32px]">
        <div className="mx-auto bg-green-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border border-green-500/20 shadow-sm">
          <CheckCircle2 className="w-8 h-8 text-green-400" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-white mb-2">Check Your Email</CardTitle>
        <CardDescription className="text-slate-300 text-sm">
          Enter the OTP to unlock onboarding.<br />
          Redirecting to verification...
        </CardDescription>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-bottom-4 duration-700 overflow-hidden relative rounded-[32px] w-full md:max-w-lg">
      <CardHeader className="space-y-1 text-center pt-10">
        <div className="mx-auto bg-indigo-500/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-4 border border-indigo-500/20 shadow-sm">
          <UserPlus className="w-6 h-6 text-indigo-400" />
        </div>
        <CardTitle className="text-3xl font-extrabold tracking-tight text-white">Create Account</CardTitle>
        <CardDescription className="text-slate-400 text-sm">
          Bootstrap your workspace in seconds
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 group">
              <Label htmlFor="name" className="text-sm font-semibold text-slate-300">Full Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                className="h-11 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:ring-indigo-500/20 focus:border-indigo-500/50 hover:bg-white/10 rounded-xl transition-all"
                {...register("name")}
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-[10px] text-red-400 mt-1 animate-in slide-in-from-left-2">{errors.name.message}</p>
              )}
            </div>
            
            <div className="space-y-2 group">
              <Label htmlFor="organizationName" className="text-sm font-semibold text-slate-300">Company</Label>
              <div className="relative">
                <Building className="absolute left-3.5 top-3.5 h-3.5 w-3.5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <Input
                  id="organizationName"
                  placeholder="Acme Corp"
                  className="pl-9 h-11 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:ring-indigo-500/20 focus:border-indigo-500/50 hover:bg-white/10 rounded-xl transition-all"
                  {...register("organizationName")}
                  disabled={isLoading}
                />
              </div>
              {errors.organizationName && (
                <p className="text-[10px] text-red-400 mt-1 animate-in slide-in-from-left-2">{errors.organizationName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2 group">
            <Label htmlFor="email" className="text-sm font-semibold text-slate-300">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
              <Input
                id="email"
                placeholder="name@company.com"
                type="email"
                className="pl-11 h-11 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:ring-indigo-500/20 focus:border-indigo-500/50 hover:bg-white/10 rounded-xl transition-all"
                {...register("email")}
                disabled={isLoading}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-400 flex items-center mt-1 animate-in slide-in-from-left-2">
                <AlertCircle className="w-3 h-3 mr-1" /> {errors.email.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5 group md:col-span-1">
              <Label htmlFor="phone" className="text-xs font-semibold text-slate-300">Phone</Label>
              <Input
                id="phone"
                placeholder="+1..."
                className="h-11 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:ring-indigo-500/20 hover:bg-white/10 rounded-xl text-sm"
                {...register("phone")}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-1.5 group">
              <Label htmlFor="city" className="text-xs font-semibold text-slate-300">City</Label>
              <Input
                id="city"
                placeholder="New York"
                className="h-11 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:ring-indigo-500/20 hover:bg-white/10 rounded-xl text-sm"
                {...register("city")}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-1.5 group">
              <Label htmlFor="country" className="text-xs font-semibold text-slate-300">Country</Label>
              <Input
                id="country"
                placeholder="US"
                className="h-11 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:ring-indigo-500/20 hover:bg-white/10 rounded-xl text-sm"
                {...register("country")}
                disabled={isLoading}
              />
            </div>
          </div>
          
          <div className="space-y-2 group">
            <Label htmlFor="password" className="text-sm font-semibold text-slate-300">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="pl-11 h-11 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:ring-indigo-500/20 focus:border-indigo-500/50 hover:bg-white/10 rounded-xl transition-all"
                {...register("password")}
                disabled={isLoading}
              />
            </div>
            {errors.password && (
              <p className="text-xs text-red-400 flex items-center mt-1 animate-in slide-in-from-left-2">
                <AlertCircle className="w-3 h-3 mr-1" /> {errors.password.message}
              </p>
            )}
          </div>

          <input type="hidden" {...register("industry")} />

          <div className="flex justify-center my-4">
            <div 
              className="cf-turnstile" 
              data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA"}
              data-theme="dark"
              data-callback="onTurnstileSuccess"
            />
          </div>

          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js"
            strategy="afterInteractive"
          />

          <script dangerouslySetInnerHTML={{
            __html: `
              function onTurnstileSuccess(token) {
                window.dispatchEvent(new CustomEvent('turnstile-token', { detail: token }));
              }
            `
          }} />

          <Button 
            className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(99,102,241,0.3)] mt-2 active:scale-[0.98] border-t border-indigo-400/20" 
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Provisioning...
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4 text-center border-t border-white/5 pt-6 pb-8 bg-black/20">
        <p className="text-sm font-medium text-slate-400">
          Already have an account?{" "}
          <Link href="/auth/signin" className="text-indigo-400 hover:text-indigo-300 font-bold transition">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <SignUpForm />
    </Suspense>
  );
}
