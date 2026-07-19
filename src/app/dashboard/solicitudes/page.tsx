import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { DiaSemana } from "@/shared/kernel/dia-semana";
import { Badge } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";
import { SolicitudForm } from "@/domains/employees/ui/solicitud-form";
import {
  SolicitudInbox,
  type SolicitudPendiente,
} from "@/domains/employees/ui/solicitud-inbox";

type Estado = "PENDIENTE" | "ACEPTADA" | "RECHAZADA";

const ESTADO_LABEL: Record<Estado, string> = {
  PENDIENTE: "Pendiente",
  ACEPTADA: "Aceptada",
  RECHAZADA: "Rechazada",
};
const ESTADO_VARIANT: Record<Estado, "warning" | "success" | "danger"> = {
  PENDIENTE: "warning",
  ACEPTADA: "success",
  RECHAZADA: "danger",
};

/** "1–7 sep 2026" a partir del lunes de la semana. */
function formatearSemana(inicio: Date): string {
  const fin = new Date(inicio);
  fin.setDate(fin.getDate() + 6);
  const dia = (d: Date) => d.toLocaleDateString("es-ES", { day: "numeric" });
  const mesAnio = fin.toLocaleDateString("es-ES", {
    month: "short",
    year: "numeric",
  });
  return `${dia(inicio)}–${dia(fin)} ${mesAnio}`;
}

const fechaCorta = (d: Date) =>
  d.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });

export default async function SolicitudesPage() {
  const session = await auth();
  const { empresaId, rol, id: viewerId } = session!.user;

  if (rol === "EMPLOYEE") {
    const solicitudes = await prisma.solicitudDisponibilidad.findMany({
      where: { empresaId, usuarioId: viewerId },
      orderBy: { createdAt: "desc" },
    });

    return (
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-[26px] font-bold leading-[1.23] tracking-[-0.625px] text-ink">
            Solicitudes de cambio
          </h1>
          <p className="mt-1 text-[15px] text-ink-muted">
            Pide un cambio de disponibilidad para una semana concreta. Tu manager
            decidirá si lo aplica.
          </p>
        </div>

        <Card elevated className="max-w-120">
          <SolicitudForm />
        </Card>

        <div className="flex flex-col gap-3">
          <h2 className="text-title-md text-ink">Tus solicitudes</h2>
          {solicitudes.length === 0 ? (
            <Card className="bg-canvas-soft text-center text-body-sm text-ink-muted">
              Todavía no has enviado ninguna solicitud.
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {solicitudes.map((s) => (
                <Card key={s.id} className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-title-sm text-ink">
                      {formatearSemana(s.semanaInicio)}
                    </span>
                    <Badge variant={ESTADO_VARIANT[s.estado as Estado]}>
                      {ESTADO_LABEL[s.estado as Estado]}
                    </Badge>
                  </div>
                  <p className="whitespace-pre-line text-body-sm text-ink-secondary">
                    “{s.motivo}”
                  </p>
                  {s.respuesta && (
                    <p className="text-body-sm text-ink-muted">
                      Respuesta del manager: {s.respuesta}
                    </p>
                  )}
                  <p className="text-xs text-ink-faint">
                    Enviada el {fechaCorta(s.createdAt)}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Manager / Admin: bandeja de solicitudes pendientes.
  const pendientes = await prisma.solicitudDisponibilidad.findMany({
    where: {
      empresaId,
      estado: "PENDIENTE",
      ...(rol === "MANAGER" ? { usuario: { managerId: viewerId } } : {}),
    },
    orderBy: { createdAt: "asc" },
    include: {
      usuario: {
        select: {
          nombre: true,
          disponibilidad: {
            select: { diaSemana: true, horaInicio: true, horaFin: true },
          },
        },
      },
    },
  });

  const solicitudes: SolicitudPendiente[] = pendientes.map((s) => ({
    id: s.id,
    usuarioNombre: s.usuario.nombre,
    semanaLabel: formatearSemana(s.semanaInicio),
    motivo: s.motivo,
    creadaLabel: fechaCorta(s.createdAt),
    disponibilidadBase: s.usuario.disponibilidad.map((b) => ({
      diaSemana: b.diaSemana as DiaSemana,
      horaInicio: b.horaInicio,
      horaFin: b.horaFin,
    })),
  }));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-[26px] font-bold leading-[1.23] tracking-[-0.625px] text-ink">
          Solicitudes de cambio
        </h1>
        <p className="mt-1 text-[15px] text-ink-muted">
          Cambios de disponibilidad pedidos por tus trabajadores. Al aceptar,
          defines la disponibilidad de esa semana y el horario se regenera con
          ella.
        </p>
      </div>

      <SolicitudInbox solicitudes={solicitudes} />
    </div>
  );
}
