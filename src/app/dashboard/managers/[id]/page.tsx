import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Store } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { ConfirmDeleteButton } from "@/shared/ui/confirm-delete-button";
import { deleteUserAction } from "@/app/actions/delete-user.action";
import { EditManagerForm } from "./edit-manager-form";

export default async function ManagerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (session!.user.rol !== "ADMIN") {
    redirect("/dashboard");
  }

  const { id } = await params;
  const manager = await prisma.usuario.findFirst({
    where: {
      id,
      empresaId: session!.user.empresaId,
      localesComoManager: { some: {} },
    },
    select: {
      id: true,
      nombre: true,
      email: true,
      localesComoManager: {
        select: { id: true, nombre: true, _count: { select: { plantilla: true } } },
        orderBy: { nombre: "asc" },
      },
    },
  });
  if (!manager) {
    notFound();
  }

  const empleados = await prisma.usuario.findMany({
    where: { empresaId: session!.user.empresaId, managerId: manager.id },
    select: { id: true, nombre: true, email: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/dashboard/managers"
        className="inline-flex items-center gap-1.5 text-[15px] text-ink-muted hover:text-ink"
      >
        <ArrowLeft size={16} />
        Volver
      </Link>

      <div>
        <h1 className="text-[26px] font-bold leading-[1.23] tracking-[-0.625px] text-ink">
          {manager.nombre}
        </h1>
        <p className="mt-1 text-[15px] text-ink-muted">{manager.email}</p>
      </div>

      <Card elevated>
        <EditManagerForm
          usuarioId={manager.id}
          nombre={manager.nombre}
          email={manager.email}
        />
      </Card>

      <div className="flex flex-col gap-3">
        <h2 className="text-[18px] font-semibold text-ink">Locales</h2>
        {manager.localesComoManager.length === 0 ? (
          <Card className="bg-canvas-soft text-center text-[15px] text-ink-muted">
            Este manager todavía no tiene locales.
          </Card>
        ) : (
          manager.localesComoManager.map((local) => (
            <Link key={local.id} href={`/dashboard/locales/${local.id}`}>
              <Card className="flex items-center justify-between transition-colors hover:bg-canvas-soft">
                <span className="flex items-center gap-2 text-[15px] font-medium text-ink">
                  <Store size={16} className="text-ink-muted" />
                  {local.nombre}
                </span>
                <span className="text-[14px] text-ink-muted">
                  {local._count.plantilla} bloque
                  {local._count.plantilla === 1 ? "" : "s"} de turno
                </span>
              </Card>
            </Link>
          ))
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-semibold text-ink">Trabajadores</h2>
          <Link href={`/dashboard/equipo?rol=EMPLOYEE&managerId=${manager.id}`}>
            <Button variant="utility">Crear trabajador</Button>
          </Link>
        </div>
        {empleados.length === 0 ? (
          <Card className="bg-canvas-soft text-center text-[15px] text-ink-muted">
            Este manager todavía no tiene trabajadores a cargo.
          </Card>
        ) : (
          empleados.map((empleado) => (
            <Link key={empleado.id} href={`/dashboard/empleados/${empleado.id}`}>
              <Card className="flex items-center justify-between transition-colors hover:bg-canvas-soft">
                <span className="text-[15px] font-medium text-ink">
                  {empleado.nombre}
                </span>
                <span className="text-[14px] text-ink-muted">
                  {empleado.email}
                </span>
              </Card>
            </Link>
          ))
        )}
      </div>

      <Card>
        <div className="flex flex-col gap-3">
          <div>
            <h2 className="text-[17px] font-semibold text-ink">Zona de peligro</h2>
            <p className="text-[14px] text-ink-muted">
              Eliminar al manager borra también sus locales y plantillas. Sus
              trabajadores quedarán sin manager ni local asignado.
            </p>
          </div>
          <ConfirmDeleteButton
            action={deleteUserAction}
            input={{ usuarioId: manager.id }}
            confirmTitle={`¿Eliminar a ${manager.nombre}?`}
            confirmDescription="Se borrarán sus locales y plantillas; sus trabajadores quedarán sin manager ni local. Esta acción no se puede deshacer."
            label="Eliminar manager"
            redirectTo="/dashboard/managers"
          />
        </div>
      </Card>
    </div>
  );
}
