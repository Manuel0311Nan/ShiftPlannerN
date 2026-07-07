"use client";

import { useActionState } from "react";
import { generateScheduleAction } from "@/app/actions/generate-schedule.action";
import { TIPO_TURNO_LABEL } from "@/shared/kernel/tipo-turno";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

type Local = { id: string; nombre: string };

export function GenerateForm({
  locales,
  localId,
  semana,
}: {
  locales: Local[];
  localId: string;
  semana: string;
}) {
  const [state, formAction, pending] = useActionState(generateScheduleAction, {});

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        {locales.length > 1 ? (
          <div className="flex flex-col gap-1">
            <Label htmlFor="localId">Local</Label>
            <Select name="localId" defaultValue={localId}>
              <SelectTrigger id="localId">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {locales.map((local) => (
                  <SelectItem key={local.id} value={local.id}>
                    {local.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <input type="hidden" name="localId" value={locales[0]?.id ?? ""} />
        )}

        <div className="flex flex-col gap-1">
          <Label htmlFor="semanaInicio">Semana (lunes)</Label>
          <Input
            id="semanaInicio"
            name="semanaInicio"
            type="date"
            defaultValue={semana}
            className="w-auto"
          />
        </div>

        <Button type="submit" variant="primary" loading={pending} disabled={locales.length === 0}>
          {pending ? "Generando…" : "Generar horario"}
        </Button>
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      {state.condicionesIncumplidas && state.condicionesIncumplidas.length > 0 && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
          <p className="font-medium text-destructive">
            No se pudo generar el horario: no se pueden cumplir las condiciones.
          </p>
          <ul className="mt-1 list-disc pl-5 text-ink-secondary">
            {state.condicionesIncumplidas.map((condicion, i) => {
              const tipo = TIPO_TURNO_LABEL[condicion.tipo].toLowerCase();
              return (
                <li key={i}>
                  {condicion.usuarioNombre}: faltan {condicion.faltan} {tipo}
                  {condicion.faltan === 1 ? "" : "s"}
                </li>
              );
            })}
          </ul>
          <p className="mt-1 text-xs text-ink-faint">
            Ajusta las condiciones o la disponibilidad del trabajador y vuelve a intentarlo.
          </p>
        </div>
      )}

      {state.generado && (
        <p className="text-sm text-accent-green">
          {state.turnosCreados} turno{state.turnosCreados === 1 ? "" : "s"} generado
          {state.turnosCreados === 1 ? "" : "s"}.
          {state.huecos && state.huecos.length > 0 && (
            <>
              {" "}Faltó cobertura en: {state.huecos
                .map((hueco) => `${hueco.dia} ${hueco.nombre} (${hueco.faltan})`)
                .join(", ")}
              .
            </>
          )}
        </p>
      )}
    </form>
  );
}
