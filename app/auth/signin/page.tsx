// app/auth/signin/page.tsx
"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signInAction } from "@/modules/auth/actions";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Mail, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function getSafeCallbackUrl(value: string | null) {
  if (!value) {
    return null;
  }
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\") || value.includes("\n") || value.includes("\r")) {
    return "/";
  }
  return value;
}

function SignInForm() {
  const searchParams = useSearchParams();
  const callbackUrl = getSafeCallbackUrl(searchParams.get("callbackUrl")) || "/dashboard";
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("email", data.email);
      formData.append("password", data.password);
      formData.append("callbackUrl", callbackUrl || "/");

      const result = await signInAction(null, formData);

      if (result?.error) {
        toast.error(result.error);
      } else if (result?.requiresTwoFactor && result.next) {
        toast.success("Security verification required.");
        window.location.assign(result.next);
      } else {
        toast.success("Welcome back!");
        window.location.assign(callbackUrl);
      }
    } catch (error: any) {
      if (error && (error.message === "NEXT_REDIRECT" || error.digest?.includes("NEXT_REDIRECT"))) {
        throw error;
      }
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="glass-card border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-bottom-4 duration-700 overflow-hidden relative rounded-[32px]">
      <CardHeader className="space-y-1 text-center pt-10">
        <div className="mx-auto bg-indigo-500/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-4 border border-indigo-500/20 shadow-sm">
          <Lock className="w-6 h-6 text-indigo-400" />
        </div>
        <CardTitle className="text-3xl font-extrabold tracking-tight text-white">Sign in</CardTitle>
        <CardDescription className="text-slate-400 text-sm font-medium">
          Welcome back to WhatsQuery.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2 group">
            <Label htmlFor="email" className="text-sm font-semibold text-slate-300">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
              <Input
                id="email"
                placeholder="name@company.com"
                type="email"
                className="pl-11 h-12 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all hover:bg-white/10 rounded-xl"
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
          
          <div className="space-y-2 group">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-semibold text-slate-300">Password</Label>
              <Link 
                href="/auth/forgot-password" 
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-all"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className="h-12 rounded-xl border-white/10 bg-white/5 pl-11 pr-11 text-white placeholder:text-slate-600 transition-all hover:bg-white/10 focus:border-indigo-500/50 focus:ring-indigo-500/20"
                {...register("password")}
                disabled={isLoading}
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-3 inline-flex h-6 w-6 items-center justify-center text-slate-400 transition hover:text-white"
                onClick={() => setShowPassword((value) => !value)}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-400 flex items-center mt-1 animate-in slide-in-from-left-2">
                <AlertCircle className="w-3 h-3 mr-1" /> {errors.password.message}
              </p>
            )}
          </div>

          <Button 
            className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(99,102,241,0.3)] active:scale-[0.98] mt-4 border-t border-indigo-400/20" 
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Authenticating...
              </>
            ) : (
              "Sign In to Workspace"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4 text-center border-t border-white/5 pt-6 pb-8 bg-black/20">
        <p className="text-sm font-medium text-slate-400">
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="text-indigo-400 hover:text-indigo-300 font-bold transition">
            Create workspace
          </Link>
        </p>
        <Link href="/auth/forgot-password" className="text-xs font-bold text-slate-400 transition hover:text-indigo-300">
          Need to reset your password?
        </Link>
      </CardFooter>
    </Card>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <Card className="glass-card border-white/10 shadow-2xl py-24 text-center rounded-[32px] w-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </Card>
    }>
      <SignInForm />
    </Suspense>
  );
}
