import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DIAS_SEMANA } from "@/shared/kernel/dia-semana";
import { Card } from "@/shared/ui/card";
import { HorarioSemanaBoard } from "@/domains/scheduling/ui/horario-semana-board";
import type { TurnoVista } from "@/domains/scheduling/ui/board-utils";
import { GenerateForm } from "./generate-form";
import { SemanaNav } from "@/domains/scheduling/ui/semana-nav";

function lunesDeEstaSemana(): Date {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const dia = hoy.getDay();
  const diff = dia === 0 ? -6 : 1 - dia;
  hoy.setDate(hoy.getDate() + diff);
  return hoy;
}

function formatoFecha(fecha: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${fecha.getFullYear()}-${p(fecha.getMonth() + 1)}-${p(fecha.getDate())}`;
}

// No usar `new Date("YYYY-MM-DD")`: lo interpreta como medianoche UTC, no
// local, y desincroniza este parseo con `lunesDeEstaSemana()`.
function parsearFechaLocal(valor: string): Date {
  const [año, mes, dia] = valor.split("-").map(Number);
  return new Date(año, mes - 1, dia);
}

function origenDeTurno(metadata: unknown): TurnoVista["origen"] {
  if (
    metadata &&
    typeof metadata === "object" &&
    (metadata as Record<string, unknown>).origen === "manual"
  ) {
    return "manual";
  }
  return "generado";
}

export default async function HorariosPage({
  searchParams,
}: {
  searchParams: Promise<{ localId?: string; semana?: string }>;
}) {
  const session = await auth();
  const { empresaId, id: usuarioId, rol } = session!.user;
  const params = await searchParams;

  const semanaInicio = params.semana
    ? parsearFechaLocal(params.semana)
    : lunesDeEstaSemana();
  const semanaFin = new Date(semanaInicio);
  semanaFin.setDate(semanaFin.getDate() + 7);
  const semanaStr = formatoFecha(semanaInicio);

  if (rol === "EMPLOYEE") {
    const turnos = await prisma.turno.findMany({
      where: { usuarioId, empresaId, inicio: { gte: semanaInicio, lt: semanaFin } },
      orderBy: { inicio: "asc" },
    });

    const turnosVista: TurnoVista[] = turnos.map((turno) => ({
      id: turno.id,
      usuarioId: turno.usuarioId,
      usuarioNombre: session!.user.name ?? "",
      inicioIso: turno.inicio.toISOString(),
      finIso: turno.fin.toISOString(),
      origen: origenDeTurno(turno.metadata),
    }));

    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-[26px] font-bold leading-[1.23] tracking-[-0.625px] text-ink">
            Mis turnos
          </h1>
          <SemanaNav semanaInicio={semanaStr} />
        </div>
        <HorarioSemanaBoard
          localId=""
          semanaInicio={semanaStr}
          turnos={turnosVista}
          empleados={[]}
          requeridasPorDia={[0, 0, 0, 0, 0, 0, 0]}
          readOnly
        />
      </div>
    );
  }

  const locales =
    rol === "ADMIN"
      ? await prisma.local.findMany({
          where: { empresaId },
          select: { id: true, nombre: true },
          orderBy: { nombre: "asc" },
        })
      : await prisma.local.findMany({
          where: { managerId: usuarioId },
          select: { id: true, nombre: true },
          orderBy: { nombre: "asc" },
        });

  const localId = params.localId ?? locales[0]?.id;

  const [turnos, empleados, plantilla] = localId
    ? await Promise.all([
        prisma.turno.findMany({
          where: {
            empresaId,
            usuario: { localId },
            inicio: { gte: semanaInicio, lt: semanaFin },
          },
          include: { usuario: { select: { nombre: true } } },
          orderBy: { inicio: "asc" },
        }),
        prisma.usuario.findMany({
          where: { localId, rol: "EMPLOYEE" },
          select: { id: true, nombre: true },
          orderBy: { nombre: "asc" },
        }),
        prisma.plantillaTurno.findMany({
          where: { localId },
          select: { diaSemana: true, personasRequeridas: true },
        }),
      ])
    : [[], [], []];

  const turnosVista: TurnoVista[] = turnos.map((turno) => ({
    id: turno.id,
    usuarioId: turno.usuarioId,
    usuarioNombre: turno.usuario.nombre,
    inicioIso: turno.inicio.toISOString(),
    finIso: turno.fin.toISOString(),
    origen: origenDeTurno(turno.metadata),
  }));

  const requeridasPorDia = DIAS_SEMANA.map((dia) =>
    plantilla
      .filter((bloque) => bloque.diaSemana === dia)
      .reduce((acc, bloque) => acc + bloque.personasRequeridas, 0),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold leading-[1.23] tracking-[-0.625px] text-ink">
            Horarios
          </h1>
          <p className="mt-1 text-[15px] text-ink-muted">
            Genera, arrastra y ajusta el horario semanal de tu local.
          </p>
        </div>
        {localId && <SemanaNav semanaInicio={semanaStr} />}
      </div>

      {locales.length === 0 ? (
        <Card className="bg-canvas-soft text-center text-[15px] text-ink-muted">
          Todavía no tienes ningún local. Se crea al invitar a un manager.
        </Card>
      ) : (
        <>
          <Card elevated>
            <GenerateForm
              locales={locales}
              localId={localId ?? ""}
              semana={semanaStr}
            />
            {localId && (
              <div className="mt-3 border-t border-hairline pt-3">
                <Link
                  href={`/dashboard/locales/${localId}`}
                  className="text-[14px] font-medium text-primary hover:underline"
                >
                  Editar plantilla del local
                </Link>
              </div>
            )}
          </Card>

          <HorarioSemanaBoard
            localId={localId ?? ""}
            semanaInicio={semanaStr}
            turnos={turnosVista}
            empleados={empleados}
            requeridasPorDia={requeridasPorDia}
            readOnly={false}
          />
        </>
      )}
    </div>
  );
}
