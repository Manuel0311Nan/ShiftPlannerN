"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { menuForRol } from "./menu";
import type { Rol } from "@/domains/identity/domain/usuario.entity";

export function DashboardNav({ rol }: { rol: Rol }) {
  const pathname = usePathname();
  const items = menuForRol(rol);

  return (
    <nav className="flex gap-1 overflow-x-auto">
      {items.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-canvas-soft text-ink"
                : "text-ink-muted hover:bg-canvas-soft hover:text-ink",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
