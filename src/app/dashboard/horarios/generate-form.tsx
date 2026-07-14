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

      {state.parcial && (
        <div className="rounded-md border border-accent-orange/40 bg-accent-orange-soft p-3 text-sm">
          <p className="font-medium text-accent-orange-deep">
            Horario generado parcialmente
            {typeof state.turnosCreados === "number" && (
              <>
                : se colocaron {state.turnosCreados} turno
                {state.turnosCreados === 1 ? "" : "s"}
              </>
            )}
            .
          </p>

          {state.condicionesIncumplidas && state.condicionesIncumplidas.length > 0 && (
            <>
              <p className="mt-2 text-ink-secondary">
                Estas condiciones no se pudieron cubrir automáticamente —
                complétalas a mano en el calendario:
              </p>
              <ul className="mt-1 list-disc pl-5 text-ink-secondary">
                {state.condicionesIncumplidas.map((condicion, i) => {
                  const tipo = TIPO_TURNO_LABEL[condicion.tipo].toLowerCase();
                  return (
                    <li key={i}>
                      {condicion.usuarioNombre}: {condicion.faltan} {tipo}
                      {condicion.faltan === 1 ? "" : "s"} sin asignar
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          {state.huecos && state.huecos.length > 0 && (
            <p className="mt-2 text-ink-secondary">
              Además faltó cobertura en:{" "}
              {state.huecos
                .map((hueco) => `${hueco.dia} ${hueco.nombre} (${hueco.faltan})`)
                .join(", ")}
              .
            </p>
          )}

          <p className="mt-2 text-xs text-ink-faint">
            Para cubrirlas automáticamente en la próxima generación: amplía la
            disponibilidad del trabajador en los días/horas de ese tipo, baja el
            mínimo exigido en sus condiciones, o añade bloques de ese tipo al
            horario del local. (Apertura = primer bloque del día; cierre =
            último; partido = dos bloques el mismo día.)
          </p>
        </div>
      )}

      {state.generado && !state.parcial && (
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
