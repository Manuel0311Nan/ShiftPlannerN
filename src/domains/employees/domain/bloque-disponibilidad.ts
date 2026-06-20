import { esDiaSemana, type DiaSemana } from "@/shared/kernel/dia-semana";
import { HORA_REGEX } from "@/shared/kernel/hora";
import { DomainError, fail, ok, type Result } from "@/shared/kernel/result";

export type BloqueDisponibilidad = {
  diaSemana: DiaSemana;
  horaInicio: string;
  horaFin: string;
};

export function crearBloqueDisponibilidad(props: {
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
}): Result<BloqueDisponibilidad> {
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

  return ok({
    diaSemana: props.diaSemana,
    horaInicio: props.horaInicio,
    horaFin: props.horaFin,
  });
}
