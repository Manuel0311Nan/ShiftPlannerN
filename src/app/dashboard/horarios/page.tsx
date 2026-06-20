import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/shared/ui/card";
import { GenerateForm } from "./generate-form";

const JS_DAY_LABELS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

function lunesDeEstaSemana(): Date {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const dia = hoy.getDay();
  const diff = dia === 0 ? -6 : 1 - dia;
  hoy.setDate(hoy.getDate() + diff);
  return hoy;
}

function formatoFecha(fecha: Date): string {
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${año}-${mes}-${dia}`;
}

// No usar `new Date("YYYY-MM-DD")`: lo interpreta como medianoche UTC, no
// local, y desincroniza este parseo con `lunesDeEstaSemana()`.
function parsearFechaLocal(valor: string): Date {
  const [año, mes, dia] = valor.split("-").map(Number);
  return new Date(año, mes - 1, dia);
}

function formatoHora(fecha: Date): string {
  return fecha.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
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

  if (rol === "EMPLOYEE") {
    const turnos = await prisma.turno.findMany({
      where: { usuarioId, empresaId, inicio: { gte: semanaInicio, lt: semanaFin } },
      orderBy: { inicio: "asc" },
    });

    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-[26px] font-bold leading-[1.23] tracking-[-0.625px] text-ink">
          Mis turnos
        </h1>
        {turnos.length === 0 ? (
          <Card className="bg-canvas-soft text-center text-[15px] text-ink-muted">
            No tienes turnos asignados esta semana.
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {turnos.map((turno) => (
              <Card key={turno.id} className="flex items-center justify-between">
                <span className="text-[15px] font-medium text-ink">
                  {JS_DAY_LABELS[turno.inicio.getDay()]}
                </span>
                <span className="text-[14px] text-ink-muted">
                  {formatoHora(turno.inicio)} – {formatoHora(turno.fin)}
                </span>
              </Card>
            ))}
          </div>
        )}
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

  const turnos = localId
    ? await prisma.turno.findMany({
        where: {
          empresaId,
          usuario: { localId },
          inicio: { gte: semanaInicio, lt: semanaFin },
        },
        include: { usuario: { select: { nombre: true } } },
        orderBy: { inicio: "asc" },
      })
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[26px] font-bold leading-[1.23] tracking-[-0.625px] text-ink">
          Horarios
        </h1>
        <p className="mt-1 text-[15px] text-ink-muted">
          Genera y consulta el horario semanal de tu local.
        </p>
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
              semana={formatoFecha(semanaInicio)}
            />
          </Card>

          {turnos.length === 0 ? (
            <Card className="bg-canvas-soft text-center text-[15px] text-ink-muted">
              No hay turnos generados para esta semana todavía.
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {turnos.map((turno) => (
                <Card key={turno.id} className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[15px] font-medium text-ink">
                      {JS_DAY_LABELS[turno.inicio.getDay()]}
                    </span>
                    <span className="text-[14px] text-ink-muted">
                      {turno.usuario.nombre}
                    </span>
                  </div>
                  <span className="text-[14px] text-ink-faint">
                    {formatoHora(turno.inicio)} – {formatoHora(turno.fin)}
                  </span>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
