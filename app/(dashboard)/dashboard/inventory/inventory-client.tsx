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
import { Card, CardContent } from "@/components/ui/card";

interface InventoryItem {
  id: string;
  quantity: number;
  location: string | null;
  productId: string;
  product: {
    id: string;
    name: string;
    sku: string | null;
    unit: string | null;
    unitType: string | null;
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex justify-end">
        <Button
          variant={showLowStockOnly ? "destructive" : "outline"}
          size="sm"
          onClick={() => setShowLowStockOnly(!showLowStockOnly)}
          className="h-10 rounded-xl px-5 text-[10px] font-black uppercase tracking-widest"
        >
          <span className="material-symbols-outlined text-[18px] mr-2">
            {showLowStockOnly ? "filter_list_off" : "warning"}
          </span>
          {showLowStockOnly ? "Show All Stock" : "Low Stock Only"}
        </Button>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <MetricCard 
          title="Total SKU Manifest" 
          value={items.length} 
          icon="inventory_2" 
          color="text-primary" 
          bgColor="bg-primary/5" 
          description="Total tracked assets"
        />
        <MetricCard 
          title="Stock Exceptions" 
          value={lowStockCount} 
          icon="report_problem" 
          color={lowStockCount > 0 ? "text-error" : "text-secondary"} 
          bgColor={lowStockCount > 0 ? "bg-error/5" : "bg-secondary/5"} 
          description="Below safety threshold"
        />
        <MetricCard 
          title="Operational Health" 
          value={`${items.length > 0 ? Math.round(((items.length - lowStockCount) / items.length) * 100) : 100}%`} 
          icon="verified" 
          color="text-secondary" 
          bgColor="bg-secondary/5" 
          description="Grid reliability index"
        />
      </div>

      <div className="bg-surface border border-outline-variant/30 rounded-3xl overflow-hidden shadow-soft">
        <Table>
          <TableHeader>
            <tr className="bg-surface-container-lowest border-b border-outline-variant/10">
              <th className="px-8 py-5 text-left text-[10px] font-black text-on-surface-variant/60 uppercase tracking-widest">Asset Definition</th>
              <th className="px-8 py-5 text-left text-[10px] font-black text-on-surface-variant/60 uppercase tracking-widest">SKU Node</th>
              <th className="px-8 py-5 text-left text-[10px] font-black text-on-surface-variant/60 uppercase tracking-widest">Storage Loc</th>
              <th className="px-8 py-5 text-right text-[10px] font-black text-on-surface-variant/60 uppercase tracking-widest">Risk Limit</th>
              <th className="px-8 py-5 text-right text-[10px] font-black text-on-surface-variant/60 uppercase tracking-widest">Telemetry</th>
              <th className="px-8 py-5 text-right text-[10px] font-black text-on-surface-variant/60 uppercase tracking-widest pr-10">Action</th>
            </tr>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => {
              const isLowStock = item.quantity <= item.product.lowStockThreshold;
              return (
                <TableRow 
                  key={item.id}
                  className={cn(
                    "group transition-all duration-300",
                    isLowStock ? "bg-error/[0.01]" : "hover:bg-surface-container-low/20"
                  )}
                >
                  <TableCell className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      {isLowStock && <span className="material-symbols-outlined text-error text-[18px] animate-pulse">report</span>}
                      <span className="text-sm font-black text-on-surface tracking-tight group-hover:text-primary transition-colors">
                        {item.product.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-8 py-6">
                    <span className="font-mono text-[10px] font-black text-on-surface-variant tracking-[0.1em] bg-surface-container px-2 py-0.5 rounded-md">
                      {item.product.sku || "UNMAPPED"}
                    </span>
                  </TableCell>
                  <TableCell className="px-8 py-6 text-[11px] font-medium text-on-surface-variant italic">
                    {item.location || "Centralized Grid"}
                  </TableCell>
                  <TableCell className="px-8 py-6 text-right text-[11px] font-black text-on-surface-variant/40">
                    {item.product.lowStockThreshold}
                  </TableCell>
                  <TableCell className="px-8 py-6 text-right">
                    <span className={cn(
                      "inline-flex items-center justify-center min-w-[3rem] px-3 py-1 rounded-lg font-black text-[11px] tracking-tighter border",
                      isLowStock 
                        ? "bg-error/10 text-error border-error/20" 
                        : "bg-secondary/10 text-secondary border-secondary/20"
                    )}>
                      {item.quantity} {item.product.unit || "piece"}
                    </span>
                  </TableCell>
                  <TableCell className="px-8 py-6 text-right pr-10">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="h-9 w-9 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity border border-outline-variant/30 hover:bg-surface flex items-center justify-center">
                          <span className="material-symbols-outlined text-[18px]">more_vert</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-2xl border-outline-variant/30 shadow-xl p-2 bg-surface">
                          <DropdownMenuItem onClick={() => handleEdit(item.product)} className="gap-3 cursor-pointer font-black text-[10px] uppercase tracking-widest p-3 rounded-xl focus:bg-primary/5 focus:text-primary">
                             <span className="material-symbols-outlined text-[18px]">edit_note</span> 
                             Modify Definition
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
            
            {filteredItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-24">
                  <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 bg-surface-container rounded-3xl flex items-center justify-center text-on-surface-variant/20">
                      <span className="material-symbols-outlined text-4xl">check_circle</span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-black text-on-surface uppercase tracking-widest">Protocol Satisfied</p>
                      <p className="text-[10px] font-medium text-on-surface-variant/60 italic">No inventory depletion alerts detected in current node.</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl rounded-[32px] p-8 border-outline-variant/30 shadow-2xl bg-surface overflow-hidden">
          <DialogHeader className="mb-8 border-b border-outline-variant/10 pb-6">
            <DialogTitle className="text-xl font-black text-on-surface tracking-tight font-headline-sm flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                <span className="material-symbols-outlined text-primary text-[24px]">manufacturing</span>
              </div>
              Modify Asset Definition
            </DialogTitle>
            <DialogDescription className="text-xs font-medium text-on-surface-variant italic mt-1">
              Adjusting technical metadata and organizational safety protocols for this SKU node.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-auto px-1 custom-scrollbar">
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

function MetricCard({ title, value, icon, color, bgColor, description }: { title: string; value: string | number; icon: string; color: string; bgColor: string; description: string }) {
  return (
    <Card className="rounded-[32px] border border-outline-variant/30 shadow-soft bg-surface overflow-hidden">
      <CardContent className="p-8 flex items-center justify-between">
        <div>
          <p className="text-[9px] font-black text-on-surface-variant/40 uppercase tracking-[0.2em]">{title}</p>
          <h3 className={cn("text-3xl font-black tracking-tighter mt-1", color)}>{value}</h3>
          <p className="text-[10px] font-medium text-on-surface-variant/60 mt-1 italic">{description}</p>
        </div>
        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border border-outline-variant/10 shadow-sm", bgColor)}>
           <span className={cn("material-symbols-outlined text-[28px]", color)}>{icon}</span>
        </div>
      </CardContent>
    </Card>
  );
}

