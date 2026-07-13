import { cn } from "@/lib/utils";
import { DIAS_SEMANA, type DiaSemana } from "@/shared/kernel/dia-semana";

type Bloque = {
  diaSemana: DiaSemana;
  horaInicio: string;
  horaFin: string;
};

const DIA_LABEL: Record<DiaSemana, string> = {
  LUNES: "Lun",
  MARTES: "Mar",
  MIERCOLES: "Mié",
  JUEVES: "Jue",
  VIERNES: "Vie",
  SABADO: "Sáb",
  DOMINGO: "Dom",
};

type Franja = "morning" | "afternoon" | "night";

const FRANJA_STYLES: Record<Franja, { block: string; text: string; label: string }> =
  {
    morning: {
      block: "border-deep-sky-blue bg-deep-sky-blue/10",
      text: "text-deep-sky-blue",
      label: "Mañana",
    },
    afternoon: {
      block: "border-cool-horizon bg-cool-horizon/10",
      text: "text-cool-horizon",
      label: "Tarde",
    },
    night: {
      block: "border-fuchsia-plum bg-fuchsia-plum/10",
      text: "text-fuchsia-plum",
      label: "Noche",
    },
  };

function franjaDe(horaInicio: string): Franja {
  const hora = Number(horaInicio.slice(0, 2));
  if (hora < 12) return "morning";
  if (hora < 18) return "afternoon";
  return "night";
}

/**
 * Rejilla semanal de solo lectura con la disponibilidad del trabajador.
 * Reconstruye el patrón visual de tarjetas por día del diseño de Stitch,
 * coloreando cada bloque por su franja horaria.
 */
export function DisponibilidadSemana({ bloques }: { bloques: Bloque[] }) {
  const porDia = new Map<DiaSemana, Bloque[]>();
  for (const bloque of bloques) {
    const lista = porDia.get(bloque.diaSemana) ?? [];
    lista.push(bloque);
    porDia.set(bloque.diaSemana, lista);
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
      {DIAS_SEMANA.map((dia) => {
        const delDia = (porDia.get(dia) ?? []).sort((a, b) =>
          a.horaInicio.localeCompare(b.horaInicio),
        );
        return (
          <div
            key={dia}
            className="flex flex-col overflow-hidden rounded-lg border border-hairline bg-surface"
          >
            <div className="border-b border-hairline bg-canvas-soft p-3 text-center">
              <span className="block text-label-caps uppercase text-ink-muted">
                {DIA_LABEL[dia]}
              </span>
            </div>
            <div className="flex min-h-[92px] flex-col gap-1.5 p-2">
              {delDia.length === 0 ? (
                <span className="mt-6 text-center text-body-sm italic text-ink-faint">
                  Libre
                </span>
              ) : (
                delDia.map((bloque, i) => {
                  const franja = franjaDe(bloque.horaInicio);
                  const styles = FRANJA_STYLES[franja];
                  return (
                    <div
                      key={`${bloque.horaInicio}-${i}`}
                      className={cn("rounded border-l-4 p-1.5", styles.block)}
                    >
                      <span
                        className={cn(
                          "text-[10px] font-bold uppercase",
                          styles.text,
                        )}
                      >
                        {styles.label}
                      </span>
                      <span className="block text-[13px] font-semibold leading-tight text-ink">
                        {bloque.horaInicio} - {bloque.horaFin}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
