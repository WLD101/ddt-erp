import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        // Use ERP surface tokens here so forms stay readable across dark cards, modals, and tables.
        "h-9 w-full min-w-0 rounded-lg border border-outline-variant bg-surface-container-low px-3 py-1 text-on-surface transition-all outline-none placeholder:text-on-surface-variant/70 focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:pointer-events-none disabled:border-outline-variant/60 disabled:bg-surface-container disabled:text-on-surface-variant/70 disabled:opacity-100 md:text-sm shadow-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
