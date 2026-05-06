import { getAccounts } from "@/modules/finances/actions";
import { 
  Wallet, 
  Plus, 
  Building2, 
  CreditCard, 
  ChevronRight,
  TrendingUp,
  Landmark,
  ArrowRightLeft
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";

export default async function AccountsPage() {
  const accounts = await getAccounts();

  return (
    <div className="p-8 space-y-10 max-w-7xl mx-auto h-full overflow-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-primary/20 rounded-xl">
               <Wallet className="w-5 h-5 text-primary" />
             </div>
             <h2 className="text-3xl font-black tracking-tighter text-on-surface uppercase italic">
               Financial <span className="text-primary">Accounts</span>
             </h2>
          </div>
          <p className="text-muted-foreground text-sm font-medium">Managing organizational liquidity, bank reconciliations, and cash boxes.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button className="h-12 px-6 bg-surface-container-low hover:bg-surface-container border border-outline-variant/30 text-on-surface font-black text-xs uppercase tracking-widest rounded-xl flex items-center gap-2 transition-all">
            <ArrowRightLeft className="w-4 h-4 text-primary" />
            Transfer Funds
          </Button>
          <Button className="h-12 px-6 bg-primary hover:bg-primary/90 text-on-surface font-black text-xs uppercase tracking-widest rounded-xl flex items-center gap-2 transition-transform active:scale-95">
            <Plus className="w-4 h-4" />
            New Account
          </Button>
        </div>
      </div>

      {/* Grid Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <Card className="bg-surface-container-low border-outline-variant/20 shadow-xl glass-morphism rounded-3xl overflow-hidden relative group md:col-span-2">
           <CardHeader className="pb-2">
             <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
               <TrendingUp className="w-3 h-3 text-emerald-400" /> Total Liquidity
             </CardTitle>
           </CardHeader>
           <CardContent>
             <div className="text-4xl font-black text-on-surface italic tracking-tighter">
               ${accounts.reduce((sum, a) => sum + a.currentBalance, 0).toLocaleString()}
             </div>
             <p className="text-[11px] text-muted-foreground font-bold mt-1 uppercase tracking-widest">Aggregate value across all cash and bank vaults</p>
           </CardContent>
         </Card>

         <Card className="bg-surface-container-low border-outline-variant/20 shadow-xl glass-morphism rounded-3xl overflow-hidden md:col-span-1">
           <CardHeader className="pb-2">
             <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
               <Building2 className="w-3 h-3 text-primary" /> Bank Value
             </CardTitle>
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-black text-on-surface italic tracking-tighter">
               ${accounts.filter(a => a.type === 'BANK').reduce((sum, a) => sum + a.currentBalance, 0).toLocaleString()}
             </div>
           </CardContent>
         </Card>

         <Card className="bg-surface-container-low border-outline-variant/20 shadow-xl glass-morphism rounded-3xl overflow-hidden md:col-span-1">
           <CardHeader className="pb-2">
             <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
               <Landmark className="w-3 h-3 text-orange-400" /> Cash Box
             </CardTitle>
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-black text-on-surface italic tracking-tighter">
               ${accounts.filter(a => a.type === 'CASH').reduce((sum, a) => sum + a.currentBalance, 0).toLocaleString()}
             </div>
           </CardContent>
         </Card>
      </div>

      {/* Accounts List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((account) => (
          <Link 
            key={account.id} 
            href={`/finances/accounts/${account.id}`}
            className="group block bg-surface/[0.03] border border-outline-variant/20 hover:border-primary/30 rounded-[32px] p-8 transition-all duration-300 relative overflow-hidden"
          >
            {/* Gloss Highlight */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="space-y-6 relative z-10">
              <div className="flex items-start justify-between">
                <div className="h-14 w-14 rounded-2xl bg-slate-900 border border-outline-variant/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  {account.type === 'BANK' ? (
                    <Building2 className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                  ) : (
                    <Landmark className="w-6 h-6 text-orange-400 group-hover:scale-110 transition-transform" />
                  )}
                </div>
                <Badge variant="outline" className="bg-surface-container-low border-outline-variant/30 text-[10px] font-black tracking-widest uppercase py-1 px-3">
                  {account.type}
                </Badge>
              </div>

              <div className="space-y-1">
                <h4 className="text-xl font-black text-on-surface tracking-tight group-hover:text-primary transition-colors">{account.name}</h4>
                <p className="text-xs text-muted-foreground font-medium">
                  {account.type === 'BANK' ? `${account.bankName || 'Bank'} • ${account.accountNumber || '****'}` : 'Cash Vault'}
                </p>
              </div>

              <div className="pt-6 border-t border-outline-variant/20 flex items-center justify-between">
                 <div className="space-y-0.5">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">Current Balance</p>
                    <p className="text-2xl font-black text-on-surface italic">${account.currentBalance.toLocaleString()}</p>
                 </div>
                 <div className="bg-surface-container-low p-2.5 rounded-xl group-hover:bg-primary/20 transition-colors">
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                 </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
