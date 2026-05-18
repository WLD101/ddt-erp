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
    <div className={cn("flex h-full flex-col overflow-auto px-5 py-6 pb-10 md:px-8 md:py-8 xl:px-10", className)}>
      <div className="wq-shell flex flex-1 flex-col space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="wq-page-title">
              {title}
            </h1>
            <p className="wq-page-copy mt-2">
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
