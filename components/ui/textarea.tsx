import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="control"
      className={cn(
        "flex min-h-[100px] w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-on-surface transition-all outline-none placeholder:text-outline/50 focus:border-primary focus:ring-4 focus:ring-primary/5 disabled:pointer-events-none disabled:opacity-50 md:text-sm shadow-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
