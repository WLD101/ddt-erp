import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateClientForm } from "@/app/wq-command-center/create-client-form";

export default function PlatformNewClientPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 p-8 text-on-surface">
      <section className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-primary">Add new client</p>
        <h1 className="text-4xl font-black uppercase italic tracking-tighter">Provision a new workspace</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Create a customer workspace, assign the correct package, and decide whether the account starts as paid or demo.
        </p>
      </section>

      <Card className="rounded-[28px] border border-outline-variant/30 bg-surface shadow-soft">
        <CardHeader className="border-b border-outline-variant/10 bg-surface px-6 pb-5 pt-6">
          <CardTitle className="text-sm font-black uppercase tracking-[0.12em] text-on-surface">Client provisioning</CardTitle>
          <CardDescription className="text-sm font-medium text-on-surface-variant">
            This reuses the same command-center provisioning workflow so tenant creation behavior stays consistent.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-6">
          <CreateClientForm />
        </CardContent>
      </Card>
    </div>
  );
}
