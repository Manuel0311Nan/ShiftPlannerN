import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { DiaSemana } from "@/shared/kernel/dia-semana";
import { Card } from "@/shared/ui/card";
import { ConfirmDeleteButton } from "@/shared/ui/confirm-delete-button";
import { deleteUserAction } from "@/app/actions/delete-user.action";
import { EditEmployeeForm } from "./edit-employee-form";

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

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/dashboard/empleados"
        className="inline-flex items-center gap-1.5 text-[15px] text-ink-muted hover:text-ink"
      >
        <ArrowLeft size={16} />
        Volver
      </Link>

      <div>
        <h1 className="text-[26px] font-bold leading-[1.23] tracking-[-0.625px] text-ink">
          {empleado.nombre}
        </h1>
        <p className="mt-1 text-[15px] text-ink-muted">
          Edita los datos y la disponibilidad de este trabajador.
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

      <Card>
        <div className="flex flex-col gap-3">
          <div>
            <h2 className="text-[17px] font-semibold text-ink">Zona de peligro</h2>
            <p className="text-[14px] text-ink-muted">
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
