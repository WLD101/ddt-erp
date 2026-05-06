import { auth } from "@/lib/auth";
import { getCurrentTenantContext, isSuperAdmin, requireRole } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle2, 
  PlayCircle, 
  MessageSquare, 
  Map, 
  BadgeDollarSign, 
  HelpCircle,
  Package,
  ShoppingCart,
  Users,
  LineChart,
  Globe,
  Settings
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default async function DemoScriptPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin?callbackUrl=/dashboard/demo-script");
  }

  const userEmail = session.user.email;
  if (!isSuperAdmin(userEmail)) {
    try {
      const ctx = await getCurrentTenantContext();
      requireRole(ctx, "owner", "admin");
      const organization = await prisma.organization.findUnique({
        where: { id: ctx.organizationId },
        select: { isDemoTenant: true },
      });
      if (!organization?.isDemoTenant) {
        redirect("/dashboard");
      }
    } catch {
      redirect("/dashboard");
    }
  }

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <PlayCircle className="w-8 h-8 text-indigo-500" />
          <h1 className="text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            WhatsQuery Demo Script
          </h1>
        </div>
        <p className="text-muted-foreground font-medium">
          Your master guide for presenting the ERP to modern SMB and mid-market clients.
        </p>
      </div>

      <Tabs defaultValue="script" className="space-y-6">
        <TabsList className="bg-surface/40 border border-outline-variant/20 p-1 h-auto grid grid-cols-2 md:grid-cols-4 gap-2">
          <TabsTrigger value="script" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-on-surface py-2">
            <MessageSquare className="w-4 h-4 mr-2" /> Script
          </TabsTrigger>
          <TabsTrigger value="guide" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-on-surface py-2">
            <Map className="w-4 h-4 mr-2" /> Demo Flow
          </TabsTrigger>
          <TabsTrigger value="features" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-on-surface py-2">
            <CheckCircle2 className="w-4 h-4 mr-2" /> Features
          </TabsTrigger>
          <TabsTrigger value="sales" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-on-surface py-2">
            <BadgeDollarSign className="w-4 h-4 mr-2" /> Sales & FAQ
          </TabsTrigger>
        </TabsList>

        {/* 1. DEMO SCRIPT SECTION */}
        <TabsContent value="script">
          <Card className="border-outline-variant/20 bg-gradient-to-br from-card to-card/50 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-indigo-400" />
                The 5-Minute Elevator Pitch
              </CardTitle>
              <CardDescription className="text-indigo-200/60 font-medium italic">
                &quot;An AI-ready ERP for growing businesses to manage sales, inventory, purchases, expenses, reports, and connected commerce without spreadsheet chaos.&quot;
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-foreground/90 leading-relaxed">
              <div className="bg-indigo-500/10 border-l-4 border-indigo-500 p-4 rounded-r-lg">
                <p className="font-bold text-indigo-300 mb-1 uppercase text-xs tracking-widest">Introduction (0-1 min)</p>
                <p>&quot;Today I want to show you how you can move your business from multiple spreadsheets and disconnected tools into a single, automated dashboard. Whether you have one storefront or five warehouses across multiple cities, our ERP gives you real-time control.&quot;</p>
              </div>

              <div className="bg-surface-container-low p-4 rounded-lg border border-outline-variant/20">
                <p className="font-bold text-on-surface-variant/50 mb-1 uppercase text-xs tracking-widest">The Core Problem (1-2 min)</p>
                <p>&quot;Most growing businesses struggle with stock mismatch. You sell something online, but don&apos;t know if it&apos;s available in your store. Or you pay a supplier but forget to record the expense. We solve this by syncing your physical stock with your sales channels automatically.&quot;</p>
              </div>

              <div className="bg-surface-container-low p-4 rounded-lg border border-outline-variant/20">
                <p className="font-bold text-on-surface-variant/50 mb-1 uppercase text-xs tracking-widest">The "Magic" Moment (2-4 min)</p>
                <p>&quot;Look at this Dashboard. It tells you your Net Treasury—exactly how much cash and bank balance you have right now. It alerts you when your Basmati Rice stock is low. And with one click, you can see if your business is actually making a profit after all expenses.&quot;</p>
              </div>

              <div className="bg-green-500/10 border-l-4 border-green-500 p-4 rounded-r-lg">
                <p className="font-bold text-green-300 mb-1 uppercase text-xs tracking-widest">The Close (4-5 min)</p>
                <p>&quot;Our system is built for adaptable operations. It supports flexible currencies, configurable tax labels, and integrates with the platforms you already use like Daraz, Shopify, and WooCommerce. Shall we set up your demo workspace?&quot;</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. DEMO FLOW & TALKING POINTS */}
        <TabsContent value="guide" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-outline-variant/20 bg-surface/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Map className="w-5 h-5 text-indigo-400" />
                  Recommended Route
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3">
                  {[
                    { label: "Dashboard", desc: "Show Net Treasury & Profit cards" },
                    { label: "Customers", desc: "Show the Al Sadiq store list" },
                    { label: "Suppliers", desc: "Manage vendor relations" },
                    { label: "Products", desc: "Catalogue with SKU tracking" },
                    { label: "Inventory", desc: "Stock across branch and warehouse locations" },
                    { label: "Sales Invoice", desc: "Create a professional tax-ready invoice" },
                    { label: "Purchase Invoice", desc: "Record stock inward & costs" },
                    { label: "Reports", desc: "Profit/Loss and Revenue trends" },
                    { label: "Integrations", desc: "Daraz & Shopify sync demo" },
                    { label: "Platform Admin", desc: "Package management (Optional)" }
                  ].map((item, i) => (
                    <li key={item.label} className="flex items-start gap-3 group">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center font-bold border border-indigo-500/30 group-hover:bg-indigo-500 group-hover:text-on-surface transition-colors">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-bold text-sm">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>

            <Card className="border-outline-variant/20 bg-surface/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-indigo-400" />
                  Key Talking Points
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-xs font-black uppercase text-on-surface/40 tracking-tighter">Multi-Branch Control</p>
                  <p className="text-sm text-foreground/80">Manage headquarters, regional hubs, and satellite branches from one login.</p>
                </div>
                <Separator className="bg-surface-container-low" />
                <div className="space-y-2">
                  <p className="text-xs font-black uppercase text-on-surface/40 tracking-tighter">Smart Inventory</p>
                  <p className="text-sm text-foreground/80">Never run out of stock. Automatic low-stock alerts and movement history.</p>
                </div>
                <Separator className="bg-surface-container-low" />
                <div className="space-y-2">
                  <p className="text-xs font-black uppercase text-on-surface/40 tracking-tighter">Finance Visibility</p>
                  <p className="text-sm text-foreground/80">See exactly where your money is. Track expenses vs income in real-time.</p>
                </div>
                <Separator className="bg-surface-container-low" />
                <div className="space-y-2">
                  <p className="text-xs font-black uppercase text-on-surface/40 tracking-tighter">Ecommerce Ready</p>
                  <p className="text-sm text-foreground/80">Native support for Daraz, Shopify, and WooCommerce. No more manual entry.</p>
                </div>
                <Separator className="bg-surface-container-low" />
                <div className="space-y-2">
                  <p className="text-xs font-black uppercase text-on-surface/40 tracking-tighter">Demo Safe</p>
                  <p className="text-sm text-foreground/80">Use the demo workspace to show real flows without putting live customer data at risk.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 3. FEATURE CHECKLIST */}
        <TabsContent value="features">
          <Card className="border-outline-variant/20 bg-surface/40">
            <CardHeader>
              <CardTitle>Complete Feature Arsenal</CardTitle>
              <CardDescription>Everything needed to run a modern multi-team business.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                    <Users className="w-4 h-4" /> Relationships
                  </div>
                  <ul className="space-y-2">
                    <FeatureItem label="Customer CRM" />
                    <FeatureItem label="Supplier Portal" />
                    <FeatureItem label="Staff Role Management" />
                    <FeatureItem label="Invite-based Joining" />
                  </ul>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                    <Package className="w-4 h-4" /> Operations
                  </div>
                  <ul className="space-y-2">
                    <FeatureItem label="Multi-Warehouse Inventory" />
                    <FeatureItem label="SKU & Category Tracking" />
                    <FeatureItem label="Stock Movement Logs" />
                    <FeatureItem label="Low Stock Alerts" />
                  </ul>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                    <ShoppingCart className="w-4 h-4" /> Commercials
                  </div>
                  <ul className="space-y-2">
                    <FeatureItem label="GST Sales Invoices" />
                    <FeatureItem label="Purchase Bill Recording" />
                    <FeatureItem label="Quotations / Estimations" />
                    <FeatureItem label="Sales Returns Tracking" />
                  </ul>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                    <LineChart className="w-4 h-4" /> Financials
                  </div>
                  <ul className="space-y-2">
                    <FeatureItem label="Bank/Cash Ledgers" />
                    <FeatureItem label="Expense Categorization" />
                    <FeatureItem label="Payment Receipting" />
                    <FeatureItem label="Profit/Loss Reports" />
                  </ul>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                    <Globe className="w-4 h-4" /> Integrations
                  </div>
                  <ul className="space-y-2">
                    <FeatureItem label="Daraz Seller Center" />
                    <FeatureItem label="Shopify Store Sync" />
                    <FeatureItem label="WooCommerce Support" />
                    <FeatureItem label="Excel/CSV Bulk Import" />
                  </ul>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                    <Settings className="w-4 h-4" /> Administration
                  </div>
                  <ul className="space-y-2">
                    <FeatureItem label="Platform Ops Command" />
                    <FeatureItem label="SaaS Subscription Gating" />
                    <FeatureItem label="Audit Logs (Security)" />
                    <FeatureItem label="Notification Center" />
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. SALES, PRICING & FAQ */}
        <TabsContent value="sales" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <PricingCard tier="Starter" price="3,000" features={["1 Branch", "3 Users", "Core ERP Only"]} />
            <PricingCard tier="Business" price="7,000" features={["3 Branches", "10 Users", "All Integrations", "Reports"]} highlighted />
            <PricingCard tier="Pro" price="15,000" features={["Unlimited Branches", "Unlimited Users", "Premium Support"]} />
          </div>

          <Card className="border-outline-variant/20 bg-surface/40 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-400" />
                Objections & FAQ
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <FAQItem 
                q="Why not just use Odoo?" 
                a="Odoo is powerful, but it can be complex and expensive for many growing teams. WhatsQuery is simpler to roll out, faster to adopt, and easier to tailor to day-to-day operations." 
              />
              <FAQItem 
                q="Can we import our existing Excel data?" 
                a="Absolutely. We have a robust CSV import tool for products, customers, and inventory to get you running in minutes." 
              />
              <FAQItem 
                q="Does it actually sync with Daraz?" 
                a="Yes. Our Daraz adapter pulls orders and syncs inventory automatically, so you don't oversell." 
              />
              <FAQItem 
                q="Is our data safe?" 
                a="We use encrypted connections, daily backups, and tenant isolation so your data is never visible to anyone else." 
              />
              <FAQItem 
                q="What if I have multiple branches?" 
                a="Our system is multi-branch by default. You can see consolidated reports or filter by specific city/warehouse." 
              />
              <FAQItem 
                q="Can you customize it for our business?" 
                a="We offer an Enterprise tier where we can build custom features or integrations specifically for your workflow." 
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="text-center pb-10">
        <p className="text-xs text-muted-foreground uppercase tracking-[0.2em]">Internal Use Only • WhatsQuery Platform</p>
      </div>
    </div>
  );
}

function FeatureItem({ label }: { label: string }) {
  return (
    <li className="flex items-center gap-2 text-sm text-foreground/70">
      <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
      {label}
    </li>
  );
}

function FAQItem({ q, a }: { q: string, a: string }) {
  return (
    <div className="space-y-1">
      <p className="font-bold text-sm text-on-surface/90">Q: {q}</p>
      <p className="text-sm text-muted-foreground leading-snug">{a}</p>
    </div>
  );
}

function PricingCard({ tier, price, features, highlighted = false }: { tier: string, price: string, features: string[], highlighted?: boolean }) {
  return (
    <Card className={`border-outline-variant/20 transition-all duration-300 ${highlighted ? 'bg-indigo-600/10 border-indigo-500/50 scale-105 shadow-indigo-500/10 shadow-2xl' : 'bg-surface/40 hover:bg-surface-container-low'}`}>
      <CardHeader className="text-center p-4">
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{tier}</p>
        <div className="mt-2 flex items-baseline justify-center gap-1">
          <span className="text-lg font-bold text-muted-foreground">Rs.</span>
          <span className="text-3xl font-black text-on-surface">{price}</span>
          <span className="text-xs font-medium text-muted-foreground">/mo</span>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <ul className="space-y-2 mb-4">
          {features.map(f => (
            <li key={f} className="flex items-center justify-center gap-2 text-xs text-foreground/70">
              <CheckCircle2 className="w-3 h-3 text-indigo-400" />
              {f}
            </li>
          ))}
        </ul>
        {highlighted && <Badge className="w-full justify-center bg-indigo-500 hover:bg-indigo-600 text-[10px] font-black uppercase">Most Popular</Badge>}
      </CardContent>
    </Card>
  );
}

