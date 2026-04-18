// app/auth/join/page.tsx
"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Loader2, AlertCircle, CheckCircle2, Building2 } from "lucide-react";
import { joinOrganizationAction } from "@/modules/auth/actions";
import { toast } from "sonner";
import Link from "next/link";

const joinSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type JoinValues = z.infer<typeof joinSchema>;

function JoinForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<JoinValues>({
    resolver: zodResolver(joinSchema),
  });

  const onSubmit = async (data: JoinValues) => {
    if (!token) {
      toast.error("Invitation token is missing.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await joinOrganizationAction({
        token,
        name: data.name,
        password: data.password,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Joined successfully!");
        setIsSuccess(true);
        setTimeout(() => {
          router.push("/auth/signin");
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
      <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl text-center py-10 animate-in fade-in zoom-in duration-500">
        <div className="mx-auto bg-green-500/20 w-16 h-16 rounded-full flex items-center justify-center mb-6 ring-2 ring-green-500/30">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>
        <CardTitle className="text-2xl font-bold text-white mb-2">Welcome Aboard!</CardTitle>
        <CardDescription className="text-muted-foreground">
          You have successfully joined the organization.<br />
          Redirecting you to sign in...
        </CardDescription>
      </Card>
    );
  }

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto bg-primary/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4 ring-1 ring-primary/30">
          <Building2 className="w-6 h-6 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-white">Join Organization</CardTitle>
        <CardDescription className="text-muted-foreground">
          You&apos;ve been invited to collaborate. Complete your profile to get started.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="Your name"
              className="bg-black/20 border-white/10 text-white focus:ring-primary/50"
              {...register("name")}
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-xs text-red-400 flex items-center mt-1">
                <AlertCircle className="w-3 h-3 mr-1" /> {errors.name.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="bg-black/20 border-white/10 text-white focus:ring-primary/50"
                {...register("password")}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                className="bg-black/20 border-white/10 text-white focus:ring-primary/50"
                {...register("confirmPassword")}
                disabled={isLoading}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-red-400 mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          <Button 
            className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-all duration-300 shadow-lg shadow-primary/20 mt-2" 
            type="submit"
            disabled={isLoading || !token}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Joining...
              </>
            ) : (
              "Complete Registration"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center border-t border-white/5 pt-6">
         <p className="text-xs text-muted-foreground text-center">
            By joining, you agree to the organization&apos;s data policies and ERP terms of service.
         </p>
      </CardFooter>
    </Card>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={
      <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl py-20 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
      </Card>
    }>
      <JoinForm />
    </Suspense>
  );
}
