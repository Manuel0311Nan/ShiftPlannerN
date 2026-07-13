import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/shared/ui/card";

type Tono = "primary" | "success" | "warning";

const TONO_TEXT: Record<Tono, string> = {
  primary: "text-primary",
  success: "text-accent-green",
  warning: "text-accent-orange",
};

const TONO_BAR: Record<Tono, string> = {
  primary: "bg-primary",
  success: "bg-accent-green",
  warning: "bg-accent-orange",
};

/**
 * Tarjeta de métrica estilo "bento" del diseño de Stitch: etiqueta en
 * mayúsculas, cifra grande, glifo decorativo tenue e (opcional) barra de
 * progreso. Agnóstica de dominio.
 */
export function StatCard({
  label,
  valor,
  unidad,
  tono = "primary",
  icon: Icon,
  progreso,
}: {
  label: string;
  valor: string | number;
  unidad?: string;
  tono?: Tono;
  icon?: LucideIcon;
  progreso?: number;
}) {
  return (
    <Card className="group relative flex flex-col gap-3 overflow-hidden">
      {Icon && (
        <Icon
          className="pointer-events-none absolute -right-3 -top-3 size-20 text-ink/[0.04] transition-colors group-hover:text-ink/[0.07]"
          strokeWidth={1.5}
        />
      )}
      <span className="text-label-caps uppercase text-ink-muted">{label}</span>
      <div className="flex items-baseline gap-2">
        <span className={cn("text-display-sm", TONO_TEXT[tono])}>{valor}</span>
        {unidad && <span className="text-body-sm text-ink-muted">{unidad}</span>}
      </div>
      {progreso !== undefined && (
        <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-canvas-soft">
          <div
            className={cn("h-full rounded-full", TONO_BAR[tono])}
            style={{ width: `${Math.min(100, Math.max(0, progreso))}%` }}
          />
        </div>
      )}
    </Card>
  );
}
