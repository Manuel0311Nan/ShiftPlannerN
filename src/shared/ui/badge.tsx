import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2 py-1 text-xs font-semibold tracking-[0.125px]",
  {
    variants: {
      variant: {
        default: "bg-surface text-primary",
        neutral: "bg-canvas-soft text-ink-muted",
        success: "bg-accent-green-soft text-accent-green",
        warning: "bg-accent-orange-soft text-accent-orange-deep",
        danger: "bg-destructive/10 text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
