import { Card } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { asistenciaPlaceholder } from "./placeholder-data";

export function AttendanceCard() {
  const { porcentaje, delta, presentes, total, aTiempo, aTiempoPct } =
    asistenciaPlaceholder;

  return (
    <Card interactive className="flex flex-col justify-between md:col-span-4">
      <div>
        <div className="mb-4 flex items-start justify-between">
          <h3 className="text-title-md text-ink">Asistencia del personal</h3>
          <Badge variant="success">EN VIVO</Badge>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-display-sm text-ink">{porcentaje}%</span>
          <span className="text-sm font-bold text-accent-green">{delta}</span>
        </div>
        <p className="mt-2 text-body-sm text-ink-muted">
          {presentes} de {total} personas han fichado en sus rotaciones
          programadas.
        </p>
      </div>

      <div className="mt-6 border-t border-hairline pt-6">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-label-caps uppercase text-ink-muted">
            A tiempo
          </span>
          <span className="text-label-caps uppercase text-ink">{aTiempo}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-canvas-soft">
          <div
            className="h-full rounded-full bg-accent-green"
            style={{ width: `${aTiempoPct}%` }}
          />
        </div>
      </div>
    </Card>
  );
}
