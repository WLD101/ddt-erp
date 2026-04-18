"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Loader2, ArrowRight } from "lucide-react";
import { createDemoAccount } from "@/modules/demo/actions";
import { Button } from "@/components/ui/button";

export function DemoButton({ className }: { className?: string }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleExploreDemo = async () => {
    setIsLoading(true);
    try {
      // Create a temporary Demo Tenant and User
      const credentials = await createDemoAccount();

      // Sign them in seamlessly
      const result = await signIn("credentials", {
        email: credentials.email,
        password: credentials.password,
        redirect: false,
      });

      if (result?.ok) {
        // Hard redirect to clear marketing layout state and mount the dashboard layout
        window.location.href = "/";
      } else {
        console.error("Auto sign-in failed", result);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Failed to create demo environment", error);
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleExploreDemo} 
      disabled={isLoading}
      variant="outline"
      className={`border-primary/50 bg-primary/5 hover:bg-primary/10 text-white font-bold uppercase tracking-widest ${className}`}
    >
      {isLoading ? (
        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Provisioning Data...</>
      ) : (
        <>Explore Live Demo <ArrowRight className="w-4 h-4 ml-2" /></>
      )}
    </Button>
  );
}
