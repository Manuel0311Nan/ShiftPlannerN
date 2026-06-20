"use client";

import { useActionState } from "react";
import { generateScheduleAction } from "@/app/actions/generate-schedule.action";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

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
            <label htmlFor="localId" className="text-[13px] text-ink-secondary">
              Local
            </label>
            <select
              id="localId"
              name="localId"
              defaultValue={localId}
              className="rounded-xs border border-[#dddddd] bg-surface px-3 py-2 text-[14px] text-ink"
            >
              {locales.map((local) => (
                <option key={local.id} value={local.id}>
                  {local.nombre}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <input type="hidden" name="localId" value={locales[0]?.id ?? ""} />
        )}

        <div className="flex flex-col gap-1">
          <label htmlFor="semanaInicio" className="text-[13px] text-ink-secondary">
            Semana (lunes)
          </label>
          <Input
            id="semanaInicio"
            name="semanaInicio"
            type="date"
            defaultValue={semana}
            className="w-auto"
          />
        </div>

        <Button type="submit" variant="primary" disabled={pending || locales.length === 0}>
          {pending ? "Generando…" : "Generar horario"}
        </Button>
      </div>

      {state.error && <p className="text-[14px] text-red-600">{state.error}</p>}
      {state.turnosCreados !== undefined && (
        <p className="text-[14px] text-accent-green">
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
