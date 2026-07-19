"use client";

import { useActionState } from "react";
import { crearSolicitudAction } from "@/app/actions/crear-solicitud.action";
import { DIAS_ANTELACION_SOLICITUD } from "@/domains/employees/domain/solicitud-disponibilidad";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { Input } from "@/shared/ui/input";

/** "YYYY-MM-DD" del primer día válido (hoy + antelación mínima), para el `min`. */
function minFecha(): string {
  const d = new Date();
  d.setDate(d.getDate() + DIAS_ANTELACION_SOLICITUD);
  return d.toISOString().slice(0, 10);
}

export function SolicitudForm() {
  const [state, formAction, pending] = useActionState(crearSolicitudAction, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="semanaInicio">Semana afectada</Label>
        <Input
          id="semanaInicio"
          name="semanaInicio"
          type="date"
          required
          min={minFecha()}
          className="w-52"
        />
        <p className="text-[13px] text-ink-faint">
          Elige cualquier día de la semana que quieres cambiar. Debe ser con al
          menos {DIAS_ANTELACION_SOLICITUD} días de antelación.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="motivo">Motivo</Label>
        <textarea
          id="motivo"
          name="motivo"
          required
          minLength={3}
          maxLength={500}
          rows={3}
          placeholder="Explica qué necesitas cambiar esa semana."
          className="rounded-md border border-hairline bg-surface px-3 py-2.5 text-sm text-ink transition-colors placeholder:text-ink-faint hover:border-ink-faint focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && (
        <p className="text-sm text-accent-green">
          Solicitud enviada. Tu manager la revisará.
        </p>
      )}

      <Button type="submit" variant="primary" loading={pending} className="self-start">
        {pending ? "Enviando…" : "Enviar solicitud"}
      </Button>
    </form>
  );
}
