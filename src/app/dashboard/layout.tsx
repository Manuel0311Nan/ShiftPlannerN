import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, LogOut, Search, Settings } from "lucide-react";
import { auth, signOut } from "@/auth";
import { Badge } from "@/shared/ui/badge";
import { MobileBottomNav, SidebarNav } from "./sidebar-nav";

const ROL_LABEL: Record<string, string> = {
  ADMIN: "Administrador",
  MANAGER: "Manager",
  EMPLOYEE: "Empleado",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const { name, rol } = session.user;
  const initial = name?.trim().charAt(0).toUpperCase() ?? "?";

  return (
    <div className="min-h-screen bg-canvas-soft">
      {/* Sidebar (desktop) */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-hairline bg-surface py-6 md:flex">
        <div className="mb-10 px-6">
          <Link href="/dashboard" className="block">
            <span className="text-h3 text-primary">ScheduleAI</span>
            <p className="text-label-caps uppercase text-ink-muted">
              Management Suite
            </p>
          </Link>
        </div>

        <SidebarNav rol={rol} />

        <div className="mt-auto border-t border-hairline px-4 pt-4">
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-md px-4 py-2.5 text-label-caps uppercase text-ink-muted transition-all hover:bg-canvas-soft hover:text-ink"
            >
              <LogOut className="size-4" />
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      {/* App bar */}
      <header className="sticky top-0 z-30 border-b border-hairline bg-canvas md:ml-64">
        <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-6 md:px-8">
          <div className="hidden items-center gap-2 rounded-md border border-hairline bg-canvas-soft px-4 py-2 md:flex md:w-64">
            <Search className="size-4 text-ink-muted" />
            <input
              type="search"
              placeholder="Buscar turnos o personal..."
              className="w-full bg-transparent text-body-sm outline-none placeholder:text-ink-muted"
            />
          </div>
          <Link href="/dashboard" className="text-title-md text-primary md:hidden">
            ScheduleAI
          </Link>

          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label="Notificaciones"
              className="text-ink-muted transition-colors hover:text-primary"
            >
              <Bell className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Ajustes"
              className="text-ink-muted transition-colors hover:text-primary"
            >
              <Settings className="size-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="hidden flex-col items-end sm:flex">
                <span className="text-body-sm font-medium text-ink">{name}</span>
                <Badge>{ROL_LABEL[rol] ?? rol}</Badge>
              </div>
              <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-body-sm font-bold text-primary">
                {initial}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="md:ml-64">
        <div className="mx-auto max-w-[1180px] px-6 pb-24 pt-8 md:px-8 md:pb-12">
          {children}
        </div>
      </main>

      {/* Bottom nav (móvil) */}
      <MobileBottomNav rol={rol} />
    </div>
  );
}
