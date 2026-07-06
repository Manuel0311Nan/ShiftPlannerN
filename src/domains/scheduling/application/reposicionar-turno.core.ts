import { DomainError, fail, ok, type Result } from "@/shared/kernel/result";
import type { TurnoRepository } from "@/domains/scheduling/application/ports/turno-repository.port";
import {
  puedeGestionarLocal,
  type TurnoCommandContext,
} from "@/domains/scheduling/application/turno-authz";
import { inicioSemana } from "@/domains/scheduling/domain/semana";
import {
  disponibilidadCubre,
  intervalosSolapan,
} from "@/domains/scheduling/domain/solapamiento";

export type ReposicionarTurnoArgs = {
  turnoId: string;
  inicio: Date;
  fin: Date;
  /** Empleado destino; si se omite se mantiene el actual del turno. */
  reasignarA?: string;
  context: TurnoCommandContext;
};

/**
 * Núcleo compartido por MoveTurnoCommand (permite reasignar) y
 * UpdateTurnoCommand (solo horas). Valida permiso, franja, pertenencia al
 * local y solapes; la disponibilidad no cubierta es advertencia, no error.
 */
export async function reposicionarTurno(
  repo: TurnoRepository,
  args: ReposicionarTurnoArgs,
): Promise<Result<{ advertencias: string[] }>> {
  const turno = await repo.buscarTurno(args.turnoId);
  if (!turno) {
    return fail(new DomainError("Turno no encontrado", "TURNO_NO_ENCONTRADO"));
  }

  if (!puedeGestionarLocal(args.context, turno.managerId)) {
    return fail(new DomainError("No autorizado", "NO_AUTORIZADO"));
  }

  if (args.fin.getTime() <= args.inicio.getTime()) {
    return fail(
      new DomainError("La hora de fin debe ser posterior al inicio", "HORAS_INVERTIDAS"),
    );
  }

  if (turno.localId === null) {
    return fail(
      new DomainError(
        "El empleado del turno no pertenece a ningún local",
        "EMPLEADO_FUERA_DE_LOCAL",
      ),
    );
  }

  const nuevoUsuarioId = args.reasignarA ?? turno.usuarioId;
  const empleados = await repo.empleadosDeLocal(turno.localId);
  const empleadoDestino = empleados.find((e) => e.id === nuevoUsuarioId);
  if (!empleadoDestino) {
    return fail(
      new DomainError(
        "El empleado no pertenece a este local",
        "EMPLEADO_FUERA_DE_LOCAL",
      ),
    );
  }

  const turnosSemana = await repo.turnosDeLocalEnSemana(
    turno.localId,
    inicioSemana(args.inicio),
  );
  const solapa = turnosSemana.some(
    (t) =>
      t.id !== turno.id &&
      t.usuarioId === nuevoUsuarioId &&
      intervalosSolapan({ inicio: args.inicio, fin: args.fin }, t),
  );
  if (solapa) {
    return fail(
      new DomainError("El turno se solapa con otro del empleado", "TURNO_SOLAPADO"),
    );
  }

  const advertencias: string[] = [];
  if (
    !disponibilidadCubre(empleadoDestino.disponibilidad, {
      inicio: args.inicio,
      fin: args.fin,
    })
  ) {
    advertencias.push(
      "El empleado no tiene disponibilidad declarada para esta franja",
    );
  }

  await repo.moverTurno(turno.id, {
    inicio: args.inicio,
    fin: args.fin,
    usuarioId: nuevoUsuarioId,
  });

  return ok({ advertencias });
}
