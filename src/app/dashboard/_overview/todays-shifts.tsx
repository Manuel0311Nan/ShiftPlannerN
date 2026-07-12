import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/shared/ui/card";
import { type Franja, turnosHoyPlaceholder } from "./placeholder-data";

const FRANJA_STYLES: Record<Franja, string> = {
  morning: "border-deep-sky-blue bg-deep-sky-blue/5",
  afternoon: "border-cool-horizon bg-cool-horizon/5",
  night: "border-fuchsia-plum bg-fuchsia-plum/5",
};

function AvatarStack({ nombres, extra }: { nombres: string[]; extra: number }) {
  return (
    <div className="flex -space-x-2">
      {nombres.map((nombre) => (
        <div
          key={nombre}
          title={nombre}
          className="flex size-8 items-center justify-center rounded-full border-2 border-canvas bg-canvas-soft text-[11px] font-bold text-ink-muted"
        >
          {nombre.charAt(0).toUpperCase()}
        </div>
      ))}
      {extra > 0 && (
        <div className="flex size-8 items-center justify-center rounded-full border-2 border-canvas bg-primary/10 text-[10px] font-bold text-primary">
          +{extra}
        </div>
      )}
    </div>
  );
}

export function TodaysShifts() {
  return (
    <Card
      interactive
      className="overflow-hidden p-0 md:col-span-12 lg:col-span-9"
    >
      <div className="flex items-center justify-between border-b border-hairline p-6">
        <h3 className="text-title-md text-ink">Turnos de hoy</h3>
        <Link
          href="/dashboard/horarios"
          className="flex items-center gap-1 text-button text-primary hover:underline"
        >
          Ver calendario <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="divide-y divide-hairline">
        {turnosHoyPlaceholder.map((turno) => (
          <div
            key={turno.franja}
            className="flex flex-col gap-6 p-6 transition-colors hover:bg-canvas-soft/50 md:flex-row md:items-center"
          >
            <div className="min-w-[140px]">
              <p className="text-label-caps uppercase text-ink-muted">
                {turno.franjaLabel}
              </p>
              <p className="text-h3 text-ink">{turno.horario}</p>
            </div>

            <div
              className={cn(
                "flex-1 rounded-r-lg border-l-4 py-2 pl-4",
                FRANJA_STYLES[turno.franja],
              )}
            >
              <h4 className="text-title-md text-ink">{turno.unidad}</h4>
              <p className="text-body-sm text-ink-muted">{turno.meta}</p>
            </div>

            <AvatarStack nombres={turno.dotados} extra={turno.extra} />
          </div>
        ))}
      </div>
    </Card>
  );
}
