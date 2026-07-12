import Link from "next/link";
import { CalendarPlus, RefreshCw } from "lucide-react";
import { Card } from "@/shared/ui/card";

export function QuickActions() {
  return (
    <div className="space-y-6 md:col-span-12 lg:col-span-3">
      <Card>
        <h3 className="mb-4 text-title-md text-ink">Acciones rápidas</h3>
        <div className="space-y-3">
          <Link
            href="/dashboard/horarios"
            className="group flex items-center justify-between rounded-lg border border-hairline p-3 transition-all hover:border-primary"
          >
            <span className="flex items-center gap-2">
              <RefreshCw className="size-4 text-primary" />
              <span className="text-body-sm text-ink">Cambios pendientes</span>
            </span>
            <span className="rounded-full bg-destructive/10 px-2 py-[2px] text-[10px] font-bold text-destructive">
              3
            </span>
          </Link>
          <Link
            href="/dashboard/horarios"
            className="flex items-center gap-2 rounded-lg border border-hairline p-3 transition-all hover:border-primary"
          >
            <CalendarPlus className="size-4 text-primary" />
            <span className="text-body-sm text-ink">Solicitar ausencia</span>
          </Link>
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
