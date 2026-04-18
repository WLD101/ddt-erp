// app/(dashboard)/inventory/inventory-client.tsx
"use client";

import React, { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  Filter, 
  CheckCircle2, 
  BarChart2, 
  ArrowRight,
  Plus,
  MoreHorizontal,
  Pencil
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProductForm } from "@/modules/products/components/product-form";

interface InventoryItem {
  id: string;
  quantity: number;
  location: string | null;
  productId: string;
  product: {
    id: string;
    name: string;
    sku: string | null;
    unitPrice: number;
    costPrice: number;
    categoryId: string | null;
    lowStockThreshold: number;
  };
}

export function InventoryClient({ items, categories }: { items: InventoryItem[], categories: any[] }) {
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [open, setOpen] = useState(false);

  const filteredItems = showLowStockOnly 
    ? items.filter(item => item.quantity <= item.product.lowStockThreshold)
    : items;

  const lowStockCount = items.filter(item => item.quantity <= item.product.lowStockThreshold).length;

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* ... KPI Cards section remains same ... */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="p-4 rounded-xl border border-white/5 bg-background/50 backdrop-blur-md flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Skus</p>
            <h3 className="text-2xl font-bold mt-1">{items.length}</h3>
          </div>
          <div className="p-2 bg-primary/10 rounded-lg">
             <BarChart2 className="w-5 h-5 text-primary" />
          </div>
        </div>
        <div className={cn(
          "p-4 rounded-xl border backdrop-blur-md flex items-center justify-between transition-colors",
          lowStockCount > 0 ? "border-rose-500/20 bg-rose-500/5" : "border-white/5 bg-background/50"
        )}>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Low Stock Alerts</p>
            <h3 className={cn("text-2xl font-bold mt-1", lowStockCount > 0 ? "text-rose-500" : "text-foreground")}>
              {lowStockCount}
            </h3>
          </div>
          <div className={cn("p-2 rounded-lg", lowStockCount > 0 ? "bg-rose-500/20" : "bg-white/5")}>
             <AlertTriangle className={cn("w-5 h-5", lowStockCount > 0 ? "text-rose-500" : "text-muted-foreground")} />
          </div>
        </div>
        <div className="p-4 rounded-xl border border-white/5 bg-background/50 backdrop-blur-md flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Inventory Health</p>
            <h3 className="text-2xl font-bold mt-1">
              {items.length > 0 ? Math.round(((items.length - lowStockCount) / items.length) * 100) : 100}%
            </h3>
          </div>
          <div className="p-2 bg-emerald-500/10 rounded-lg">
             <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/5">
        <div className="flex items-center gap-4">
          <Button 
            variant={showLowStockOnly ? "destructive" : "outline"} 
            size="sm"
            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            className="h-9 font-semibold"
          >
            <Filter className="w-4 h-4 mr-2" />
            {showLowStockOnly ? "Showing Low Stock Only" : "Filter by Low Stock"}
          </Button>
          {showLowStockOnly && (
            <p className="text-xs text-rose-500 font-medium animate-pulse">
              Only showing items below safety thresholds
            </p>
          )}
        </div>
        <div className="text-xs text-muted-foreground font-medium flex items-center gap-4">
           Showing {filteredItems.length} of {items.length} items
        </div>
      </div>

      <div className="border rounded-xl bg-background/30 backdrop-blur-sm overflow-hidden shadow-2xl">
        <Table>
          <TableHeader className="bg-white/5 uppercase text-[10px] font-black tracking-[0.2em] text-muted-foreground">
            <TableRow className="hover:bg-transparent border-white/10">
              <TableHead className="py-4 pl-8">Product Name</TableHead>
              <TableHead>SKU Identifier</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="text-right">Risk Limit</TableHead>
              <TableHead className="text-right">On Hand</TableHead>
              <TableHead className="text-right pr-8">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => {
              const isLowStock = item.quantity <= item.product.lowStockThreshold;
              return (
                <TableRow 
                  key={item.id}
                  className={cn(
                    "group transition-colors border-white/5",
                    isLowStock ? "bg-rose-500/5 hover:bg-rose-500/10" : "hover:bg-white/5"
                  )}
                >
                  <TableCell className="font-bold text-white pl-8 py-4">
                    <div className="flex items-center gap-3">
                      {isLowStock && <AlertTriangle className="w-3.5 h-3.5 text-rose-500 animate-pulse" />}
                      {item.product.name}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-[10px] text-muted-foreground/60 tracking-tighter uppercase">{item.product.sku || "-"}</TableCell>
                  <TableCell className="text-xs font-semibold">{item.location || "-"}</TableCell>
                  <TableCell className="text-right text-muted-foreground font-bold">
                    {item.product.lowStockThreshold}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={cn(
                      "inline-flex items-center justify-center min-w-[3.5rem] px-3 py-1 rounded-full font-black text-xs",
                      isLowStock 
                        ? "bg-rose-500/20 text-rose-500 ring-1 ring-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.3)]" 
                        : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                    )}>
                      {item.quantity}
                    </span>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                     <DropdownMenu>
                       <DropdownMenuTrigger asChild>
                         <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all">
                           <MoreHorizontal className="w-4 h-4" />
                         </Button>
                       </DropdownMenuTrigger>
                       <DropdownMenuContent align="end" className="bg-slate-900 border-white/10">
                         <DropdownMenuItem onClick={() => handleEdit(item.product)} className="gap-2 cursor-pointer font-bold">
                            <Pencil className="w-4 h-4 text-primary" /> Edit Definition
                         </DropdownMenuItem>
                       </DropdownMenuContent>
                     </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
            
            {filteredItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-4 bg-emerald-500/10 rounded-full mb-2 border border-emerald-500/10">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                    </div>
                    <p className="font-black text-white uppercase tracking-widest text-xs">Thresholds Satisfied</p>
                    <p className="text-[10px] italic">No active inventory depletion alerts recorded.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl bg-slate-950 border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-black text-white tracking-widest uppercase">
              Edit Product Definition
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-medium italic">
              Adjusting metadata and safety limits for this hardware/SKU
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[75vh] overflow-auto px-1">
            <ProductForm 
              categories={categories}
              initialData={editingProduct} 
              onSuccess={() => setOpen(false)} 
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
    </div>
  );
}
