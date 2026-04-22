import { PackageOpen } from "lucide-react";
import { getPlatformPackages } from "@/modules/packages/actions";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeactivatePackageButton, PackageAdminClient } from "./PackageAdminClient";

export const dynamic = "force-dynamic";

export default async function PlatformPackagesPage() {
  const packages = await getPlatformPackages();

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-8 text-white">
      <section className="space-y-2">
        <div className="flex items-center gap-2 text-primary">
          <PackageOpen className="h-4 w-4" />
          <p className="text-[10px] font-black uppercase tracking-widest">Package operations</p>
        </div>
        <h1 className="text-4xl font-black uppercase italic tracking-tighter">Plans and limits</h1>
        <p className="text-sm text-muted-foreground">Create packages, deactivate old offers, and keep assignment counts visible.</p>
      </section>

      <PackageAdminClient />

      <div className="overflow-hidden rounded-lg border border-white/10 bg-black/40">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead>Name</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Users</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assignments</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {packages.map((pkg) => (
              <TableRow key={pkg.id} className="border-white/10">
                <TableCell className="font-bold text-white">{pkg.name}</TableCell>
                <TableCell className="text-muted-foreground">{pkg.businessSize || "Custom"}</TableCell>
                <TableCell>{pkg.userLimit}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={pkg.isActive ? "border-emerald-500/30 text-emerald-400" : "border-rose-500/30 text-rose-400"}>
                    {pkg.isActive ? "Active" : "Inactive"}
                  </Badge>
                  {pkg.isCustom ? <Badge variant="outline" className="ml-2 border-primary/30 text-primary">Custom</Badge> : null}
                </TableCell>
                <TableCell>{pkg._count.assignments}</TableCell>
                <TableCell className="text-right">{pkg.isActive ? <DeactivatePackageButton id={pkg.id} /> : null}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
