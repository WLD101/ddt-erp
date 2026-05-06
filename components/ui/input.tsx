import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-lg border border-outline-variant bg-white px-3 py-1 text-on-surface transition-all outline-none placeholder:text-outline/50 focus:border-primary focus:ring-4 focus:ring-primary/5 disabled:pointer-events-none disabled:opacity-50 md:text-sm shadow-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
