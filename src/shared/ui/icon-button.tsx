import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const iconButtonVariants = cva(
  "inline-flex items-center justify-center rounded-md transition-colors active:scale-[0.94] disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        ghost: "text-ink-muted hover:bg-canvas-soft hover:text-ink",
        outline: "border border-hairline bg-surface text-ink hover:bg-canvas-soft",
        danger: "text-destructive hover:bg-destructive/10",
      },
      size: {
        sm: "size-7 [&_svg]:size-4",
        md: "size-9 [&_svg]:size-4.5",
      },
    },
    defaultVariants: {
      variant: "ghost",
      size: "md",
    },
  },
);

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  label: string;
}

export function IconButton({
  className,
  variant,
  size,
  label,
  ...props
}: IconButtonProps) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cn(iconButtonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
