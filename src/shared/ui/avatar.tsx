import { cn } from "@/lib/utils";

const SIZES = {
  sm: "size-8 text-[11px]",
  md: "size-10 text-[13px]",
  lg: "size-14 text-body-lg",
  xl: "size-24 text-h3",
} as const;

function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

/**
 * Avatar por iniciales, agnóstico de dominio. No usa imágenes externas: el
 * diseño de Stitch mostraba retratos, pero la app no persiste fotos, así que
 * derivamos las iniciales del nombre. `online` pinta el punto de estado.
 */
export function Avatar({
  nombre,
  size = "md",
  online,
  className,
}: {
  nombre: string;
  size?: keyof typeof SIZES;
  online?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("relative shrink-0", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-primary/10 font-bold text-primary",
          SIZES[size],
        )}
        aria-hidden
      >
        {iniciales(nombre)}
      </div>
      {online && (
        <span
          className="absolute bottom-0 right-0 block size-1/4 rounded-full border-2 border-surface bg-accent-green"
          aria-label="En línea"
        />
      )}
    </div>
  );
}
