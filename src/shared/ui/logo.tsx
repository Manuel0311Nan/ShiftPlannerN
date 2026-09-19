import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------
 * Logo EonLab (manual de identidad, sept. 2026).
 * El anillo es órbita y ciclo cerrado a la vez; el nodo violeta es la
 * "chispa" del laboratorio. El símbolo hereda `currentColor`, así que el
 * mismo componente vale sobre fondo claro y sobre el ink.
 * ---------------------------------------------------------------------- */

type LogoSize = "sm" | "md" | "lg";

const MARK_SIZE: Record<LogoSize, number> = { sm: 20, md: 26, lg: 34 };

const WORDMARK: Record<LogoSize, string> = {
  sm: "text-[17px]",
  md: "text-[22px]",
  lg: "text-[28px]",
};

export function LogoMark({
  size = "md",
  className,
}: {
  readonly size?: LogoSize;
  readonly className?: string;
}) {
  const px = MARK_SIZE[size];
  return (
    <svg
      aria-hidden
      width={px}
      height={px}
      viewBox="0 0 32 32"
      fill="none"
      className={cn("shrink-0", className)}
    >
      <circle
        cx="15"
        cy="17"
        r="12"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <circle cx="15" cy="17" r="2.6" fill="currentColor" />
      <circle cx="25.5" cy="6.5" r="4.5" fill="var(--eon-violet)" />
    </svg>
  );
}

export function Logo({
  size = "md",
  tagline = false,
  className,
}: {
  readonly size?: LogoSize;
  readonly tagline?: boolean;
  readonly className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark size={size} />
      <span className="inline-flex flex-col leading-none">
        <span
          className={cn(
            "font-brand font-bold tracking-[-0.02em]",
            WORDMARK[size],
          )}
        >
          Eon<span className="text-eon-violet">Lab</span>
        </span>
        {tagline ? (
          <span className="mt-1 text-[9px] font-medium uppercase tracking-[0.18em] opacity-60">
            Construimos para que dure
          </span>
        ) : null}
      </span>
    </span>
  );
}
