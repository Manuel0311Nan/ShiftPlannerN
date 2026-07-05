import type { PresetFranja } from "./types";

export const PRESETS_FRANJA: PresetFranja[] = [
  { label: "Mañana", rangos: [{ horaInicio: "09:00", horaFin: "14:00" }] },
  { label: "Tarde", rangos: [{ horaInicio: "16:00", horaFin: "21:00" }] },
  {
    label: "Partido",
    rangos: [
      { horaInicio: "09:00", horaFin: "14:00" },
      { horaInicio: "17:00", horaFin: "21:00" },
    ],
  },
  { label: "Todo el día", rangos: [{ horaInicio: "08:00", horaFin: "22:00" }] },
];

export function FranjaPresetButtons({
  onSelect,
  className,
}: {
  onSelect: (preset: PresetFranja) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="mb-1.5 text-xs font-medium text-ink-muted">Presets rápidos</p>
      <div className="flex flex-wrap gap-1.5">
        {PRESETS_FRANJA.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => onSelect(preset)}
            className="rounded-full border border-hairline bg-surface px-2.5 py-1 text-xs font-medium text-ink-secondary transition-colors hover:border-primary hover:text-primary"
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
