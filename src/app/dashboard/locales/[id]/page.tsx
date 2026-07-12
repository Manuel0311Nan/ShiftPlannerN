import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DIAS_SEMANA, type DiaSemana } from "@/shared/kernel/dia-semana";
import { Card } from "@/shared/ui/card";
import { ConfirmDeleteButton } from "@/shared/ui/confirm-delete-button";
import { deleteLocalAction } from "@/app/actions/delete-local.action";
import { EditLocalForm } from "./edit-local-form";

export default async function LocalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { empresaId, rol, id: viewerId } = session!.user;
  if (rol === "EMPLOYEE") {
    notFound();
  }
  const { id } = await params;

  const local = await prisma.local.findFirst({
    where: { id, empresaId },
    select: {
      id: true,
      nombre: true,
      managerId: true,
      plantilla: {
        select: {
          diaSemana: true,
          nombre: true,
          horaInicio: true,
          horaFin: true,
          personasRequeridas: true,
        },
      },
    },
  });
  if (!local) {
    notFound();
  }
  if (rol === "MANAGER" && local.managerId !== viewerId) {
    notFound();
  }

  const ordenDia = new Map(DIAS_SEMANA.map((dia, i) => [dia, i]));
  const plantillaIniciales = [...local.plantilla]
    .sort(
      (a, b) =>
        (ordenDia.get(a.diaSemana as DiaSemana) ?? 0) -
          (ordenDia.get(b.diaSemana as DiaSemana) ?? 0) ||
        a.horaInicio.localeCompare(b.horaInicio),
    )
    .map((bloque) => ({
      diaSemana: bloque.diaSemana as DiaSemana,
      nombre: bloque.nombre,
      horaInicio: bloque.horaInicio,
      horaFin: bloque.horaFin,
      personasRequeridas: bloque.personasRequeridas,
    }));

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/dashboard/horarios?localId=${local.id}`}
        className="inline-flex items-center gap-1.5 text-[15px] text-ink-muted hover:text-ink"
      >
        <ArrowLeft size={16} />
        Volver a horarios
      </Link>

      <div>
        <h1 className="text-[26px] font-bold leading-[1.23] tracking-[-0.625px] text-ink">
          {local.nombre}
        </h1>
        <p className="mt-1 text-[15px] text-ink-muted">
          Edita el nombre y el horario semanal (plantilla de turnos) del local.
        </p>
      </div>

      <Card elevated>
        <EditLocalForm
          localId={local.id}
          nombre={local.nombre}
          plantillaIniciales={plantillaIniciales}
        />
      </Card>

      <Card>
        <div className="flex flex-col gap-3">
          <div>
            <h2 className="text-[17px] font-semibold text-ink">Zona de peligro</h2>
            <p className="text-[14px] text-ink-muted">
              Eliminar el local borra su plantilla de turnos; los trabajadores
              asignados quedarán sin local. No se puede deshacer.
            </p>
          </div>
          <ConfirmDeleteButton
            action={deleteLocalAction}
            input={{ localId: local.id }}
            confirmTitle={`¿Eliminar el local ${local.nombre}?`}
            confirmDescription="Se borrará su plantilla de turnos y los trabajadores quedarán sin local. Esta acción no se puede deshacer."
            label="Eliminar local"
            redirectTo="/dashboard/horarios"
          />
        </div>
      </Card>
    </div>
  );
}
