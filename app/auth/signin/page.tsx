// app/auth/signin/page.tsx
"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signInAction } from "@/modules/auth/actions";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Mail, Loader2, AlertCircle } from "lucide-react";
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = getSafeCallbackUrl(searchParams.get("callbackUrl")) || "/dashboard";
  const [isLoading, setIsLoading] = useState(false);
  
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
    <Card className="border-outline-variant/30 bg-surface shadow-soft animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden relative rounded-3xl">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />
      <CardHeader className="space-y-1 text-center pt-8">
        <div className="mx-auto bg-primary/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ring-1 ring-primary/20 shadow-sm">
          <Lock className="w-6 h-6 text-primary" />
        </div>
        <CardTitle className="text-2xl font-black tracking-tight text-on-surface">Sign in</CardTitle>
        <CardDescription className="text-on-surface-variant text-xs font-medium uppercase tracking-wider">
          Welcome back to WhatsQuery
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2 group">
            <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-on-surface-variant group-focus-within:text-primary transition-colors">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-on-surface-variant group-focus-within:text-primary transition-colors" />
              <Input
                id="email"
                placeholder="name@company.com"
                type="email"
                className="pl-10 bg-surface border-outline-variant/50 text-on-surface placeholder:text-on-surface-variant/40 focus:ring-primary/20 transition-all hover:bg-surface-container-low"
                {...register("email")}
                disabled={isLoading}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-destructive flex items-center mt-1 animate-in slide-in-from-left-2">
                <AlertCircle className="w-3 h-3 mr-1" /> {errors.email.message}
              </p>
            )}
          </div>
          
          <div className="space-y-2 group">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-on-surface-variant group-focus-within:text-primary transition-colors">Password</Label>
              <Link 
                href="/auth/forgot-password" 
                className="text-[11px] font-bold text-primary hover:underline transition-all hover:opacity-80"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-on-surface-variant group-focus-within:text-primary transition-colors" />
              <Input
                id="password"
                type="password"
                className="pl-10 bg-surface border-outline-variant/50 text-on-surface placeholder:text-on-surface-variant/40 focus:ring-primary/20 transition-all hover:bg-surface-container-low"
                {...register("password")}
                disabled={isLoading}
              />
            </div>
            {errors.password && (
              <p className="text-xs text-destructive flex items-center mt-1 animate-in slide-in-from-left-2">
                <AlertCircle className="w-3 h-3 mr-1" /> {errors.password.message}
              </p>
            )}
          </div>

          <Button 
            className="w-full h-11 bg-primary hover:bg-primary/90 text-on-primary font-black uppercase tracking-widest rounded-xl transition-all duration-300 shadow-lg shadow-primary/20 active:scale-[0.98] mt-2" 
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Authenticating...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4 text-center border-t border-outline-variant/10 pt-6 pb-8 bg-surface-container-lowest/50">
        <p className="text-xs font-medium text-on-surface-variant">
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="text-primary hover:underline font-bold hover:opacity-80">
            Create workspace
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <Card className="border-outline-variant/30 bg-surface shadow-soft py-20 text-center rounded-3xl">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
      </Card>
    }>
      <SignInForm />
    </Suspense>
  );
}
