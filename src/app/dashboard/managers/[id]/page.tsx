import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CalendarRange, MapPin, Store, Users } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Avatar } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { ConfirmDeleteButton } from "@/shared/ui/confirm-delete-button";
import { StatCard } from "@/shared/ui/stat-card";
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

  const locales = manager.localesComoManager;
  const totalBloques = locales.reduce((suma, l) => suma + l._count.plantilla, 0);
  const localPrincipal = locales[0]?.nombre;

  return (
    <div className="flex flex-col gap-8">
      <Link
        href="/dashboard/managers"
        className="inline-flex items-center gap-1.5 text-body-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft size={16} />
        Volver
      </Link>

      {/* Cabecera de perfil */}
      <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
        <Avatar nombre={manager.nombre} size="xl" online />
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Badge>Manager de local</Badge>
          </div>
          <h1 className="text-display-sm text-ink">{manager.nombre}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-body-sm text-ink-muted">
            <span>{manager.email}</span>
            {localPrincipal && (
              <span className="inline-flex items-center gap-1">
                <MapPin size={15} />
                {localPrincipal}
                {locales.length > 1 && ` · +${locales.length - 1}`}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Métricas reales */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <StatCard
          label="Trabajadores a cargo"
          valor={empleados.length}
          unidad={empleados.length === 1 ? "persona" : "personas"}
          icon={Users}
        />
        <StatCard
          label="Locales"
          valor={locales.length}
          unidad={locales.length === 1 ? "centro" : "centros"}
          tono="success"
          icon={Store}
        />
        <StatCard
          label="Bloques de turno"
          valor={totalBloques}
          unidad="en plantilla"
          tono="warning"
          icon={CalendarRange}
        />
      </div>

      {/* Locales */}
      <div className="flex flex-col gap-3">
        <h2 className="text-title-md text-ink">Locales</h2>
        {locales.length === 0 ? (
          <Card className="bg-canvas-soft text-center text-body-sm text-ink-muted">
            Este manager todavía no tiene locales.
          </Card>
        ) : (
          locales.map((local) => (
            <Link key={local.id} href={`/dashboard/locales/${local.id}`}>
              <Card className="flex items-center justify-between transition-colors hover:bg-canvas-soft">
                <span className="flex items-center gap-3 text-body-sm font-medium text-ink">
                  <span className="flex size-10 items-center justify-center rounded-full bg-surface-raised text-primary">
                    <Store size={18} />
                  </span>
                  {local.nombre}
                </span>
                <span className="text-body-sm text-ink-muted">
                  {local._count.plantilla} bloque
                  {local._count.plantilla === 1 ? "" : "s"} de turno
                </span>
              </Card>
            </Link>
          ))
        )}
      </div>

      {/* Trabajadores */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-title-md text-ink">Trabajadores</h2>
          <Link href={`/dashboard/equipo?rol=EMPLOYEE&managerId=${manager.id}`}>
            <Button variant="utility">Crear trabajador</Button>
          </Link>
        </div>
        {empleados.length === 0 ? (
          <Card className="bg-canvas-soft text-center text-body-sm text-ink-muted">
            Este manager todavía no tiene trabajadores a cargo.
          </Card>
        ) : (
          empleados.map((empleado) => (
            <Link key={empleado.id} href={`/dashboard/empleados/${empleado.id}`}>
              <Card className="flex items-center justify-between transition-colors hover:bg-canvas-soft">
                <span className="flex items-center gap-3 text-body-sm font-medium text-ink">
                  <Avatar nombre={empleado.nombre} size="md" />
                  {empleado.nombre}
                </span>
                <span className="text-body-sm text-ink-muted">
                  {empleado.email}
                </span>
              </Card>
            </Link>
          ))
        )}
      </div>

      {/* Editar datos */}
      <div className="flex flex-col gap-3">
        <h2 className="text-title-md text-ink">Datos del manager</h2>
        <Card elevated>
          <EditManagerForm
            usuarioId={manager.id}
            nombre={manager.nombre}
            email={manager.email}
          />
        </Card>
      </div>

      {/* Zona de peligro */}
      <Card>
        <div className="flex flex-col gap-3">
          <div>
            <h2 className="text-[17px] font-semibold text-ink">Zona de peligro</h2>
            <p className="text-body-sm text-ink-muted">
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
