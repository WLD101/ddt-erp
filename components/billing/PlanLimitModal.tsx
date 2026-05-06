"use client";

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Zap, CheckCircle2, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

interface PlanLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  limitType?: string;
}

export function PlanLimitModal({ 
  isOpen, 
  onClose, 
  title = "Limit Reached", 
  description,
  limitType 
}: PlanLimitModalProps) {
  const router = useRouter();

  const handleUpgrade = () => {
    onClose();
    router.push("/settings/billing");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] bg-slate-900/90 backdrop-blur-2xl border-white/10 text-white overflow-hidden shadow-[0_0_50px_-12px_rgba(124,58,237,0.3)]">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-fuchsia-500 to-primary animate-gradient" />
        
        <DialogHeader className="pt-4">
          <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4 ring-1 ring-primary/30 shadow-[0_0_20px_rgba(124,58,237,0.2)]">
            <Zap className="w-8 h-8 text-primary animate-pulse" />
          </div>
          <DialogTitle className="text-2xl font-black text-center tracking-tight">
            {title}
          </DialogTitle>
          <DialogDescription className="text-center text-slate-400 text-base py-2">
            {description || `You've reached the maximum number of ${limitType || 'items'} allowed on your current plan.`}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h4 className="text-sm font-bold text-slate-300 mb-3 flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-400" />
              Upgrade your package to unlock:
            </h4>
            <ul className="grid grid-cols-1 gap-2 text-sm text-slate-400">
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mr-2" />
                More branches and more staff seats
              </li>
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mr-2" />
                Higher product and monthly sales capacity
              </li>
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mr-2" />
                WooCommerce, Shopify, and Daraz workflows
              </li>
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mr-2" />
                CSV imports, exports, and advanced reporting
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-3">
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="w-full sm:flex-1 text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            Maybe later
          </Button>
          <Button 
            onClick={handleUpgrade}
            className="w-full sm:flex-2 bg-primary hover:bg-primary/90 text-white font-bold py-6 shadow-[0_0_20px_rgba(124,58,237,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Upgrade Now
            <Zap className="w-4 h-4 ml-2 fill-current" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
