"use client";

import { useActionState, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  const [horasExtra, setHorasExtra] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Cambiar de local navega (?localId=…) para que el tablero de abajo y el
  // resto de la página reflejen el local elegido, no solo el destino de la
  // generación. Sin esto, el board se queda en el primer local siempre.
  function cambiarLocal(nuevoLocalId: string | null) {
    if (!nuevoLocalId) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("localId", nuevoLocalId);
    router.push(`?${params.toString()}`);
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        {locales.length > 1 ? (
          <div className="flex flex-col gap-1">
            <Label htmlFor="localId">Local</Label>
            <Select name="localId" value={localId} onValueChange={cambiarLocal}>
              <SelectTrigger id="localId">
                <SelectValue>
                  {(value: string) =>
                    locales.find((local) => local.id === value)?.nombre
                  }
                </SelectValue>
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

      <label className="flex items-center gap-2 text-body-sm text-ink-secondary">
        <input
          type="checkbox"
          name="permitirHorasExtra"
          checked={horasExtra}
          onChange={(e) => setHorasExtra(e.target.checked)}
          className="size-4 rounded border-hairline text-primary focus:ring-ring"
        />
        Permitir horas extra (subir el tope de cada trabajador hasta 40h)
      </label>

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

          {state.horasIncumplidas && state.horasIncumplidas.length > 0 && (
            <>
              <p className="mt-2 text-ink-secondary">
                Estos trabajadores no llegan a sus horas de contrato (no hay
                suficiente demanda o disponibilidad):
              </p>
              <ul className="mt-1 list-disc pl-5 text-ink-secondary">
                {state.horasIncumplidas.map((h, i) => (
                  <li key={i}>
                    {h.usuarioNombre}: faltan {h.faltan}h
                  </li>
                ))}
              </ul>
            </>
          )}

          {state.huecos && state.huecos.length > 0 && (
            <p className="mt-2 text-ink-secondary">
              Además faltó cobertura en:{" "}
              {state.huecos
                .map(
                  (hueco) =>
                    `${hueco.dia} ${hueco.nombre} ${hueco.horaInicio}–${hueco.horaFin} (faltan ${hueco.faltan})`,
                )
                .join(", ")}
              .
            </p>
          )}

          {state.huecos && state.huecos.length > 0 && !horasExtra && (
            <p className="mt-2 font-medium text-accent-orange-deep">
              ¿Faltan horas por cubrir en el local? Marca “Permitir horas extra”
              y vuelve a generar para repartir esas franjas entre los contratos
              por debajo de 40h.
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
        <div className="flex flex-col gap-1.5">
          <p className="text-sm text-accent-green">
            {state.turnosCreados} turno{state.turnosCreados === 1 ? "" : "s"} generado
            {state.turnosCreados === 1 ? "" : "s"}.
            {state.huecos && state.huecos.length > 0 && (
              <>
                {" "}Faltó cobertura en: {state.huecos
                  .map(
                    (hueco) =>
                      `${hueco.dia} ${hueco.nombre} ${hueco.horaInicio}–${hueco.horaFin} (faltan ${hueco.faltan})`,
                  )
                  .join(", ")}
                .
              </>
            )}
          </p>
          {state.huecos && state.huecos.length > 0 && !horasExtra && (
            <p className="text-sm font-medium text-accent-orange-deep">
              ¿Faltan horas por cubrir en el local? Marca “Permitir horas extra”
              y vuelve a generar para repartir esas franjas entre los contratos
              por debajo de 40h.
            </p>
          )}
        </div>
      )}
    </form>
  );
}
