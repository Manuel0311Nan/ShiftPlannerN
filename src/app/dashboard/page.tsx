import Link from "next/link";
import { Plus } from "lucide-react";
import { auth } from "@/auth";
import { Button } from "@/shared/ui/button";
import { GetDashboardOverviewQuery } from "@/domains/scheduling/application/get-dashboard-overview.query";
import { PrismaDashboardOverviewRepository } from "@/domains/scheduling/infrastructure/dashboard-overview.repository";
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
  const { name: nombre, id: usuarioId, rol, empresaId } = session!.user;

  const query = new GetDashboardOverviewQuery(
    new PrismaDashboardOverviewRepository(empresaId),
  );
  const overview = await query.execute({ usuarioId, rol });

  const puedeCrearTurnos = rol !== "EMPLOYEE";

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
        {/* Los turnos se crean sobre el calendario de Horarios, no hay vista propia. */}
        {puedeCrearTurnos && (
          <Button asChild className="shadow-md">
            <Link href="/dashboard/horarios">
              <Plus className="size-4" />
              Crear turno
            </Link>
          </Button>
        )}
      </div>

      {/* Bento grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        <WeeklyHoursCard
          barras={overview.barrasSemana}
          totalHoras={overview.metricas.horasProgramadas}
        />
        <TodaysShifts bloques={overview.bloquesHoy} />
        <QuickActions
          solicitudesPendientes={overview.metricas.solicitudesPendientes}
        />
      </div>

      {/* Métricas */}
      <MetricsRow metricas={overview.metricas} />
    </div>
  );
}
