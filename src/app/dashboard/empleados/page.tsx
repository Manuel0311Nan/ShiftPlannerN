import Link from "next/link";
import { ArrowLeft, CalendarClock } from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Avatar } from "@/shared/ui/avatar";
import { Card } from "@/shared/ui/card";

/** Horas entre dos "HH:MM"; asume el mismo día (fin > inicio). */
function horasBloque(horaInicio: string, horaFin: string): number {
  const [hi, mi] = horaInicio.split(":").map(Number);
  const [hf, mf] = horaFin.split(":").map(Number);
  return (hf * 60 + mf - (hi * 60 + mi)) / 60;
}

function fmtHora(fecha: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(fecha.getHours())}:${p(fecha.getMinutes())}`;
}

function fmtFecha(fecha: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(fecha.getDate())}/${p(fecha.getMonth() + 1)}`;
}

export default async function EmpleadosPage() {
  const session = await auth();
  const { empresaId, rol, id: viewerId } = session!.user;
  const esAdmin = rol === "ADMIN";

  const where: Prisma.UsuarioWhereInput = {
    empresaId,
    rol: "EMPLOYEE",
    ...(esAdmin ? {} : { managerId: viewerId }),
  };

  const empleados = await prisma.usuario.findMany({
    where,
    select: {
      id: true,
      nombre: true,
      email: true,
      manager: { select: { nombre: true } },
      local: { select: { nombre: true } },
      disponibilidad: { select: { horaInicio: true, horaFin: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const ids = empleados.map((e) => e.id);
  const proximos = ids.length
    ? await prisma.turno.findMany({
        where: { empresaId, usuarioId: { in: ids }, inicio: { gte: new Date() } },
        select: { usuarioId: true, inicio: true, fin: true },
        orderBy: { inicio: "asc" },
      })
    : [];

  const proximoPorUsuario = new Map<string, { inicio: Date; fin: Date }>();
  for (const turno of proximos) {
    if (!proximoPorUsuario.has(turno.usuarioId)) {
      proximoPorUsuario.set(turno.usuarioId, { inicio: turno.inicio, fin: turno.fin });
    }
  }

  const filas = empleados.map((empleado) => ({
    ...empleado,
    horasSemana: empleado.disponibilidad.reduce(
      (suma, b) => suma + horasBloque(b.horaInicio, b.horaFin),
      0,
    ),
    proximo: proximoPorUsuario.get(empleado.id) ?? null,
  }));

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
          <h1 className="text-h2 text-ink">Directorio de trabajadores</h1>
          <p className="mt-1 text-body-sm text-ink-muted">
            {esAdmin
              ? "Todos los empleados de tu empresa, con su disponibilidad y próximo turno."
              : "Los empleados que tienes a cargo, con su disponibilidad y próximo turno."}
          </p>
        </div>
      </div>

      {filas.length === 0 ? (
        <Card className="bg-canvas-soft text-center text-body-sm text-ink-muted">
          Todavía no hay trabajadores.
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-hairline bg-surface shadow-sm">
          <table className="w-full min-w-160 text-left">
            <thead>
              <tr className="border-b border-hairline bg-canvas-soft">
                <th className="px-6 py-4 text-label-caps uppercase text-ink-muted">
                  Empleado
                </th>
                <th className="px-6 py-4 text-label-caps uppercase text-ink-muted">
                  Local
                </th>
                {esAdmin && (
                  <th className="px-6 py-4 text-label-caps uppercase text-ink-muted">
                    Manager
                  </th>
                )}
                <th className="px-6 py-4 text-label-caps uppercase text-ink-muted">
                  Disp. semanal
                </th>
                <th className="px-6 py-4 text-label-caps uppercase text-ink-muted">
                  Próximo turno
                </th>
                <th className="px-6 py-4 text-right text-label-caps uppercase text-ink-muted">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {filas.map((empleado) => (
                <tr
                  key={empleado.id}
                  className="transition-colors hover:bg-canvas-soft/50"
                >
                  <td className="px-6 py-4">
                    <Link
                      href={`/dashboard/empleados/${empleado.id}`}
                      className="group flex items-center gap-3"
                    >
                      <Avatar nombre={empleado.nombre} size="md" />
                      <div className="flex flex-col">
                        <span className="font-medium text-ink group-hover:text-primary">
                          {empleado.nombre}
                        </span>
                        <span className="text-body-sm text-ink-muted">
                          {empleado.email}
                        </span>
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-body-sm text-ink-secondary">
                    {empleado.local?.nombre ?? "—"}
                  </td>
                  {esAdmin && (
                    <td className="px-6 py-4 text-body-sm text-ink-secondary">
                      {empleado.manager?.nombre ?? "—"}
                    </td>
                  )}
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 text-body-sm text-ink-secondary">
                      <CalendarClock size={16} className="text-ink-faint" />
                      {empleado.horasSemana > 0
                        ? `${
                            Number.isInteger(empleado.horasSemana)
                              ? empleado.horasSemana
                              : empleado.horasSemana.toFixed(1)
                          } h`
                        : "—"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {empleado.proximo ? (
                      <div className="flex flex-col">
                        <span className="text-body-sm font-medium text-ink">
                          {fmtFecha(empleado.proximo.inicio)}
                        </span>
                        <span className="text-xs tabular-nums text-ink-muted">
                          {fmtHora(empleado.proximo.inicio)} –{" "}
                          {fmtHora(empleado.proximo.fin)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-body-sm text-ink-faint">
                        Sin turnos
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/dashboard/empleados/${empleado.id}`}
                      className="text-body-sm font-semibold text-primary hover:underline"
                    >
                      Ver perfil
                    </Link>
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
