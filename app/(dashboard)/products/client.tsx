"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal, Pencil, Trash2, Tag, LayoutGrid } from "lucide-react";
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

interface ProductWithCategory {
  id: string;
  name: string;
  sku: string | null;
  unitPrice: number;
  costPrice: number;
  categoryId: string | null;
  category: { name: string } | null;
}

interface ProductClientProps {
  initialProducts: ProductWithCategory[];
  categories: { id: string; name: string }[];
}

export function ProductClient({ initialProducts, categories }: ProductClientProps) {
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
    <div className="space-y-6 flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tighter text-white uppercase">Product Catalog</h2>
          <p className="text-muted-foreground text-xs font-medium italic mt-1">
            Centrally managed master list of goods and digital assets
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="border-white/5 bg-white/5 hover:bg-white/10"
            onClick={() => setOpenCategory(true)}
          >
            <Tag className="w-4 h-4 mr-2" />
            Taxonomy
          </Button>
          <Button onClick={handleCreate} className="shadow-[0_10px_20px_-10px_rgba(124,58,237,0.5)]">
            <Plus className="w-4 h-4 mr-2" />
            Integrate Product
          </Button>
        </div>
      </div>

      <div className="border rounded-2xl bg-white/5 backdrop-blur-sm shadow-2xl flex-1 overflow-auto border-white/10">
        <Table>
          <TableHeader className="bg-white/5 sticky top-0 z-10">
            <TableRow className="border-white/10 hover:bg-transparent uppercase text-[10px] font-black tracking-[0.2em] text-muted-foreground">
              <TableHead className="py-5 pl-8">SKU / ID</TableHead>
              <TableHead>Commercial Name</TableHead>
              <TableHead>Categorization</TableHead>
              <TableHead className="text-right">Unit Rate ($)</TableHead>
              <TableHead className="text-right">Aquisition ($)</TableHead>
              <TableHead className="text-right pr-8">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialProducts.map((p) => (
              <TableRow key={p.id} className="border-white/5 group hover:bg-white/5 transition-colors duration-300">
                <TableCell className="font-mono text-[10px] text-muted-foreground pl-8 py-4 uppercase tracking-tighter">
                  {p.sku || "UNASSIGNED"}
                </TableCell>
                <TableCell className="font-bold text-white">{p.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="w-3 h-3 text-muted-foreground/40" />
                    <span className="text-xs font-medium text-muted-foreground">
                      {p.category?.name || "Unclassified"}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-black text-white">
                  ${p.unitPrice.toFixed(2)}
                </TableCell>
                <TableCell className="text-right text-muted-foreground/60 font-medium">
                  ${p.costPrice.toFixed(2)}
                </TableCell>
                <TableCell className="text-right pr-8">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-900 border-white/10">
                      <DropdownMenuItem onClick={() => handleEdit(p)} className="gap-2 cursor-pointer font-bold">
                        <Pencil className="w-4 h-4 text-primary" /> Edit Specs
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDeletingProduct(p)} className="gap-2 cursor-pointer text-rose-500 font-bold">
                        <Trash2 className="w-4 h-4" /> Purge Catalog
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {initialProducts.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-20 text-muted-foreground font-medium italic">
                  Catalog is currently empty.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Product Dialog */}
      <Dialog open={openProduct} onOpenChange={setOpenProduct}>
        <DialogContent className="max-w-3xl bg-slate-950 border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-black text-white tracking-widest uppercase">
              {editingProduct ? "Modify Product Specs" : "Catalog Integration"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-medium italic">
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

      {/* Category Dialog */}
      <Dialog open={openCategory} onOpenChange={setOpenCategory}>
        <DialogContent className="max-w-md bg-slate-950 border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-black text-white tracking-widest uppercase">
              Establish Taxonomy
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-medium italic">
              Create a new category for catalog organization
            </DialogDescription>
          </DialogHeader>
          <CategoryForm 
            onSuccess={() => setOpenCategory(false)} 
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingProduct} onOpenChange={(o) => !o && setDeletingProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Critical Action: Purge Catalog Item</AlertDialogTitle>
            <AlertDialogDescription>
              Warning: Deleting "{deletingProduct?.name}" will remove it from future manifests and analysis. Stock movement history will be archived but the product definition will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abort Operation</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-rose-500 hover:bg-rose-600 font-black tracking-widest uppercase"
            >
              {isDeleting ? "Purging..." : "Confirm Purge"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
