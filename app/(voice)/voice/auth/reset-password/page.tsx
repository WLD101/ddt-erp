// app/(voice)/voice/auth/reset-password/page.tsx
"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { resetPasswordAction } from "@/modules/auth/actions";
import { toast } from "sonner";
import Link from "next/link";

const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    if (!token) {
      toast.error("Missing reset token");
      router.push("/voice/auth/signin");
    }
  }, [token, router]);

  const onSubmit = async (data: ResetPasswordValues) => {
    if (!token) return;
    setIsLoading(true);
    try {
      const result = await resetPasswordAction({
        token,
        password: data.password,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Password reset successfully!");
        setIsSuccess(true);
        setTimeout(() => {
          router.push("/voice/auth/signin");
        }, 3000);
      }
    } catch (error) {
      toast.error("Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <Card className="border-white/10 bg-slate-900/50 p-8 backdrop-blur-xl shadow-2xl text-center animate-in fade-in zoom-in duration-500 max-w-md w-full">
        <div className="mx-auto bg-cyan-500/20 w-16 h-16 rounded-full flex items-center justify-center mb-6 ring-2 ring-cyan-500/30">
          <CheckCircle2 className="w-8 h-8 text-cyan-400" />
        </div>
        <CardTitle className="text-2xl font-bold text-white mb-2">Password Updated</CardTitle>
        <CardDescription className="text-slate-400">
          Your password has been changed successfully.<br />
          Redirecting you to sign in...
        </CardDescription>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/50 p-8 backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardHeader className="space-y-1 text-center pb-6">
        <div className="mx-auto bg-cyan-500/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4 ring-1 ring-cyan-500/30">
          <Lock className="w-6 h-6 text-cyan-400" />
        </div>
        <CardTitle className="text-2xl font-black tracking-tight text-white animate-pulse">New Password</CardTitle>
        <CardDescription className="text-slate-400">
          Please enter and confirm your new strong password.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-slate-400">New Password</Label>
            <div className="relative">
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                {...register("password")}
                disabled={isLoading}
              />
            </div>
            {errors.password && (
              <p className="text-xs text-red-400 flex items-center mt-1">
                <AlertCircle className="w-3 h-3 mr-1" /> {errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-wider text-slate-400">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                {...register("confirmPassword")}
                disabled={isLoading}
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-red-400 flex items-center mt-1">
                <AlertCircle className="w-3 h-3 mr-1" /> {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <button 
            className="mt-6 flex w-full items-center justify-center rounded-xl bg-cyan-500 px-4 py-3 font-bold text-slate-950 transition-all hover:bg-cyan-400 disabled:opacity-50"
            type="submit"
            disabled={isLoading || !token}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Updating...
              </>
            ) : (
              "Reset Password"
            )}
          </button>
        </form>
      </CardContent>
      <CardFooter className="justify-center border-t border-white/5 pt-6 mt-6 p-0">
         <Link href="/voice/auth/signin" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">
            Return to login
         </Link>
      </CardFooter>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <Card className="border-white/10 bg-slate-900/50 py-20 text-center rounded-3xl w-full max-w-md">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500 mx-auto" />
      </Card>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
