import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Store, Users } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Avatar } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";

export default async function ManagersPage() {
  const session = await auth();
  if (session!.user.rol !== "ADMIN") {
    redirect("/dashboard");
  }

  const managers = await prisma.usuario.findMany({
    where: {
      empresaId: session!.user.empresaId,
      localesComoManager: { some: {} },
    },
    select: {
      id: true,
      nombre: true,
      email: true,
      _count: { select: { empleados: true } },
      localesComoManager: {
        select: { nombre: true },
        orderBy: { nombre: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-body-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft size={16} />
        Volver
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-label-caps uppercase text-primary">Equipo</p>
          <h1 className="text-h2 text-ink">Directorio de managers</h1>
          <p className="mt-1 text-body-sm text-ink-muted">
            Todos los responsables de locales y los equipos que tienen a cargo.
          </p>
        </div>
        <Link href="/dashboard/equipo?rol=MANAGER">
          <Button variant="primary">Añadir manager</Button>
        </Link>
      </div>

      {managers.length === 0 ? (
        <Card className="bg-canvas-soft text-center text-body-sm text-ink-muted">
          Todavía no has creado ningún manager.
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-hairline bg-surface shadow-sm">
          <table className="w-full min-w-160 text-left">
            <thead>
              <tr className="border-b border-hairline bg-canvas-soft">
                <th className="px-6 py-4 text-label-caps uppercase text-ink-muted">
                  Manager
                </th>
                <th className="px-6 py-4 text-label-caps uppercase text-ink-muted">
                  Locales asignados
                </th>
                <th className="px-6 py-4 text-label-caps uppercase text-ink-muted">
                  Trabajadores
                </th>
                <th className="px-6 py-4 text-right text-label-caps uppercase text-ink-muted">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {managers.map((manager) => (
                <tr
                  key={manager.id}
                  className="transition-colors hover:bg-canvas-soft/50"
                >
                  <td className="px-6 py-4">
                    <Link
                      href={`/dashboard/managers/${manager.id}`}
                      className="group flex items-center gap-3"
                    >
                      <Avatar nombre={manager.nombre} size="md" />
                      <div className="flex flex-col">
                        <span className="font-medium text-ink group-hover:text-primary">
                          {manager.nombre}
                        </span>
                        <span className="text-body-sm text-ink-muted">
                          {manager.email}
                        </span>
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 text-body-sm text-ink-secondary">
                      <Store size={16} className="shrink-0 text-ink-faint" />
                      {manager.localesComoManager.length > 0
                        ? manager.localesComoManager
                            .map((local) => local.nombre)
                            .join(", ")
                        : "—"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 text-body-sm text-ink-secondary">
                      <Users size={16} className="text-ink-faint" />
                      {manager._count.empleados}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-4">
                      <Link
                        href={`/dashboard/managers/${manager.id}`}
                        className="text-body-sm font-semibold text-primary hover:underline"
                      >
                        Ver perfil
                      </Link>
                      <a
                        href={`mailto:${manager.email}`}
                        className="text-body-sm font-semibold text-primary hover:underline"
                      >
                        Email
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
