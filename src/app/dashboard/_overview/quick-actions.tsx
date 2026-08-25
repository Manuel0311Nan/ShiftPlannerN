import Link from "next/link";
import { CalendarPlus, RefreshCw } from "lucide-react";
import { Card } from "@/shared/ui/card";

/**
 * Acción de la maqueta de Stitch cuya vista/funcionalidad aún no existe.
 * Se muestra bloqueada con distintivo "Próximamente" en vez de enlazar a nada.
 */
function AccionPendiente({
  icon: Icon,
  label,
}: {
  icon: typeof RefreshCw;
  label: string;
}) {
  return (
    <div
      aria-disabled
      className="flex items-center justify-between gap-2 rounded-lg border border-hairline p-3 opacity-60"
    >
      <span className="flex min-w-0 items-center gap-2">
        <Icon className="size-4 shrink-0 text-ink-faint" />
        <span className="truncate text-body-sm text-ink-muted">{label}</span>
      </span>
      <span className="shrink-0 whitespace-nowrap rounded-full bg-canvas-soft px-2 py-0.5 text-[10px] font-bold text-ink-faint">
        Próximamente
      </span>
    </div>
  );
}

export function QuickActions({ solicitudesPendientes }: { solicitudesPendientes: number }) {
  return (
    <div className="space-y-6 md:col-span-12 lg:col-span-3">
      <Card>
        <h3 className="mb-4 text-title-md text-ink">Acciones rápidas</h3>
        <div className="space-y-3">
          <Link
            href="/dashboard/solicitudes"
            className="flex items-center justify-between gap-2 rounded-lg border border-hairline p-3 transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <span className="flex min-w-0 items-center gap-2">
              <RefreshCw className="size-4 shrink-0 text-primary" />
              <span className="truncate text-body-sm text-ink">
                Cambios pendientes
              </span>
            </span>
            {solicitudesPendientes > 0 && (
              <span className="shrink-0 rounded-full bg-accent-orange/15 px-2 py-0.5 text-[10px] font-bold text-accent-orange">
                {solicitudesPendientes}
              </span>
            )}
          </Link>
          {/* Las ausencias no están modeladas: no hay `tipo` en SolicitudDisponibilidad. */}
          <AccionPendiente icon={CalendarPlus} label="Solicitar ausencia" />
        </div>
      </Card>

      <Card className="bg-primary/5">
        <h3 className="mb-4 text-title-md text-ink">Aviso del sistema</h3>
        <p className="text-body-sm text-ink-secondary">
          Mantenimiento programado el domingo a las 02:00. El sistema estará
          fuera de servicio durante 15 minutos.
        </p>
      </Card>
    </div>
  );
}
