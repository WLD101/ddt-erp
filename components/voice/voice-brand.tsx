import Image from "next/image";
import Link from "next/link";

type VoiceBrandProps = {
  href: string;
  caption?: string;
};

export function VoiceBrand({ href, caption = "AI Receptionist" }: VoiceBrandProps) {
  return (
    <Link href={href} className="inline-flex items-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white shadow-sm">
        <Image src="/logo-emblem.png" alt="WhatsQuery Voice" width={36} height={36} className="h-9 w-9 object-contain" />
      </div>
      <div>
        <div className="text-lg font-black tracking-tight text-white">WhatsQuery Voice</div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan-200/80">{caption}</div>
      </div>
    </Link>
  );
}
