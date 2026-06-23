"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

export function TenantSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [type, setType] = useState(searchParams.get("type") || "ALL");

  const updateSearch = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (type !== "ALL") params.set("type", type);
    router.push(`/voice/admin/tenants?${params.toString()}`);
  }, [search, type, router]);

  return (
    <div className="flex items-center gap-3">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && updateSearch()}
        placeholder="Search organizations..."
        className="text-sm border border-slate-200 dark:border-slate-700 rounded-md py-2 px-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white w-64 shadow-sm"
      />
      <select
        value={type}
        onChange={(e) => {
          setType(e.target.value);
          // immediately trigger search on select change
          const params = new URLSearchParams();
          if (search) params.set("search", search);
          if (e.target.value !== "ALL") params.set("type", e.target.value);
          router.push(`/voice/admin/tenants?${params.toString()}`);
        }}
        className="text-sm border border-slate-200 dark:border-slate-700 rounded-md py-2 px-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
      >
        <option value="ALL">All Types</option>
        <option value="DEMO">Demo</option>
        <option value="TRIAL">Trial</option>
        <option value="PAID">Paid</option>
      </select>
      <button
        onClick={updateSearch}
        className="text-sm font-medium bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-4 py-2 rounded-md shadow-sm hover:bg-slate-800 dark:hover:bg-white transition-colors"
      >
        Search
      </button>
    </div>
  );
}
