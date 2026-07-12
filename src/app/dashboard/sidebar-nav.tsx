"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { menuForRol } from "./menu";
import type { Rol } from "@/domains/identity/domain/usuario.entity";

type NavEntry = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

function entriesForRol(rol: Rol): NavEntry[] {
  return [
    { href: "/dashboard", label: "Panel", icon: LayoutDashboard, exact: true },
    ...menuForRol(rol).map((item) => ({
      href: item.href,
      label: item.label,
      icon: item.icon,
    })),
  ];
}

function useIsActive() {
  const pathname = usePathname();
  return (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

/** Navegación vertical del sidebar (desktop). */
export function SidebarNav({ rol }: { rol: Rol }) {
  const isActive = useIsActive();
  const entries = entriesForRol(rol);

  return (
    <nav className="flex-1 space-y-1 px-4">
      {entries.map(({ href, label, icon: Icon, exact }) => {
        const active = isActive(href, exact);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-md px-4 py-2.5 text-label-caps uppercase transition-all",
              active
                ? "border-l-4 border-primary bg-primary/10 font-bold text-primary"
                : "text-ink-muted hover:bg-canvas-soft hover:text-ink",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Navegación inferior fija (móvil). Muestra las primeras entradas. */
export function MobileBottomNav({ rol }: { rol: Rol }) {
  const isActive = useIsActive();
  const entries = entriesForRol(rol).slice(0, 4);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex h-16 items-center justify-around border-t border-hairline bg-canvas md:hidden">
      {entries.map(({ href, label, icon: Icon, exact }) => {
        const active = isActive(href, exact);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-1 text-[10px] font-bold uppercase transition-colors",
              active ? "text-primary" : "text-ink-muted",
            )}
          >
            <Icon className="size-5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
