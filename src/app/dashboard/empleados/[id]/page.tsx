import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, Clock, MapPin, UserRound } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { DiaSemana } from "@/shared/kernel/dia-semana";
import { Avatar } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";
import { ConfirmDeleteButton } from "@/shared/ui/confirm-delete-button";
import { StatCard } from "@/shared/ui/stat-card";
import { deleteUserAction } from "@/app/actions/delete-user.action";
import { DisponibilidadSemana } from "@/domains/employees/ui/disponibilidad-semana";
import { EditEmployeeForm } from "./edit-employee-form";

/** Horas entre dos "HH:MM"; asume el mismo día (fin > inicio). */
function horasBloque(horaInicio: string, horaFin: string): number {
  const [hi, mi] = horaInicio.split(":").map(Number);
  const [hf, mf] = horaFin.split(":").map(Number);
  return (hf * 60 + mf - (hi * 60 + mi)) / 60;
}

export default async function EmpleadoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { empresaId, rol, id: viewerId } = session!.user;
  if (rol === "EMPLOYEE") {
    notFound();
  }
  const viewerRol = rol === "ADMIN" ? "ADMIN" : "MANAGER";
  const { id } = await params;

  const empleado = await prisma.usuario.findFirst({
    where: { id, empresaId, rol: "EMPLOYEE" },
    select: {
      id: true,
      nombre: true,
      email: true,
      managerId: true,
      localId: true,
      manager: { select: { nombre: true } },
      local: { select: { nombre: true } },
      disponibilidad: {
        select: { diaSemana: true, horaInicio: true, horaFin: true },
      },
    },
  });
  if (!empleado) {
    notFound();
  }
  if (viewerRol === "MANAGER" && empleado.managerId !== viewerId) {
    notFound();
  }

  const managers =
    viewerRol === "ADMIN"
      ? (
          await prisma.usuario.findMany({
            where: { empresaId, localesComoManager: { some: {} } },
            select: {
              id: true,
              nombre: true,
              localesComoManager: { select: { id: true, nombre: true } },
            },
            orderBy: { nombre: "asc" },
          })
        ).map((m) => ({ id: m.id, nombre: m.nombre, locales: m.localesComoManager }))
      : [
          {
            id: viewerId,
            nombre: session!.user.name ?? "",
            locales: await prisma.local.findMany({
              where: { managerId: viewerId, empresaId },
              select: { id: true, nombre: true },
              orderBy: { nombre: "asc" },
            }),
          },
        ];

  const disponibilidadIniciales = empleado.disponibilidad.map((bloque) => ({
    diaSemana: bloque.diaSemana as DiaSemana,
    horaInicio: bloque.horaInicio,
    horaFin: bloque.horaFin,
  }));

  const diasDisponibles = new Set(
    empleado.disponibilidad.map((b) => b.diaSemana),
  ).size;
  const horasSemana = empleado.disponibilidad.reduce(
    (suma, b) => suma + horasBloque(b.horaInicio, b.horaFin),
    0,
  );

  return (
    <div className="flex flex-col gap-8">
      <Link
        href="/dashboard/empleados"
        className="inline-flex items-center gap-1.5 text-body-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft size={16} />
        Volver
      </Link>

      {/* Cabecera de perfil */}
      <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
        <Avatar nombre={empleado.nombre} size="xl" online />
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="neutral">Trabajador</Badge>
            {empleado.local && (
              <span className="inline-flex items-center gap-1 text-body-sm text-ink-muted">
                <MapPin size={15} />
                {empleado.local.nombre}
              </span>
            )}
          </div>
          <h1 className="text-display-sm text-ink">{empleado.nombre}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-body-sm text-ink-muted">
            <span>{empleado.email}</span>
            {empleado.manager && (
              <span className="inline-flex items-center gap-1">
                <UserRound size={15} />
                {empleado.manager.nombre}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Métricas reales de disponibilidad */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <StatCard
          label="Días disponibles"
          valor={diasDisponibles}
          unidad={diasDisponibles === 1 ? "día / semana" : "días / semana"}
          icon={CalendarClock}
        />
        <StatCard
          label="Horas disponibles"
          valor={Number.isInteger(horasSemana) ? horasSemana : horasSemana.toFixed(1)}
          unidad="h / semana"
          tono="success"
          icon={Clock}
        />
        <StatCard
          label="Bloques"
          valor={empleado.disponibilidad.length}
          unidad="franjas"
          tono="warning"
          icon={CalendarClock}
        />
      </div>

      {/* Disponibilidad semanal (solo lectura) */}
      <div className="flex flex-col gap-3">
        <h2 className="text-title-md text-ink">Disponibilidad semanal</h2>
        {empleado.disponibilidad.length === 0 ? (
          <Card className="bg-canvas-soft text-center text-body-sm text-ink-muted">
            Este trabajador todavía no tiene disponibilidad configurada.
          </Card>
        ) : (
          <DisponibilidadSemana bloques={disponibilidadIniciales} />
        )}
      </div>

      {/* Editar datos y disponibilidad */}
      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-title-md text-ink">Editar trabajador</h2>
          <p className="mt-1 text-body-sm text-ink-muted">
            Actualiza sus datos, asignación y disponibilidad.
          </p>
        </div>
        <Card elevated>
          <EditEmployeeForm
            usuarioId={empleado.id}
            viewerRol={viewerRol}
            nombre={empleado.nombre}
            email={empleado.email}
            managers={managers}
            initialManagerId={empleado.managerId ?? ""}
            initialLocalId={empleado.localId ?? ""}
            disponibilidadIniciales={disponibilidadIniciales}
          />
        </Card>
      </div>

      {/* Zona de peligro */}
      <Card>
        <div className="flex flex-col gap-3">
          <div>
            <h2 className="text-[17px] font-semibold text-ink">Zona de peligro</h2>
            <p className="text-body-sm text-ink-muted">
              Eliminar al trabajador borra su cuenta, disponibilidad y turnos
              asignados. No se puede deshacer.
            </p>
          </div>
          <ConfirmDeleteButton
            action={deleteUserAction}
            input={{ usuarioId: empleado.id }}
            confirmTitle={`¿Eliminar a ${empleado.nombre}?`}
            confirmDescription="Se borrará su cuenta, disponibilidad y turnos. Esta acción no se puede deshacer."
            label="Eliminar trabajador"
            redirectTo="/dashboard/empleados"
          />
        </div>
      </Card>
    </div>
  );
}
