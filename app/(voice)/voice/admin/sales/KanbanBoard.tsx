"use client";

import { useState } from "react";
import { updateLeadStage } from "@/modules/sales-crm/actions";

type Lead = {
  id: string;
  companyName: string;
  contactName: string;
  phone: string;
  email: string | null;
  source: string;
  stage: string;
  createdAt: Date;
};

const STAGES = [
  { id: "new", label: "New Lead" },
  { id: "demo_booked", label: "Demo Booked" },
  { id: "demo_done", label: "Demo Done" },
  { id: "trial_started", label: "Trial Started" },
  { id: "negotiation", label: "Negotiation" },
  { id: "won", label: "Won" },
  { id: "lost", label: "Lost" },
];

export function KanbanBoard({ initialLeads }: { initialLeads: any[] }) {
  const [leads, setLeads] = useState<Lead[]>(
    initialLeads.map((l) => ({ ...l, stage: l.stage || "new" }))
  );
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStageChange = async (leadId: string, newStage: string) => {
    setIsUpdating(true);
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, stage: newStage } : l)));
    try {
      await updateLeadStage(leadId, newStage);
    } catch (e) {
      console.error("Failed to update stage", e);
      // Revert on error
      setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, stage: leads.find(ol => ol.id === leadId)?.stage || "new" } : l)));
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex w-full overflow-x-auto p-6 space-x-6 pb-8 snap-x">
      {STAGES.map((stage) => {
        const stageLeads = leads.filter((l) => l.stage === stage.id);
        return (
          <div key={stage.id} className="flex-shrink-0 w-80 bg-slate-100 dark:bg-slate-900/50 rounded-xl p-4 snap-center border border-slate-200/60 dark:border-slate-700/60 flex flex-col max-h-[700px]">
            <div className="flex justify-between items-center mb-4 px-1">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-wider">
                {stage.label}
              </h3>
              <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium px-2 py-0.5 rounded-full">
                {stageLeads.length}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
              {stageLeads.map((lead) => (
                <div key={lead.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow cursor-pointer group">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-slate-900 dark:text-white line-clamp-1">
                      {lead.companyName || lead.contactName || "Unknown"}
                    </h4>
                    <span className="text-[10px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-1.5 py-0.5 rounded">
                      {lead.source}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 space-y-1 mb-3">
                    <div className="flex items-center gap-1.5 truncate">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      {lead.contactName}
                    </div>
                    {lead.phone && (
                      <div className="flex items-center gap-1.5 truncate">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                        {lead.phone}
                      </div>
                    )}
                  </div>
                  <select
                    className="w-full text-xs border border-slate-200 dark:border-slate-700 rounded-md py-1 px-2 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 disabled:opacity-50"
                    value={lead.stage}
                    disabled={isUpdating}
                    onChange={(e) => handleStageChange(lead.id, e.target.value)}
                  >
                    {STAGES.map((s) => (
                      <option key={s.id} value={s.id}>Move to {s.label}</option>
                    ))}
                  </select>
                </div>
              ))}
              {stageLeads.length === 0 && (
                <div className="h-20 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                  <span className="text-xs text-slate-400">Empty</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
