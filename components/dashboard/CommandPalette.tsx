"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Users,
  Package,
  FileText,
  PlusCircle,
  ArrowRight,
  Loader2,
  Command as CommandIcon
} from "lucide-react";

import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { globalSearchAction, SearchResult } from "@/modules/search/actions";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const debouncedQuery = useDebounce(query, 300);
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  React.useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      try {
        const data = await globalSearchAction(debouncedQuery);
        setResults(data);
        setSelectedIndex(0);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [debouncedQuery]);

  const onSelect = (url: string) => {
    router.push(url);
    setOpen(false);
    setQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      onSelect(results[selectedIndex].url);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-container-low border border-outline-variant/30 hover:bg-surface-container transition-colors text-on-surface-variant/60"
      >
        <Search className="w-4 h-4" />
        <span className="text-xs font-medium">Quick Search...</span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden border-outline-variant/30 bg-surface shadow-2xl rounded-3xl gap-0 top-[20%] translate-y-0">
          <div className="flex items-center border-b border-outline-variant/20 px-4 h-14 gap-3">
            <Search className="w-5 h-5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search customers, products, invoices or actions..."
              className="border-0 focus-visible:ring-0 text-base h-full px-0 bg-transparent placeholder:text-muted-foreground/50"
              autoFocus
            />
            {loading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
            <Badge variant="outline" className="text-[10px] uppercase font-black tracking-widest opacity-40">ESC to close</Badge>
          </div>

          <div className="max-h-[400px] overflow-y-auto p-2 scrollbar-thin">
            {query.length < 2 && !loading && (
              <div className="p-8 text-center space-y-4">
                <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center mx-auto">
                   <CommandIcon className="w-6 h-6 text-primary/40" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-on-surface uppercase tracking-widest italic">Command Navigator</p>
                  <p className="text-xs text-on-surface-variant">Type at least 2 characters to trigger the deep search engine.</p>
                </div>
                <div className="flex items-center justify-center gap-4 pt-2">
                   <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-muted-foreground">
                      <Users className="w-3 h-3" /> Customers
                   </div>
                   <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-muted-foreground">
                      <Package className="w-3 h-3" /> Products
                   </div>
                   <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-muted-foreground">
                      <FileText className="w-3 h-3" /> Invoices
                   </div>
                </div>
              </div>
            )}

            {results.length > 0 && (
              <div className="space-y-1">
                {results.map((result, index) => (
                  <button
                    key={result.id}
                    onClick={() => onSelect(result.url)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all group",
                      selectedIndex === index 
                        ? "bg-primary/10 border border-primary/20" 
                        : "border border-transparent hover:bg-surface-container-low"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-outline-variant/30",
                        selectedIndex === index ? "bg-primary/20 border-primary/30" : "bg-surface-container-low"
                      )}>
                        {result.type === "customer" && <Users className="w-5 h-5 text-on-surface/40 group-hover:text-primary transition-colors" />}
                        {result.type === "product" && <Package className="w-5 h-5 text-on-surface/40 group-hover:text-primary transition-colors" />}
                        {result.type === "sale" && <FileText className="w-5 h-5 text-on-surface/40 group-hover:text-primary transition-colors" />}
                        {result.type === "action" && <PlusCircle className="w-5 h-5 text-primary" />}
                      </div>
                      <div>
                        <p className={cn(
                          "text-sm font-black uppercase tracking-tight",
                          selectedIndex === index ? "text-primary" : "text-on-surface"
                        )}>
                          {result.title}
                        </p>
                        {result.subtitle && (
                          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mt-0.5">
                            {result.subtitle}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className={cn(
                      "transition-all",
                      selectedIndex === index ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
                    )}>
                       <ArrowRight className="w-4 h-4 text-primary" />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {query.length >= 2 && results.length === 0 && !loading && (
              <div className="p-12 text-center">
                 <p className="text-sm text-muted-foreground font-medium italic">No matches found for "{query}" in the active cluster.</p>
              </div>
            )}
          </div>

          <div className="bg-surface-container-low/50 border-t border-outline-variant/20 p-3 px-4 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
             <div className="flex items-center gap-4 shrink-0">
                <div className="flex items-center gap-1">
                   <kbd className="h-4 px-1 rounded bg-muted text-[9px] font-black">↑↓</kbd>
                   <span className="text-[9px] font-black uppercase text-muted-foreground">Navigate</span>
                </div>
                <div className="flex items-center gap-1">
                   <kbd className="h-4 px-1 rounded bg-muted text-[9px] font-black">↵</kbd>
                   <span className="text-[9px] font-black uppercase text-muted-foreground">Select</span>
                </div>
             </div>
             <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 whitespace-nowrap text-right hidden sm:block">Powered by WhatsQuery AI Engine</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
