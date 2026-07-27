import Image from "next/image";
import Link from "next/link";

import { Logo } from "@/components/ui/logo";

type VoiceBrandProps = {
  href: string;
  caption?: string;
};

export function VoiceBrand({ href, caption = "AI Receptionist" }: VoiceBrandProps) {
  return (
    <Link href={href} className="inline-flex items-center gap-3">
      <Logo variant="horizontal" size="sm" dark={true} subtitle={caption} />
    </Link>
  );
}
