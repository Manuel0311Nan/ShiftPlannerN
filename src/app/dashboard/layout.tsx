import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { DashboardNav } from "./dashboard-nav";

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

  return (
    <div className="flex min-h-screen flex-col bg-canvas-soft">
      <header className="sticky top-0 z-40 border-b border-hairline bg-canvas/80 backdrop-blur px-6 py-4 md:px-12">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between">
          <Link
            href="/dashboard"
            className="text-xl font-semibold tracking-[-0.125px] text-ink"
          >
            ScheduleAI
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium text-ink">
                {session.user.name}
              </span>
              <Badge>{ROL_LABEL[session.user.rol] ?? session.user.rol}</Badge>
            </div>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <Button type="submit" variant="utility">
                Cerrar sesión
              </Button>
            </form>
          </div>
        </div>

        <div className="mx-auto mt-4 max-w-[1180px]">
          <DashboardNav rol={session.user.rol} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1180px] flex-1 px-6 py-10 md:px-12">
        {children}
      </main>
    </div>
  );
}
