"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProductForm } from "@/modules/products/components/product-form";
import { CategoryForm } from "@/modules/products/components/category-form";
import { deleteProduct } from "@/modules/products/actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PageShell } from "@/components/dashboard/page-shell";

interface ProductWithCategory {
  id: string;
  name: string;
  sku: string | null;
  unitPrice: number;
  costPrice: number;
  unit: string | null;
  unitType: string | null;
  categoryId: string | null;
  category: { name: string } | null;
  inventoryItems: { quantity: number }[];
}

interface ProductClientProps {
  initialProducts: ProductWithCategory[];
  categories: { id: string; name: string }[];
  canImport: boolean;
}

export function ProductClient({ initialProducts, categories, canImport }: ProductClientProps) {
  const [openProduct, setOpenProduct] = useState(false);
  const [openCategory, setOpenCategory] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithCategory | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<ProductWithCategory | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  const handleEdit = (product: ProductWithCategory) => {
    setEditingProduct(product);
    setOpenProduct(true);
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setOpenProduct(true);
  };

  const handleDelete = () => {
    if (!deletingProduct) return;
    startDeleteTransition(async () => {
      const result = await deleteProduct(deletingProduct.id);
      if (result.success) {
        toast.success("Product hardware/SKU purged from catalog");
        setDeletingProduct(null);
      } else {
        toast.error(result.error || "Failed to delete product");
      }
    });
  };

  return (
    <>
      <PageShell
        title="Products"
        description="Maintain your product catalog, category taxonomy, and pricing definitions in one place."
        actions={
          <>
            {canImport ? (
              <a
                href="/dashboard/imports?type=PRODUCTS"
                className="inline-flex h-10 items-center justify-center rounded-xl border border-outline-variant/30 bg-surface px-5 text-sm font-bold text-on-surface shadow-sm transition-colors hover:bg-surface-container-low"
              >
                <span className="material-symbols-outlined text-[18px] mr-2">upload</span>
                Import CSV
              </a>
            ) : null}
            <Button
              variant="outline"
              className="h-10 rounded-xl px-5 font-bold"
              onClick={() => setOpenCategory(true)}
            >
              <span className="material-symbols-outlined text-[18px] mr-2">sell</span>
              Categories
            </Button>
            <Button onClick={handleCreate} className="h-10 rounded-xl px-5 font-bold shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-[18px] mr-2">add_box</span>
              Add Product
            </Button>
          </>
        }
      >
        <div className="flex-1 overflow-auto rounded-3xl border border-outline-variant/30 bg-surface shadow-soft">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-8">SKU / ID</TableHead>
              <TableHead>Commercial Name</TableHead>
              <TableHead>Categorization</TableHead>
              <TableHead>Quantity / Unit</TableHead>
              <TableHead className="text-right">Unit Rate (Rs.)</TableHead>
              <TableHead className="text-right">Acquisition (Rs.)</TableHead>
              <TableHead className="text-right pr-8">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialProducts.map((p) => (
              <TableRow key={p.id} className="group transition-all duration-200">
                <TableCell className="font-mono text-[11px] text-on-surface-variant pl-8 py-4 uppercase tracking-wider">
                  {p.sku || "UNASSIGNED"}
                </TableCell>
                <TableCell className="font-bold text-on-surface">{p.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-outline">grid_view</span>
                    <span className="text-xs font-medium text-on-surface-variant">
                      {p.category?.name || "Unclassified"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-bold text-on-surface">
                      {(p.inventoryItems?.[0]?.quantity ?? 0).toLocaleString()}
                    </span>
                    <span className="text-[11px] text-on-surface-variant">
                      {p.unit || "piece"} • {(p.unitType || "RETAIL_QUANTITY").toLowerCase().replaceAll("_", " ")}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-black text-on-surface">
                  {(p.unitPrice ?? 0).toLocaleString()}
                </TableCell>
                <TableCell className="text-right text-on-surface-variant/60 font-medium">
                  {(p.costPrice ?? 0).toLocaleString()}
                </TableCell>
                <TableCell className="text-right pr-8">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="material-symbols-outlined text-[18px]">more_vert</span>
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end" className="bg-surface border-outline-variant shadow-lg rounded-xl">
                      <DropdownMenuItem onClick={() => handleEdit(p)} className="gap-2 cursor-pointer font-medium text-on-surface">
                        <span className="material-symbols-outlined text-[18px] text-primary">edit</span> Edit Specs
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDeletingProduct(p)} className="gap-2 cursor-pointer text-error font-medium">
                        <span className="material-symbols-outlined text-[18px]">delete</span> Purge Catalog
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {initialProducts.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-20 text-on-surface-variant font-medium italic">
                  Catalog is currently empty.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          </Table>
        </div>
      </PageShell>

      <Dialog open={openProduct} onOpenChange={setOpenProduct}>
        <DialogContent className="max-w-3xl bg-surface border-outline-variant rounded-3xl p-8 shadow-2xl overflow-hidden">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-black text-on-surface tracking-tight font-headline-sm">
              {editingProduct ? "Modify Product Specs" : "Catalog Integration"}
            </DialogTitle>
            <DialogDescription className="text-sm text-on-surface-variant font-medium mt-2">
              Define pricing, taxonomy, and inventory thresholds
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[75vh] overflow-auto px-1">
            <ProductForm 
              categories={categories}
              initialData={editingProduct} 
              onSuccess={() => setOpenProduct(false)} 
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={openCategory} onOpenChange={setOpenCategory}>
        <DialogContent className="max-w-md bg-surface border-outline-variant rounded-3xl p-8 shadow-2xl overflow-hidden">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-black text-on-surface tracking-tight font-headline-sm">
              Establish Taxonomy
            </DialogTitle>
            <DialogDescription className="text-sm text-on-surface-variant font-medium mt-2">
              Create a new category for catalog organization
            </DialogDescription>
          </DialogHeader>
          <CategoryForm 
            onSuccess={() => setOpenCategory(false)} 
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingProduct} onOpenChange={(o) => !o && setDeletingProduct(null)}>
        <AlertDialogContent className="rounded-2xl border-outline-variant bg-surface shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-on-surface font-black">Critical Action: Purge Catalog Item</AlertDialogTitle>
            <AlertDialogDescription className="text-on-surface-variant">
              Warning: Deleting "{deletingProduct?.name}" will remove it from future manifests. history will be archived but the definition will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Abort</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-error text-on-error hover:opacity-90 font-bold rounded-lg"
            >
              {isDeleting ? "Purging..." : "Confirm Purge"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

