import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium text-base transition-transform active:scale-[0.96] disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary: "rounded-full bg-primary text-primary-foreground px-6 py-3 hover:bg-primary-active",
        secondary: "rounded-full bg-surface text-ink px-6 py-3 shadow-md",
        utility:
          "rounded-md bg-surface text-ink px-3.5 py-1 border border-hairline hover:bg-canvas-soft",
        ghost: "rounded-md text-ink px-3.5 py-1 hover:bg-canvas-soft",
        danger:
          "rounded-full bg-destructive text-white px-6 py-3 hover:opacity-90",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export function Button({
  className,
  variant,
  loading,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
}
