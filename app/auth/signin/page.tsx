// app/auth/signin/page.tsx
"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Mail, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { getPostSignInRedirect } from "@/lib/security/access";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [isLoading, setIsLoading] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Invalid email or password");
      } else {
        toast.success("Welcome back!");
        router.push(getPostSignInRedirect({ email: data.email, callbackUrl }));
        router.refresh();
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto bg-primary/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4 ring-1 ring-primary/30 shadow-[0_0_20px_rgba(var(--primary),0.2)]">
          <Lock className="w-6 h-6 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-white">Sign in to ERP</CardTitle>
        <CardDescription className="text-muted-foreground/80">
          Enter your credentials to access your organization
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2 group">
            <Label htmlFor="email" className="text-sm font-medium text-white/70 group-focus-within:text-primary transition-colors">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
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
          
          <div className="space-y-2 group">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-medium text-white/70 group-focus-within:text-primary transition-colors">Password</Label>
              <Link 
                href="/auth/forgot-password" 
                className="text-xs text-primary hover:underline transition-all hover:opacity-80"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                id="password"
                type="password"
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

          <Button 
            className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-all duration-300 shadow-lg shadow-primary/20 active:scale-[0.98]" 
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4 text-center border-t border-white/5 pt-6 bg-white/[0.02]">
        <p className="text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="text-primary hover:underline font-medium hover:opacity-80">
            Create an organization
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl py-20 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
      </Card>
    }>
      <SignInForm />
    </Suspense>
  );
}
