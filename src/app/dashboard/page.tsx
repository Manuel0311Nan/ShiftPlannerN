import { Plus } from "lucide-react";
import { auth } from "@/auth";
import { Button } from "@/shared/ui/button";
import { AttendanceCard } from "./_overview/attendance-card";
import { MetricsRow } from "./_overview/metrics-row";
import { QuickActions } from "./_overview/quick-actions";
import { TodaysShifts } from "./_overview/todays-shifts";
import { WeeklyHoursCard } from "./_overview/weekly-hours-card";

function saludo(fecha = new Date()): string {
  const hora = fecha.getHours();
  if (hora < 12) return "Buenos días";
  if (hora < 20) return "Buenas tardes";
  return "Buenas noches";
}

export default async function DashboardPage() {
  const session = await auth();
  const nombre = session!.user.name;

  return (
    <div>
      {/* Encabezado + CTA */}
      <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="mb-1 text-label-caps uppercase text-primary">
            Resumen del panel
          </p>
          <h1 className="text-h1 text-ink">
            {saludo()}, {nombre}
          </h1>
          <p className="mt-2 text-body-lg text-ink-muted">
            Esto es lo que ocurre hoy en tu centro.
          </p>
        </div>
        <Button className="shadow-md">
          <Plus className="size-4" />
          Crear turno
        </Button>
      </div>

      {/* Bento grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        <AttendanceCard />
        <WeeklyHoursCard />
        <TodaysShifts />
        <QuickActions />
      </div>

      {/* Métricas */}
      <MetricsRow />
    </div>
  );
}
