"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { submitLeadAction } from "@/modules/leads/actions";
import { Loader2, CheckCircle2 } from "lucide-react";

// --- CONTACT FORM SCHEMA ---
const contactSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  businessName: z.string().optional(),
  message: z.string().min(10, "Message is too short"),
  honeypot: z.string().optional(),
});

// --- DEMO FORM SCHEMA ---
const demoSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  businessName: z.string().min(2, "Business name is required"),
  phone: z.string().optional(),
  companySize: z.string().optional(),
  preferredDemoTime: z.string().optional(),
  honeypot: z.string().optional(),
});

export function ContactForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(contactSchema),
    });

    const onSubmit = async (data: any) => {
        setIsLoading(true);
        const result = await submitLeadAction({ ...data, source: "CONTACT" });
        setIsLoading(false);
        if (result.success) {
            setIsSuccess(true);
            toast.success(result.message);
        } else {
            toast.error(result.error);
        }
    };

    if (isSuccess) return <SuccessState />;

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
             {/* Honeypot field - hidden from users but visible to bots */}
             <div className="hidden" aria-hidden="true">
                <input {...register("honeypot")} tabIndex={-1} autoComplete="off" />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-white/70">Name</Label>
                    <Input {...register("name")} className="bg-white/5 border-white/10" placeholder="Your Name" />
                    {errors.name && <p className="text-xs text-rose-400">{errors.name.message as string}</p>}
                </div>
                <div className="space-y-2">
                    <Label className="text-white/70">Business Name</Label>
                    <Input {...register("businessName")} className="bg-white/5 border-white/10" placeholder="Optional" />
                </div>
            </div>
            
            <div className="space-y-2">
                <Label className="text-white/70">Email</Label>
                <Input {...register("email")} type="email" className="bg-white/5 border-white/10" placeholder="you@company.com" />
                {errors.email && <p className="text-xs text-rose-400">{errors.email.message as string}</p>}
            </div>

            <div className="space-y-2">
                <Label className="text-white/70">Message</Label>
                <Textarea {...register("message")} className="bg-white/5 border-white/10 min-h-[120px]" placeholder="How can we help?" />
                {errors.message && <p className="text-xs text-rose-400">{errors.message.message as string}</p>}
            </div>

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Send Message"}
            </Button>
        </form>
    );
}

export function DemoRequestForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(demoSchema),
    });

    const onSubmit = async (data: any) => {
        setIsLoading(true);
        const result = await submitLeadAction({ ...data, source: "DEMO" });
        setIsLoading(false);
        if (result.success) {
            setIsSuccess(true);
            toast.success(result.message);
        } else {
            toast.error(result.error);
        }
    };

    if (isSuccess) return <SuccessState />;

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
             <div className="hidden" aria-hidden="true">
                <input {...register("honeypot")} tabIndex={-1} autoComplete="off" />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-white/70">Full Name</Label>
                    <Input {...register("name")} className="bg-white/5 border-white/10" placeholder="John Doe" />
                    {errors.name && <p className="text-xs text-rose-400">{errors.name.message as string}</p>}
                </div>
                <div className="space-y-2">
                    <Label className="text-white/70">Company Name</Label>
                    <Input {...register("businessName")} className="bg-white/5 border-white/10" placeholder="Acme Corp" />
                    {errors.businessName && <p className="text-xs text-rose-400">{errors.businessName.message as string}</p>}
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-white/70">Email</Label>
                    <Input {...register("email")} type="email" className="bg-white/5 border-white/10" placeholder="name@company.com" />
                    {errors.email && <p className="text-xs text-rose-400">{errors.email.message as string}</p>}
                </div>
                <div className="space-y-2">
                    <Label className="text-white/70">Phone (Optional)</Label>
                    <Input {...register("phone")} className="bg-white/5 border-white/10" placeholder="+1..." />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-white/70">Company Size</Label>
                    <select {...register("companySize")} className="w-full bg-white/5 border-white/10 rounded-md h-10 px-3 text-sm outline-none focus:ring-1 ring-primary/50">
                        <option value="1-10" className="bg-slate-900">1-10 employees</option>
                        <option value="11-50" className="bg-slate-900">11-50 employees</option>
                        <option value="51-200" className="bg-slate-900">51-200 employees</option>
                        <option value="201+" className="bg-slate-900">201+ employees</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <Label className="text-white/70">Preferred Time</Label>
                    <Input {...register("preferredDemoTime")} className="bg-white/5 border-white/10" placeholder="e.g. Next Monday AM" />
                </div>
            </div>

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 h-12 text-lg font-bold uppercase tracking-tight" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Request My Walkthrough"}
            </Button>
            <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest leading-none mt-2">
                No credit card required. Demo is 100% free.
            </p>
        </form>
    );
}

function SuccessState() {
    return (
        <div className="py-12 text-center animate-in fade-in zoom-in duration-500">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/20 mb-6 ring-2 ring-emerald-500/30">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Request Received!</h3>
            <p className="text-muted-foreground">Thank you for your interest. A product specialist will contact you shortly to confirm the details.</p>
        </div>
    );
}
