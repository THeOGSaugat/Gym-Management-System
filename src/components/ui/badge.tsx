import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

/**
 * Status is never communicated by colour alone in this app: every badge
 * carries its own text label, and the semantic variants below are paired
 * with an icon by `StatusBadge` (see components/ui/status-badge.tsx), which
 * is what most screens should use rather than reaching for a raw colour.
 */
const badgeVariants = cva(
  "group/badge inline-flex w-fit shrink-0 items-center justify-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/40 [&>svg]:pointer-events-none [&>svg]:size-3.5",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "border-border-strong bg-card text-foreground",
        muted: "border-transparent bg-muted text-muted-foreground",
        success: "border-success-border bg-success-subtle text-success-foreground",
        warning: "border-warning-border bg-warning-subtle text-warning-foreground",
        destructive:
          "border-destructive-border bg-destructive-subtle text-destructive-foreground",
        info: "border-info-border bg-info-subtle text-info-foreground",
        ghost: "border-transparent text-muted-foreground",
      },
      size: {
        default: "h-6",
        sm: "h-5 px-1.5 text-[0.6875rem] [&>svg]:size-3",
        lg: "h-7 px-2.5 text-[0.8125rem]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  size = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant, size }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
