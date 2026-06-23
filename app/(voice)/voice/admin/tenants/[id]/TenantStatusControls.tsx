"use client";

import { useState } from "react";
import { updateTenantStatus } from "@/modules/admin-tenants/actions";

export function TenantStatusControls({
  tenantId,
  accessStatus,
  lifecycleStatus,
}: {
  tenantId: string;
  accessStatus: string;
  lifecycleStatus: string;
}) {
  const [isUpdating, setIsUpdating] = useState(false);

  const toggleSuspend = async () => {
    const isSuspended = accessStatus === "suspended";
    const newAccess = isSuspended ? "active" : "suspended";
    const newLifeCycle = isSuspended ? "active" : "churned";

    if (!confirm(`Are you sure you want to ${isSuspended ? "activate" : "suspend"} this account?`)) return;

    setIsUpdating(true);
    try {
      await updateTenantStatus(tenantId, newAccess, newLifeCycle);
    } catch (e) {
      console.error(e);
      alert("Failed to update status.");
    } finally {
      setIsUpdating(false);
    }
  };

  const isSuspended = accessStatus === "suspended";

  return (
    <button
      onClick={toggleSuspend}
      disabled={isUpdating}
      className={`text-sm font-medium px-4 py-2 rounded-md shadow-sm transition-colors disabled:opacity-50 ${
        isSuspended
          ? "bg-emerald-600 text-white hover:bg-emerald-700"
          : "bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:hover:bg-rose-900/50"
      }`}
    >
      {isUpdating ? "Updating..." : isSuspended ? "Reactivate Account" : "Suspend Account"}
    </button>
  );
}
