import { FileDown } from "lucide-react";
import { ExportRequestClient } from "./ExportRequestClient";

export default function ExportSettingsPage() {
  return (
    <div className="space-y-8 p-8 text-white">
      <section className="space-y-2">
        <div className="flex items-center gap-2 text-primary">
          <FileDown className="h-4 w-4" />
          <p className="text-[10px] font-black uppercase tracking-widest">Data export</p>
        </div>
        <h1 className="text-3xl font-black uppercase italic tracking-tighter">Request an approved export</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Direct tenant export URLs are locked. Submit a request and a platform admin will approve limited downloads.
        </p>
      </section>
      <ExportRequestClient />
    </div>
  );
}
