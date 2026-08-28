import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-xs font-medium cursor-pointer transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground antialiased shadow-sm hover:bg-primary/90",
        glow:
          "bg-gradient-to-r from-neutral-800 to-neutral-900 text-white shadow-md hover:brightness-110 border border-neutral-700",
        emerald:
          "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md hover:brightness-110 border border-emerald-400/30",
        destructive:
          "bg-destructive/90 text-destructive-foreground shadow-sm hover:bg-destructive",
        outline:
          "border border-border/80 bg-background/80 text-foreground shadow-xs hover:bg-secondary hover:text-foreground backdrop-blur-sm",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/40",
        ghost: "hover:bg-secondary/70 hover:text-foreground text-muted-foreground",
        link: "text-primary underline-offset-4 hover:underline rounded-none",
        olive:
          "bg-[#36533f] text-[#fdfcf7] antialiased shadow-sm hover:bg-[#2c4534]",
        chip:
          "bg-secondary/70 text-foreground border border-border/60 hover:bg-secondary",
        obsidian:
          "bg-card text-foreground border border-border/80 hover:border-border hover:bg-secondary shadow-inner-glow",
      },
      size: {
        default: "h-9 px-4 py-2 text-xs",
        xs: "h-7 rounded-full px-2.5 text-[11px]",
        sm: "h-8 rounded-full px-3 text-xs",
        lg: "h-11 rounded-full px-6 text-sm",
        icon: "h-8 w-8 rounded-full",
        iconSm: "h-7 w-7 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

