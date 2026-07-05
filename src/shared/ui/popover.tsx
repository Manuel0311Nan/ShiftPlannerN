"use client";

import { Popover as BasePopover } from "@base-ui/react/popover";
import { cn } from "@/lib/utils";

export const Popover = BasePopover.Root;
export const PopoverTrigger = BasePopover.Trigger;
export const PopoverClose = BasePopover.Close;

export function PopoverContent({
  className,
  children,
  sideOffset = 8,
  ...props
}: BasePopover.Popup.Props & { sideOffset?: number }) {
  return (
    <BasePopover.Portal>
      <BasePopover.Positioner sideOffset={sideOffset}>
        <BasePopover.Popup
          className={cn(
            "z-50 w-80 rounded-md border border-hairline bg-surface-raised p-4 text-ink shadow-lg outline-none",
            className,
          )}
          {...props}
        >
          {children}
        </BasePopover.Popup>
      </BasePopover.Positioner>
    </BasePopover.Portal>
  );
}
