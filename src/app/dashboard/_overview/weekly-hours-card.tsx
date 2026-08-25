import { cn } from "@/lib/utils";
import { Card } from "@/shared/ui/card";
import type { BarraDia } from "@/domains/scheduling/domain/resumen-dashboard";

const DIA_CORTO: Record<BarraDia["dia"], string> = {
  LUNES: "LUN",
  MARTES: "MAR",
  MIERCOLES: "MIÉ",
  JUEVES: "JUE",
  VIERNES: "VIE",
  SABADO: "SÁB",
  DOMINGO: "DOM",
};

export function WeeklyHoursCard({
  barras,
  totalHoras,
}: {
  barras: BarraDia[];
  totalHoras: number;
}) {
  const sinDatos = totalHoras === 0;

  return (
    <Card interactive className="md:col-span-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h3 className="text-title-md text-ink">Resumen de horas semanales</h3>
          <p className="mt-1 text-body-sm text-ink-muted">
            {sinDatos
              ? "Todavía no hay turnos planificados esta semana."
              : `${totalHoras} h programadas esta semana.`}
          </p>
        </div>
        {/* Toggle de la maqueta de Stitch: la vista mensual aún no existe. */}
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
        {barras.map(({ dia, horas, pct, esHoy }) => (
          <div
            key={dia}
            title={`${DIA_CORTO[dia]}: ${horas} h`}
            className={cn(
              // min-h para que un día con pocas horas siga siendo visible.
              "min-h-[2px] flex-1 rounded-t-lg transition-all",
              esHoy ? "bg-primary/40" : "bg-primary/20",
            )}
            style={{ height: `${pct}%` }}
          />
        ))}
      </div>
      {/* Etiquetas: fila aparte alineada con las barras por flex-1. */}
      <div className="mt-2 flex w-full gap-2 px-2">
        {barras.map(({ dia, esHoy }) => (
          <span
            key={dia}
            className={cn(
              "flex-1 text-center text-label-caps uppercase",
              esHoy ? "text-primary" : "text-ink-muted",
            )}
          >
            {DIA_CORTO[dia]}
          </span>
        ))}
      </div>
    </Card>
  );
}
