"use client";

import { useActionState } from "react";
import { generateScheduleAction } from "@/app/actions/generate-schedule.action";
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
      {state.turnosCreados !== undefined && (
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
