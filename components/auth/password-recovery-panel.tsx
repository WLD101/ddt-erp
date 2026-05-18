"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Loader2, Mail, Send } from "lucide-react";
import { toast } from "sonner";

import { forgotPasswordAction } from "@/modules/auth/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type PasswordRecoveryPanelProps = {
  embedded?: boolean;
};

export function PasswordRecoveryPanel({ embedded = false }: PasswordRecoveryPanelProps) {
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
        toast.success("Reset link sent to your email.");
      }
    } catch {
      toast.error("I couldn't start password recovery right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
      <Card
        className={cn(
          "text-center",
          embedded
            ? "border-outline-variant/30 bg-surface shadow-soft"
            : "border-white/10 bg-white/5 py-8 text-white backdrop-blur-xl shadow-2xl"
        )}
      >
        <CardHeader className="space-y-4">
          <div
            className={cn(
              "mx-auto flex h-16 w-16 items-center justify-center rounded-full",
              embedded ? "bg-primary/10 ring-2 ring-primary/15" : "bg-green-500/20 ring-2 ring-green-500/30"
            )}
          >
            <CheckCircle2 className={cn("h-8 w-8", embedded ? "text-primary" : "text-green-400")} />
          </div>
          <CardTitle className={cn("text-2xl font-black tracking-tight", embedded ? "text-on-surface" : "text-white")}>
            Check your email
          </CardTitle>
          <CardDescription className={cn("px-4", embedded ? "text-on-surface-variant" : "text-muted-foreground")}>
            We&apos;ve sent a password reset link to{" "}
            <span className={cn("font-bold", embedded ? "text-on-surface" : "text-white")}>{email}</span>.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center">
          <Link
            href={embedded ? "/settings/security" : "/auth/signin"}
            className={cn(
              "flex items-center text-sm font-bold transition-all",
              embedded ? "text-primary hover:opacity-80" : "text-primary hover:underline"
            )}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {embedded ? "Back to security center" : "Back to sign in"}
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        embedded
          ? "border-outline-variant/30 bg-surface shadow-soft"
          : "animate-in slide-in-from-bottom-4 rounded-[32px] border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl duration-500"
      )}
    >
      <CardHeader className={cn("space-y-1", embedded ? "" : "text-center")}>
        <div
          className={cn(
            "mb-4 flex h-12 w-12 items-center justify-center rounded-xl ring-1",
            embedded ? "bg-primary/10 text-primary ring-primary/20" : "mx-auto bg-primary/20 text-primary ring-primary/30"
          )}
        >
          <Send className="h-6 w-6" />
        </div>
        <CardTitle className={cn("text-2xl font-black tracking-tight", embedded ? "text-on-surface" : "text-white font-outfit")}>
          Reset password
        </CardTitle>
        <CardDescription className={embedded ? "text-on-surface-variant" : "text-muted-foreground"}>
          Enter your email address and we&apos;ll send you a link to reset your password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className={cn("text-sm font-semibold", embedded ? "text-on-surface" : "text-white/70")}>
              Email address
            </Label>
            <div className="relative">
              <Mail className={cn("absolute left-3 top-3 h-4 w-4", embedded ? "text-on-surface-variant/70" : "text-muted-foreground/50")} />
              <Input
                id="email"
                placeholder="name@company.com"
                type="email"
                required
                className={cn(
                  "pl-10 transition-all",
                  embedded
                    ? "border-outline-variant/40 bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/50"
                    : "border-white/10 bg-black/20 text-white placeholder:text-white/20 focus:ring-primary/50"
                )}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <Button className="w-full" size="lg" type="submit" disabled={isLoading || !email}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending link...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send reset link
              </>
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className={cn("flex justify-center", embedded ? "" : "mt-2 border-t border-white/5 bg-transparent")}>
        <Link
          href={embedded ? "/settings/security" : "/auth/signin"}
          className={cn(
            "flex items-center text-sm transition-colors",
            embedded ? "font-bold text-primary hover:opacity-80" : "text-muted-foreground hover:text-white"
          )}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {embedded ? "Back to security center" : "Back to sign in"}
        </Link>
      </CardFooter>
    </Card>
  );
}
