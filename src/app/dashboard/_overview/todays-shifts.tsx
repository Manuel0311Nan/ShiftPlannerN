import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/shared/ui/card";
import type { BloqueHoy, Franja } from "@/domains/scheduling/domain/resumen-dashboard";

const FRANJA_STYLES: Record<Franja, string> = {
  MANANA: "border-deep-sky-blue bg-deep-sky-blue/5",
  TARDE: "border-cool-horizon bg-cool-horizon/5",
  NOCHE: "border-fuchsia-plum bg-fuchsia-plum/5",
};

const FRANJA_LABEL: Record<Franja, string> = {
  MANANA: "MAÑANA",
  TARDE: "TARDE",
  NOCHE: "NOCHE",
};

const MAX_AVATARES = 3;

function AvatarStack({ nombres }: { nombres: string[] }) {
  const visibles = nombres.slice(0, MAX_AVATARES);
  const extra = nombres.length - visibles.length;

  if (nombres.length === 0) {
    return (
      <span className="text-body-sm text-ink-faint">Sin asignar</span>
    );
  }

  return (
    <div className="flex -space-x-2">
      {visibles.map((nombre, indice) => (
        <div
          key={`${nombre}-${indice}`}
          title={nombre}
          className="flex size-8 items-center justify-center rounded-full border-2 border-canvas bg-canvas-soft text-[11px] font-bold text-ink-muted"
        >
          {nombre.charAt(0).toUpperCase()}
        </div>
      ))}
      {extra > 0 && (
        <div
          title={nombres.slice(MAX_AVATARES).join(", ")}
          className="flex size-8 items-center justify-center rounded-full border-2 border-canvas bg-primary/10 text-[10px] font-bold text-primary"
        >
          +{extra}
        </div>
      )}
    </div>
  );
}

/** "3 de 4 cubiertos" cuando el bloque viene de la plantilla; si no, solo el conteo. */
function textoCobertura(bloque: BloqueHoy): string {
  if (bloque.requeridas === null) {
    return `${bloque.asignados.length} persona${bloque.asignados.length === 1 ? "" : "s"} · fuera de plantilla`;
  }
  const faltan = bloque.requeridas - bloque.asignados.length;
  const cobertura = `${bloque.asignados.length} de ${bloque.requeridas} cubiertos`;
  return faltan > 0 ? `${cobertura} · faltan ${faltan}` : `${cobertura} · completo`;
}

export function TodaysShifts({ bloques }: { bloques: BloqueHoy[] }) {
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

      {bloques.length === 0 ? (
        <p className="p-6 text-body-sm text-ink-muted">
          Hoy no hay ningún turno planificado.
        </p>
      ) : (
        <div className="divide-y divide-hairline">
          {bloques.map((bloque) => (
            <div
              key={bloque.clave}
              className="flex flex-col gap-6 p-6 transition-colors hover:bg-canvas-soft/50 md:flex-row md:items-center"
            >
              <div className="min-w-[140px]">
                <p className="text-label-caps uppercase text-ink-muted">
                  {FRANJA_LABEL[bloque.franja]}
                </p>
                <p className="text-h3 text-ink">
                  {bloque.horaInicio} - {bloque.horaFin}
                </p>
              </div>

              <div
                className={cn(
                  "flex-1 rounded-r-lg border-l-4 py-2 pl-4",
                  FRANJA_STYLES[bloque.franja],
                )}
              >
                <h4 className="text-title-md text-ink">
                  {bloque.titulo ?? "Turno puntual"}
                  {bloque.localNombre && (
                    <span className="text-ink-muted"> · {bloque.localNombre}</span>
                  )}
                </h4>
                <p className="text-body-sm text-ink-muted">
                  {textoCobertura(bloque)}
                </p>
              </div>

              <AvatarStack nombres={bloque.asignados} />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
