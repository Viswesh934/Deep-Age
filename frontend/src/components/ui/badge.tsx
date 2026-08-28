import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        secondary:
          "border-border/60 bg-secondary/80 text-secondary-foreground hover:bg-secondary",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90",
        outline: "text-foreground border-border/80 bg-background/50",
        success:
          "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-medium",
        warning:
          "border-amber-500/20 bg-amber-500/10 text-amber-800 dark:text-amber-300 font-medium",
        info:
          "border-sky-500/20 bg-sky-500/10 text-sky-800 dark:text-sky-300 font-medium",
        cyan:
          "border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 font-medium",
        glass:
          "border-border/60 bg-secondary/40 backdrop-blur-md text-foreground shadow-xs",
        neon:
          "border-emerald-500/40 bg-emerald-500/15 text-emerald-400 shadow-[0_0_12px_-2px_rgba(16,185,129,0.35)]",
        olive:
          "border-transparent bg-[#36533f]/10 text-[#36533f] dark:bg-[#528e5e]/20 dark:text-[#74b684] font-medium",
        "chip-email":
          "border-transparent bg-[#ffdbdc] text-[#7a2e5e] font-medium",
        "chip-phone":
          "border-transparent bg-[#f2e2fc] text-[#581c87] font-medium",
        "chip-card":
          "border-transparent bg-[#d5efff] text-[#0369a1] font-medium",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }

