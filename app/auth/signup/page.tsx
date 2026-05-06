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
      <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl text-center py-12 px-6 animate-in fade-in zoom-in duration-500">
        <div className="mx-auto bg-green-500/20 w-16 h-16 rounded-full flex items-center justify-center mb-6 ring-2 ring-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-white mb-2">Check Your Email</CardTitle>
        <CardDescription className="text-muted-foreground text-lg">
          Enter the OTP to unlock onboarding.<br />
          Redirecting you to verification...
        </CardDescription>
      </Card>
    );
  }

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto bg-primary/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4 ring-1 ring-primary/30 shadow-[0_0_20px_rgba(var(--primary),0.2)]">
          <UserPlus className="w-6 h-6 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-white">Create your WhatsQuery account</CardTitle>
        <CardDescription className="text-muted-foreground/80">
          Start your workspace and continue to guided setup
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 group">
              <Label htmlFor="name" className="text-sm font-medium text-white/70 group-focus-within:text-primary transition-colors">Full Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                className="bg-black/20 border-white/10 text-white placeholder:text-white/20 focus:ring-primary/50 transition-all hover:bg-black/30"
                {...register("name")}
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-[10px] text-red-400 mt-1 animate-in slide-in-from-left-2">{errors.name.message}</p>
              )}
            </div>
            
            <div className="space-y-2 group">
              <Label htmlFor="organizationName" className="text-sm font-medium text-white/70 group-focus-within:text-primary transition-colors">Company Name</Label>
              <div className="relative">
                <Building className="absolute left-3 top-3 h-3.5 w-3.5 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                <Input
                  id="organizationName"
                  placeholder="Acme Corp"
                  className="pl-9 bg-black/20 border-white/10 text-white placeholder:text-white/20 focus:ring-primary/50 transition-all hover:bg-black/30"
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
            <Label htmlFor="email" className="text-sm font-medium text-white/70 group-focus-within:text-primary transition-colors">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
              <Input
                id="email"
                placeholder="name@company.com"
                type="email"
                className="pl-10 bg-black/20 border-white/10 text-white placeholder:text-white/20 focus:ring-primary/50 transition-all hover:bg-black/30"
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 group">
              <Label htmlFor="phone" className="text-sm font-medium text-white/70 group-focus-within:text-primary transition-colors">Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                <Input
                  id="phone"
                  placeholder="+1 555 0100"
                  className="pl-10 bg-black/20 border-white/10 text-white placeholder:text-white/20 focus:ring-primary/50 transition-all hover:bg-black/30"
                  {...register("phone")}
                  disabled={isLoading}
                />
              </div>
              {errors.phone && <p className="text-[10px] text-red-400 mt-1">{errors.phone.message}</p>}
            </div>
            <div className="space-y-2 group">
              <Label htmlFor="city" className="text-sm font-medium text-white/70 group-focus-within:text-primary transition-colors">City</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                <Input
                  id="city"
                  placeholder="New York"
                  className="pl-10 bg-black/20 border-white/10 text-white placeholder:text-white/20 focus:ring-primary/50 transition-all hover:bg-black/30"
                  {...register("city")}
                  disabled={isLoading}
                />
              </div>
              {errors.city && <p className="text-[10px] text-red-400 mt-1">{errors.city.message}</p>}
            </div>
            <div className="space-y-2 group">
              <Label htmlFor="country" className="text-sm font-medium text-white/70 group-focus-within:text-primary transition-colors">Country</Label>
              <Input
                id="country"
                placeholder="United States"
                className="bg-black/20 border-white/10 text-white placeholder:text-white/20 focus:ring-primary/50 transition-all hover:bg-black/30"
                {...register("country")}
                disabled={isLoading}
              />
              {errors.country && <p className="text-[10px] text-red-400 mt-1">{errors.country.message}</p>}
            </div>
          </div>
          
          <div className="space-y-2 group">
            <Label htmlFor="password" className="text-sm font-medium text-white/70 group-focus-within:text-primary transition-colors">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="pl-10 bg-black/20 border-white/10 text-white placeholder:text-white/20 focus:ring-primary/50 transition-all hover:bg-black/30"
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
            className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-all duration-300 shadow-lg shadow-primary/20 mt-2 active:scale-[0.98]" 
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Bootstrapping...
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4 text-center border-t border-white/5 pt-6 bg-white/[0.02]">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/auth/signin" className="text-primary hover:underline font-medium hover:opacity-80">
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
