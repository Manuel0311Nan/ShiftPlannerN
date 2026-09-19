import { cn } from "@/lib/utils";
import type { BloqueSemanal } from "./types";

function colorFranja(horaInicio: string): string {
  const hora = Number(horaInicio.split(":")[0]);
  if (hora < 12) return "border-shift-morning/30 bg-shift-morning-soft text-shift-morning";
  if (hora < 19) return "border-shift-afternoon/30 bg-shift-afternoon-soft text-shift-afternoon";
  return "border-shift-night/30 bg-shift-night-soft text-shift-night";
}

export function BloqueCard({
  bloque,
  solapado = false,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  bloque: BloqueSemanal;
  /** Pisa a otro bloque del día: se marca como información, no como error. */
  solapado?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex w-full cursor-pointer flex-col gap-0.5 rounded-md border px-2.5 py-2 text-left text-xs transition-transform hover:-translate-y-0.5 hover:shadow-sm",
        colorFranja(bloque.horaInicio),
        className,
      )}
      {...props}
    >
      {bloque.nombre && <span className="font-semibold">{bloque.nombre}</span>}
      <span className="tabular-nums">
        {bloque.horaInicio}–{bloque.horaFin}
      </span>
      {bloque.personasRequeridas !== undefined && (
        <span className="text-[11px] opacity-80">
          {bloque.personasRequeridas} {bloque.personasRequeridas === 1 ? "persona" : "personas"}
        </span>
      )}
      {solapado && (
        <span className="text-[11px] opacity-70">Se suma a otro turno</span>
      )}
    </div>
  );
}
