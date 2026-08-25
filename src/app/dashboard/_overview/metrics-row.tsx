import { cn } from "@/lib/utils";
import type { MetricasResumen } from "@/domains/scheduling/application/get-dashboard-overview.query";

const numero = new Intl.NumberFormat("es-ES");

/**
 * El tile de "Coste laboral" de la maqueta no está: el modelo no guarda tarifa
 * horaria, así que su hueco lo ocupa una métrica que sí es real. Vuelve cuando
 * exista `Usuario.costeHora`.
 */
export function MetricsRow({ metricas }: { metricas: MetricasResumen }) {
  const tiles = [
    { label: "PERSONAL TOTAL", valor: numero.format(metricas.personalTotal) },
    {
      label: "TURNOS ABIERTOS",
      valor: numero.format(metricas.turnosAbiertos),
      tono: metricas.turnosAbiertos > 0 ? ("warning" as const) : undefined,
    },
    {
      label: "HORAS PROGRAMADAS",
      valor: `${numero.format(metricas.horasProgramadas)} h`,
    },
    {
      label: "SOLICITUDES PENDIENTES",
      valor: numero.format(metricas.solicitudesPendientes),
      tono: metricas.solicitudesPendientes > 0 ? ("warning" as const) : undefined,
    },
  ];

  return (
    <div className="mt-20 grid grid-cols-2 gap-6 border-t border-hairline pt-12 md:grid-cols-4">
      {tiles.map(({ label, valor, tono }) => (
        <div key={label} className="text-center">
          <p className="text-label-caps uppercase text-ink-muted">{label}</p>
          <p
            className={cn(
              "text-h2",
              tono === "warning" ? "text-accent-orange" : "text-ink",
            )}
          >
            {valor}
          </p>
        </div>
      ))}
    </div>
  );
}
