import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="control"
      className={cn(
        // Keep multiline fields on the same contrast-safe token system as inputs and selects.
        "flex min-h-[100px] w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-on-surface transition-all outline-none placeholder:text-on-surface-variant/70 focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:pointer-events-none disabled:border-outline-variant/60 disabled:bg-surface-container disabled:text-on-surface-variant/70 disabled:opacity-100 md:text-sm shadow-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
