import { cn } from "@/lib/utils";

export function Card({
  className,
  elevated,
  interactive,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  elevated?: boolean;
  interactive?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg bg-surface p-6 text-ink transition-all",
        elevated ? "shadow-md" : "border border-hairline",
        interactive && "cursor-pointer hover:-translate-y-0.5 hover:shadow-lg",
        className,
      )}
      {...props}
    />
  );
}
