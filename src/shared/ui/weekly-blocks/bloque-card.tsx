import { cn } from "@/lib/utils";
import type { BloqueSemanal } from "./types";

function colorFranja(horaInicio: string): string {
  const hora = Number(horaInicio.split(":")[0]);
  if (hora < 12) return "border-deep-sky-blue/30 bg-deep-sky-blue-soft text-deep-sky-blue";
  if (hora < 19) return "border-cool-horizon/30 bg-cool-horizon-soft text-cool-horizon";
  return "border-fuchsia-plum/30 bg-fuchsia-plum-soft text-fuchsia-plum";
}

export function BloqueCard({
  bloque,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { bloque: BloqueSemanal }) {
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
    </div>
  );
}
