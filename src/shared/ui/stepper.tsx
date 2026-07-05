"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function Stepper({
  value,
  min = 1,
  max = 99,
  onChange,
  className,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-md border border-hairline bg-surface px-1 py-1",
        className,
      )}
    >
      <button
        type="button"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="inline-flex size-7 items-center justify-center rounded-sm text-ink-muted transition-colors hover:bg-canvas-soft hover:text-ink disabled:opacity-40"
        aria-label="Reducir"
      >
        <Minus size={14} />
      </button>
      <span className="w-6 text-center text-sm font-medium tabular-nums text-ink">{value}</span>
      <button
        type="button"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className="inline-flex size-7 items-center justify-center rounded-sm text-ink-muted transition-colors hover:bg-canvas-soft hover:text-ink disabled:opacity-40"
        aria-label="Aumentar"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
