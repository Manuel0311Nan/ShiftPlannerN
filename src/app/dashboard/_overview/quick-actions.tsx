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
      className="flex items-center justify-between rounded-lg border border-hairline p-3 opacity-60"
    >
      <span className="flex items-center gap-2">
        <Icon className="size-4 text-ink-faint" />
        <span className="text-body-sm text-ink-muted">{label}</span>
      </span>
      <span className="rounded-full bg-canvas-soft px-2 py-0.5 text-[10px] font-bold text-ink-faint">
        Próximamente
      </span>
    </div>
  );
}

export function QuickActions() {
  return (
    <div className="space-y-6 md:col-span-12 lg:col-span-3">
      <Card>
        <h3 className="mb-4 text-title-md text-ink">Acciones rápidas</h3>
        <div className="space-y-3">
          <AccionPendiente icon={RefreshCw} label="Cambios pendientes" />
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
