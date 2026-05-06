import { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface PageShellProps {
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function PageShell({
  title,
  description,
  actions,
  children,
  className,
}: PageShellProps) {
  return (
    <div className={cn("flex h-full flex-col overflow-auto p-8 pb-10", className)}>
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-on-surface font-headline-md">
              {title}
            </h1>
            <p className="mt-2 text-sm font-medium text-on-surface-variant font-body-md">
              {description}
            </p>
          </div>
          {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
        </div>

        {children}
      </div>
    </div>
  );
}
