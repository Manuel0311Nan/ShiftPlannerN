"use client";

import { Select as BaseSelect } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const Select = BaseSelect.Root;
export const SelectValue = BaseSelect.Value;

export function SelectTrigger({
  className,
  children,
  ...props
}: BaseSelect.Trigger.Props) {
  return (
    <BaseSelect.Trigger
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-md border border-hairline bg-surface px-3 py-2.5 text-sm text-ink transition-colors hover:border-ink-faint focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[placeholder]:text-ink-faint",
        className,
      )}
      {...props}
    >
      {children}
      <BaseSelect.Icon className="shrink-0 text-ink-faint">
        <ChevronDown className="size-4" />
      </BaseSelect.Icon>
    </BaseSelect.Trigger>
  );
}

export function SelectContent({
  className,
  children,
  ...props
}: BaseSelect.Popup.Props) {
  return (
    <BaseSelect.Portal>
      <BaseSelect.Positioner className="z-50 outline-none" sideOffset={6}>
        <BaseSelect.Popup
          className={cn(
            "max-h-[min(24rem,var(--available-height))] min-w-[var(--anchor-width)] overflow-y-auto rounded-md border border-hairline bg-surface-raised p-1 text-ink shadow-md",
            className,
          )}
          {...props}
        >
          {children}
        </BaseSelect.Popup>
      </BaseSelect.Positioner>
    </BaseSelect.Portal>
  );
}

export function SelectItem({
  className,
  children,
  ...props
}: BaseSelect.Item.Props) {
  return (
    <BaseSelect.Item
      className={cn(
        "flex cursor-default items-center justify-between gap-2 rounded-sm px-2.5 py-2 text-sm text-ink outline-none data-[highlighted]:bg-canvas-soft",
        className,
      )}
      {...props}
    >
      <BaseSelect.ItemText>{children}</BaseSelect.ItemText>
      <BaseSelect.ItemIndicator className="text-primary">
        <Check className="size-4" />
      </BaseSelect.ItemIndicator>
    </BaseSelect.Item>
  );
}
