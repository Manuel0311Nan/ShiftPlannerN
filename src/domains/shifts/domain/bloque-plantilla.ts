import { esDiaSemana, type DiaSemana } from "@/shared/kernel/dia-semana";
import { HORA_REGEX } from "@/shared/kernel/hora";
import { DomainError, fail, ok, type Result } from "@/shared/kernel/result";

export type BloquePlantilla = {
  diaSemana: DiaSemana;
  nombre: string;
  horaInicio: string;
  horaFin: string;
  personasRequeridas: number;
};

export function crearBloquePlantilla(props: {
  diaSemana: string;
  nombre: string;
  horaInicio: string;
  horaFin: string;
  personasRequeridas: number;
}): Result<BloquePlantilla> {
  if (!esDiaSemana(props.diaSemana)) {
    return fail(
      new DomainError("Día de la semana inválido", "BLOQUE_DIA_INVALIDO"),
    );
  }
  if (!HORA_REGEX.test(props.horaInicio) || !HORA_REGEX.test(props.horaFin)) {
    return fail(new DomainError("Hora inválida", "BLOQUE_HORA_INVALIDA"));
  }
  if (props.horaInicio >= props.horaFin) {
    return fail(
      new DomainError(
        "La hora de inicio debe ser anterior a la de fin",
        "BLOQUE_RANGO_INVALIDO",
      ),
    );
  }
  const nombre = props.nombre.trim();
  if (nombre.length < 2) {
    return fail(
      new DomainError("El nombre del turno es muy corto", "BLOQUE_NOMBRE_INVALIDO"),
    );
  }
  if (props.personasRequeridas < 1) {
    return fail(
      new DomainError(
        "Debe requerir al menos 1 persona",
        "BLOQUE_PERSONAS_INVALIDO",
      ),
    );
  }

  return ok({
    diaSemana: props.diaSemana,
    nombre,
    horaInicio: props.horaInicio,
    horaFin: props.horaFin,
    personasRequeridas: props.personasRequeridas,
  });
}
