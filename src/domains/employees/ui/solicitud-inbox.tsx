"use client";

import { useActionState, useState } from "react";
import type { DiaSemana } from "@/shared/kernel/dia-semana";
import { resolverSolicitudAction } from "@/app/actions/resolver-solicitud.action";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Label } from "@/shared/ui/label";
import { DisponibilidadEditor } from "@/domains/employees/ui/disponibilidad-editor";

export type SolicitudPendiente = {
  id: string;
  usuarioNombre: string;
  semanaLabel: string;
  motivo: string;
  creadaLabel: string;
  disponibilidadBase: { diaSemana: DiaSemana; horaInicio: string; horaFin: string }[];
};

const respuestaClass =
  "rounded-md border border-hairline bg-surface px-3 py-2.5 text-sm text-ink transition-colors placeholder:text-ink-faint hover:border-ink-faint focus:outline-none focus:ring-2 focus:ring-ring";

function SolicitudItem({ solicitud }: { solicitud: SolicitudPendiente }) {
  const [state, formAction, pending] = useActionState(resolverSolicitudAction, {});
  const [modo, setModo] = useState<"cerrado" | "aceptar" | "rechazar">("cerrado");

  return (
    <Card elevated className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-title-sm text-ink">{solicitud.usuarioNombre}</h3>
        <span className="text-body-sm text-ink-muted">{solicitud.semanaLabel}</span>
      </div>
      <p className="whitespace-pre-line text-body-sm text-ink-secondary">
        “{solicitud.motivo}”
      </p>
      <p className="text-xs text-ink-faint">Solicitada el {solicitud.creadaLabel}</p>

      {modo === "cerrado" && (
        <div className="flex gap-2">
          <Button type="button" variant="primary" onClick={() => setModo("aceptar")}>
            Aceptar y ajustar
          </Button>
          <Button type="button" variant="secondary" onClick={() => setModo("rechazar")}>
            Rechazar
          </Button>
        </div>
      )}

      {modo !== "cerrado" && (
        <form action={formAction} className="flex flex-col gap-3 border-t border-hairline pt-3">
          <input type="hidden" name="solicitudId" value={solicitud.id} />
          <input
            type="hidden"
            name="estado"
            value={modo === "aceptar" ? "ACEPTADA" : "RECHAZADA"}
          />

          {modo === "aceptar" && (
            <div className="flex flex-col gap-1.5">
              <Label>Disponibilidad para esa semana</Label>
              <p className="text-[13px] text-ink-faint">
                Parte de la disponibilidad habitual del trabajador. Ajústala solo
                para esta semana; el horario se generará con estos bloques.
              </p>
              <DisponibilidadEditor bloquesIniciales={solicitud.disponibilidadBase} />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`respuesta-${solicitud.id}`}>
              Respuesta al trabajador (opcional)
            </Label>
            <textarea
              id={`respuesta-${solicitud.id}`}
              name="respuesta"
              rows={2}
              maxLength={500}
              className={respuestaClass}
            />
          </div>

          {state.error && <p className="text-sm text-red-600">{state.error}</p>}

          <div className="flex gap-2">
            <Button
              type="submit"
              variant={modo === "aceptar" ? "primary" : "danger"}
              loading={pending}
            >
              {modo === "aceptar" ? "Confirmar cambios" : "Confirmar rechazo"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setModo("cerrado")}>
              Cancelar
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}

export function SolicitudInbox({ solicitudes }: { solicitudes: SolicitudPendiente[] }) {
  if (solicitudes.length === 0) {
    return (
      <Card className="bg-canvas-soft text-center text-body-sm text-ink-muted">
        No hay solicitudes pendientes.
      </Card>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      {solicitudes.map((solicitud) => (
        <SolicitudItem key={solicitud.id} solicitud={solicitud} />
      ))}
    </div>
  );
}
