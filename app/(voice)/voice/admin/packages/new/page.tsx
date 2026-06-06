import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createVoicePackageAction } from "../actions";

export const dynamic = "force-dynamic";

const shellCardClassName = "overflow-hidden rounded-[28px] border border-outline-variant/30 bg-surface shadow-[0_18px_48px_rgba(15,23,42,0.08)]";
const inputClassName = "h-11 w-full rounded-xl border border-outline-variant bg-surface-container px-3 text-sm text-on-surface outline-none font-medium focus:ring-2 focus:ring-primary/20";
const labelClassName = "text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1 block";

export default function NewVoicePackagePage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.10),transparent_30%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_28%),linear-gradient(180deg,#f8f9ff_0%,#eef4ff_100%)] text-on-surface pb-12">
      <div className="mx-auto max-w-4xl space-y-8 px-6 pt-8">
        <div className="flex items-center gap-4">
          <Link href="/voice/admin/packages" className="flex items-center justify-center h-10 w-10 rounded-full bg-surface border border-outline-variant/30 hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </Link>
          <div>
            <Badge className="border-none bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/20 mb-2">
              Voice Platform
            </Badge>
            <h1 className="text-3xl font-black tracking-tight text-on-surface">Create New Package</h1>
          </div>
        </div>

        <form action={createVoicePackageAction}>
          <div className="grid gap-6">
            <Card className={shellCardClassName}>
              <CardHeader className="border-b border-outline-variant/10 bg-linear-to-r from-surface to-surface-container-lowest px-6 py-5">
                <CardTitle className="text-sm font-black uppercase tracking-[0.12em] text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">info</span>
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 py-6 grid gap-6 sm:grid-cols-2">
                <div className="space-y-1 sm:col-span-2">
                  <label className={labelClassName}>Package Name</label>
                  <input name="name" required placeholder="e.g. Starter Voice" className={inputClassName} />
                </div>
                <div className="space-y-1">
                  <label className={labelClassName}>Slug</label>
                  <input name="slug" required placeholder="e.g. starter-voice" className={inputClassName} />
                </div>
                <div className="space-y-1">
                  <label className={labelClassName}>Description</label>
                  <input name="description" placeholder="Short description..." className={inputClassName} />
                </div>
                <div className="space-y-1">
                  <label className={labelClassName}>Monthly Price (USD)</label>
                  <input name="monthlyPrice" type="number" step="0.01" required placeholder="e.g. 49.00" className={inputClassName} />
                </div>
                <div className="space-y-1">
                  <label className={labelClassName}>Original Monthly Price (Optional)</label>
                  <input name="originalMonthlyPrice" type="number" step="0.01" placeholder="e.g. 99.00" className={inputClassName} />
                </div>
                <div className="space-y-1">
                  <label className={labelClassName}>Trial Days</label>
                  <input name="trialDays" type="number" placeholder="e.g. 14" className={inputClassName} />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <input type="checkbox" name="isActive" id="isActive" defaultChecked className="h-5 w-5 rounded border-outline-variant text-primary focus:ring-primary" />
                  <label htmlFor="isActive" className="text-sm font-bold text-on-surface">Active</label>
                </div>
              </CardContent>
            </Card>

            <Card className={shellCardClassName}>
              <CardHeader className="border-b border-outline-variant/10 bg-linear-to-r from-surface to-surface-container-lowest px-6 py-5">
                <CardTitle className="text-sm font-black uppercase tracking-[0.12em] text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">tune</span>
                  Voice Capabilities & Limits
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 py-6 grid gap-6 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className={labelClassName}>Max Agents (Empty = Unlimited)</label>
                  <input name="maxAgents" type="number" placeholder="e.g. 1" className={inputClassName} />
                </div>
                <div className="space-y-1">
                  <label className={labelClassName}>Max Phone Numbers</label>
                  <input name="maxPhoneNumbers" type="number" placeholder="e.g. 1" className={inputClassName} />
                </div>
                <div className="space-y-1">
                  <label className={labelClassName}>Max Monthly Calls</label>
                  <input name="maxMonthlyCalls" type="number" placeholder="e.g. 500" className={inputClassName} />
                </div>
                <div className="space-y-1">
                  <label className={labelClassName}>Max Monthly Minutes</label>
                  <input name="maxMonthlyMinutes" type="number" placeholder="e.g. 1000" className={inputClassName} />
                </div>
                <div className="space-y-1">
                  <label className={labelClassName}>Max Concurrent Calls</label>
                  <input name="maxConcurrentCalls" type="number" placeholder="e.g. 5" className={inputClassName} />
                </div>
                <div className="space-y-1">
                  <label className={labelClassName}>Max Leads / Month</label>
                  <input name="maxLeadsPerMonth" type="number" placeholder="e.g. 100" className={inputClassName} />
                </div>
                <div className="space-y-1">
                  <label className={labelClassName}>Max Reservation Requests / Month</label>
                  <input name="maxReservationRequestsPerMonth" type="number" placeholder="e.g. 50" className={inputClassName} />
                </div>
                <div className="space-y-1">
                  <label className={labelClassName}>Max Order Requests / Month</label>
                  <input name="maxOrderRequestsPerMonth" type="number" placeholder="e.g. 50" className={inputClassName} />
                </div>
                <div className="space-y-1">
                  <label className={labelClassName}>Recording Retention (Days)</label>
                  <input name="recordingRetentionDays" type="number" placeholder="e.g. 30" className={inputClassName} />
                </div>
                <div className="space-y-1">
                  <label className={labelClassName}>Transcript Retention (Days)</label>
                  <input name="transcriptRetentionDays" type="number" placeholder="e.g. 90" className={inputClassName} />
                </div>
                <div className="sm:col-span-2 grid gap-4 sm:grid-cols-3 pt-2">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" name="supportsForwarding" id="supportsForwarding" className="h-5 w-5 rounded border-outline-variant text-primary focus:ring-primary" />
                    <label htmlFor="supportsForwarding" className="text-sm font-bold text-on-surface">Call Forwarding</label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" name="includesVapiPhoneNumber" id="includesVapiPhoneNumber" className="h-5 w-5 rounded border-outline-variant text-primary focus:ring-primary" />
                    <label htmlFor="includesVapiPhoneNumber" className="text-sm font-bold text-on-surface">Includes Vapi Number</label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" name="prioritySupport" id="prioritySupport" className="h-5 w-5 rounded border-outline-variant text-primary focus:ring-primary" />
                    <label htmlFor="prioritySupport" className="text-sm font-bold text-on-surface">Priority Support</label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={shellCardClassName}>
              <CardHeader className="border-b border-outline-variant/10 bg-linear-to-r from-surface to-surface-container-lowest px-6 py-5">
                <CardTitle className="text-sm font-black uppercase tracking-[0.12em] text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">payments</span>
                  Stripe Integration
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 py-6 grid gap-6 sm:grid-cols-2">
                <div className="space-y-1 sm:col-span-2">
                  <label className={labelClassName}>Stripe Product ID</label>
                  <input name="stripeProductId" placeholder="prod_..." className={inputClassName} />
                </div>
                <div className="space-y-1">
                  <label className={labelClassName}>Stripe Monthly Price ID</label>
                  <input name="stripeMonthlyPriceId" placeholder="price_..." className={inputClassName} />
                </div>
                <div className="space-y-1">
                  <label className={labelClassName}>Stripe Annual Price ID</label>
                  <input name="stripeAnnualPriceId" placeholder="price_..." className={inputClassName} />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Link href="/voice/admin/packages">
                <Button variant="outline" type="button" className="h-12 rounded-2xl px-6 text-[12px] font-black uppercase tracking-widest border-outline-variant/40">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" className="h-12 rounded-2xl bg-primary px-8 text-[12px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:opacity-90">
                Create Package
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
