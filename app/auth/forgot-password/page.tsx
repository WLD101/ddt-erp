// app/auth/forgot-password/page.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, ArrowLeft, Send, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { forgotPasswordAction } from "@/modules/auth/actions";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      const result = await forgotPasswordAction(email);
      if (result.error) {
        toast.error(result.error);
      } else {
        setIsSent(true);
        toast.success("Reset link sent!");
      }
    } catch (error) {
      toast.error("Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
      <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl text-center py-8 animate-in fade-in zoom-in duration-300">
        <CardHeader className="space-y-4">
          <div className="mx-auto bg-green-500/20 w-16 h-16 rounded-full flex items-center justify-center mb-2 ring-2 ring-green-500/30">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">Check your email</CardTitle>
          <CardDescription className="text-muted-foreground px-4">
            We&apos;ve sent a password reset link to <span className="font-semibold text-white">{email}</span>.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center border-t border-white/5 pt-6 mt-4">
          <Link href="/auth/signin" className="text-primary hover:underline flex items-center text-sm font-medium transition-all group">
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to sign in
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto bg-primary/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4 ring-1 ring-primary/30">
          <Send className="w-6 h-6 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-white font-outfit">Reset password</CardTitle>
        <CardDescription className="text-muted-foreground">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-white/70">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/50" />
              <Input
                id="email"
                placeholder="name@company.com"
                type="email"
                required
                className="pl-10 bg-black/20 border-white/10 text-white placeholder:text-white/20 focus:ring-primary/50 transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <Button 
            className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-all duration-300 shadow-lg shadow-primary/20" 
            type="submit"
            disabled={isLoading || !email}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Dispatching...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send reset link
              </>
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center border-t border-white/5 pt-6 mt-2">
        <Link href="/auth/signin" className="text-sm text-muted-foreground hover:text-white flex items-center transition-colors group">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to sign in
        </Link>
      </CardFooter>
    </Card>
  );
}
