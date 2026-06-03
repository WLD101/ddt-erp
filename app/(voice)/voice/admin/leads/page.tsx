import Link from "next/link";

export default function AdminLeadsPlaceholder() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center border-b border-outline-variant/20 pb-4">
        <h1 className="text-2xl font-black text-on-surface">Voice Leads</h1>
        <Link href="/voice/admin/command-center" className="text-sm font-bold text-primary hover:underline">
          &larr; Back to Command Center
        </Link>
      </div>
      <p>Placeholder for Voice Leads drill-down.</p>
    </div>
  );
}
