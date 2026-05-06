import { ExportRequestClient } from "./ExportRequestClient";

export default function ExportSettingsPage() {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <section className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shadow-soft">
            <span className="material-symbols-outlined text-primary text-[32px]">ios_share</span>
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-on-surface font-headline-md uppercase">
              Data <span className="text-primary">Extraction</span>
            </h2>
            <p className="text-on-surface-variant text-sm font-medium mt-1 font-body-md italic">
              Direct tenant export URLs are secured. Submit a retrieval request for administrative authorization.
            </p>
          </div>
        </div>
      </section>
      
      <div className="bg-surface rounded-3xl border border-outline-variant/30 shadow-soft p-8">
        <ExportRequestClient />
      </div>

      <div className="p-6 bg-secondary/5 border border-secondary/10 rounded-3xl flex gap-4 text-xs font-medium text-on-surface-variant">
         <span className="material-symbols-outlined text-secondary text-[20px] shrink-0">encrypted</span>
         <p>
            <strong className="text-secondary font-black uppercase tracking-widest">Security Protocol:</strong> All exported manifests are cryptographically hashed and logged in the audit trail. Unauthorized data retrieval attempts are automatically flagged for review.
         </p>
      </div>
    </div>
  );
}
