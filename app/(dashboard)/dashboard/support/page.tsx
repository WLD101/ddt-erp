import Image from "next/image";

import { SupportForm } from "@/components/help/SupportForm";

export default function TenantSupportPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-6 py-10 text-on-surface">
      <section className="overflow-hidden rounded-[34px] border border-outline-variant/30 bg-linear-to-br from-surface via-surface to-surface-container-low shadow-soft">
        <div className="grid gap-8 p-8 lg:grid-cols-[1fr,260px] lg:items-center">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">Tenant Support</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-on-surface">Need help from WhatsQuery?</h1>
            <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-on-surface-variant">
              Submit a ticket with the reason, priority, and details. Our admin team will see which tenant raised the issue automatically,
              including your workspace context.
            </p>
          </div>
          <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-full border border-primary/10 bg-primary/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
            <Image src="/whatsquery-support-icon.png" alt="WhatsQuery Support" width={160} height={160} className="object-contain" />
          </div>
        </div>
      </section>

      <SupportForm />
    </div>
  );
}
