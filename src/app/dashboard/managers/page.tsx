import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";

export default async function ManagersPage() {
  const session = await auth();
  if (session!.user.rol !== "ADMIN") {
    redirect("/dashboard");
  }

  const managers = await prisma.usuario.findMany({
    where: { empresaId: session!.user.empresaId, rol: "MANAGER" },
    select: {
      id: true,
      nombre: true,
      email: true,
      _count: { select: { empleados: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[26px] font-bold leading-[1.23] tracking-[-0.625px] text-ink">
            Managers
          </h1>
          <p className="mt-1 text-[15px] text-ink-muted">
            Managers de tu empresa y los equipos que tienen a cargo.
          </p>
        </div>
        <Link href="/dashboard/invitaciones?rol=MANAGER">
          <Button variant="primary">Invitar manager</Button>
        </Link>
      </div>

      {managers.length === 0 ? (
        <Card className="bg-canvas-soft text-center text-[15px] text-ink-muted">
          Todavía no has invitado a ningún manager.
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {managers.map((manager) => (
            <Link key={manager.id} href={`/dashboard/managers/${manager.id}`}>
              <Card elevated className="flex h-full flex-col gap-2">
                <span className="text-[18px] font-semibold text-ink">
                  {manager.nombre}
                </span>
                <span className="text-[14px] text-ink-muted">
                  {manager.email}
                </span>
                <Badge className="mt-2 w-fit">
                  {manager._count.empleados} trabajador
                  {manager._count.empleados === 1 ? "" : "es"}
                </Badge>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
