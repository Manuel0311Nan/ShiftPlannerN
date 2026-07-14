import { cn } from "@/lib/utils";
import { Card } from "@/shared/ui/card";
import { horasSemanaPlaceholder } from "./placeholder-data";

export function WeeklyHoursCard() {
  return (
    <Card interactive className="md:col-span-8">
      <div className="mb-8 flex items-center justify-between">
        <h3 className="text-title-md text-ink">Resumen de horas semanales</h3>
        {/* Toggle de la maqueta de Stitch: aún no filtra nada. Bloqueado. */}
        <div className="flex gap-2">
          <button
            type="button"
            disabled
            title="Próximamente"
            className="rounded-md border border-hairline px-3 py-1 text-xs font-bold text-ink-muted transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            MES
          </button>
          <button
            type="button"
            disabled
            title="Próximamente"
            className="rounded-md bg-primary px-3 py-1 text-xs font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            SEMANA
          </button>
        </div>
      </div>

      {/* Barras: fila con altura definida (h-48) para que height:% resuelva. */}
      <div className="flex h-48 w-full items-end gap-2 px-2">
        {horasSemanaPlaceholder.map(({ dia, pct, activo }) => (
          <div
            key={dia}
            className={cn(
              "flex-1 rounded-t-lg transition-all",
              activo ? "bg-primary/40" : "bg-primary/20",
            )}
            style={{ height: `${pct}%` }}
          />
        ))}
      </div>
      {/* Etiquetas: fila aparte alineada con las barras por flex-1. */}
      <div className="mt-2 flex w-full gap-2 px-2">
        {horasSemanaPlaceholder.map(({ dia, activo }) => (
          <span
            key={dia}
            className={cn(
              "flex-1 text-center text-label-caps uppercase",
              activo ? "text-primary" : "text-ink-muted",
            )}
          >
            {dia}
          </span>
        ))}
      </div>
    </Card>
  );
}
