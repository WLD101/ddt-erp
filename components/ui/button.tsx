import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_.material-symbols-outlined]:text-[18px]",
  {
    variants: {
      variant: {
        default: "bg-primary text-on-primary hover:opacity-90 shadow-soft",
        outline:
          "border-outline-variant bg-surface hover:bg-surface-container-low text-on-surface transition-colors",
        secondary:
          "bg-secondary text-on-secondary hover:opacity-90 shadow-soft",
        ghost:
          "hover:bg-surface-container-low text-on-surface-variant hover:text-on-surface transition-colors",
        destructive:
          "bg-error text-on-error hover:opacity-90 shadow-soft",
        link: "text-primary underline-offset-4 hover:underline",
        "primary-container": "bg-primary-container text-on-primary hover:opacity-90 shadow-soft",
      },
      size: {
        default: "h-9 gap-2 px-4",
        xs: "h-7 gap-1 rounded-md px-2 text-xs",
        sm: "h-8 gap-1.5 rounded-md px-3 text-[0.85rem]",
        lg: "h-11 gap-2 px-6 text-base",
        icon: "size-9 rounded-lg",
        "icon-sm": "size-8 rounded-md",
        "icon-lg": "size-11 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
