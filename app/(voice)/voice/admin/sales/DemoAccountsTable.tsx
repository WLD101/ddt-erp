"use client";

import { useState } from "react";
import { convertDemoToPaid } from "@/modules/sales-crm/actions";
import Link from "next/link";

export function DemoAccountsTable({ accounts }: { accounts: any[] }) {
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const handleConvertToPaid = async (id: string) => {
    if (!confirm("Are you sure you want to convert this Demo/Trial account to a PAID customer?")) return;
    setIsUpdating(id);
    try {
      await convertDemoToPaid(id);
    } catch (e) {
      console.error(e);
      alert("Failed to convert account.");
    } finally {
      setIsUpdating(null);
    }
  };

  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-sm">
        No active Demo or Trial accounts found.
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-200 dark:divide-slate-700">
      {accounts.map((acc) => (
        <div key={acc.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between group">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Link href={`/voice/admin/tenants/${acc.id}`} className="font-medium text-slate-900 dark:text-white truncate hover:text-blue-600 dark:hover:text-blue-400">
                {acc.name}
              </Link>
              <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                acc.tenantType === "TRIAL" ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
              }`}>
                {acc.tenantType}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="truncate">{acc.email || "No email"}</span>
              <span className="truncate">{acc.phone || "No phone"}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 ml-4">
            <button
              onClick={() => handleConvertToPaid(acc.id)}
              disabled={isUpdating === acc.id}
              className="text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-md shadow-sm transition-colors disabled:opacity-50"
            >
              {isUpdating === acc.id ? "Converting..." : "Mark as Paid"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
