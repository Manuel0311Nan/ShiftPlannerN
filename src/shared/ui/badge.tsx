import { cn } from "@/lib/utils";

export function Badge({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-surface px-2 py-1 text-[12px] font-semibold tracking-[0.125px] text-primary",
        className,
      )}
      {...props}
    />
  );
}
