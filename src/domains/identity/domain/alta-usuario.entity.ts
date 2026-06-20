import { EMAIL_REGEX } from "@/shared/kernel/email";
import { DomainError, fail, ok, type Result } from "@/shared/kernel/result";
import type { Rol } from "@/domains/identity/domain/usuario.entity";
import {
  crearBloquePlantilla,
  type BloquePlantilla,
} from "@/domains/shifts/domain/bloque-plantilla";
import {
  crearBloqueDisponibilidad,
  type BloqueDisponibilidad,
} from "@/domains/employees/domain/bloque-disponibilidad";

export type NuevoUsuarioRol = "MANAGER" | "EMPLOYEE";

export type BloquePlantillaInput = {
  diaSemana: string;
  nombre: string;
  horaInicio: string;
  horaFin: string;
  personasRequeridas: number;
};

export type BloqueDisponibilidadInput = {
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
};

/**
 * Valida quién puede crear a quién (y con qué datos) al dar de alta una
 * cuenta directamente desde el panel — reemplaza la antigua `Invitacion`,
 * ahora sin token/expiración porque la cuenta queda activa al instante.
 */
export class AltaUsuario {
  private constructor(
    readonly email: string,
    readonly nombre: string,
    readonly rol: NuevoUsuarioRol,
    readonly creadoPorId: string,
    readonly managerId: string | null,
    readonly localNombre: string | null,
    readonly plantilla: BloquePlantilla[],
    readonly localId: string | null,
    readonly disponibilidad: BloqueDisponibilidad[],
  ) {}

  static create(props: {
    email: string;
    nombre: string;
    rol: NuevoUsuarioRol;
    creadoPorId: string;
    creadoPorRol: Rol;
    managerId?: string | null;
    localNombre?: string;
    plantilla?: BloquePlantillaInput[];
    localId?: string | null;
    disponibilidad?: BloqueDisponibilidadInput[];
  }): Result<AltaUsuario> {
    const email = props.email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(email)) {
      return fail(new DomainError("Email inválido", "ALTA_EMAIL_INVALIDO"));
    }

    const nombre = props.nombre.trim();
    if (nombre.length < 2) {
      return fail(
        new DomainError(
          "El nombre debe tener al menos 2 caracteres",
          "ALTA_NOMBRE_INVALIDO",
        ),
      );
    }

    if (props.creadoPorRol === "EMPLOYEE") {
      return fail(
        new DomainError(
          "Un empleado no puede crear otras cuentas",
          "ALTA_ROL_NO_PERMITIDO",
        ),
      );
    }

    if (props.rol === "MANAGER" && props.creadoPorRol !== "ADMIN") {
      return fail(
        new DomainError(
          "Solo un administrador puede crear un manager",
          "ALTA_ROL_NO_PERMITIDO",
        ),
      );
    }

    let managerId: string | null = null;
    let localNombre: string | null = null;
    let plantilla: BloquePlantilla[] = [];
    let localId: string | null = null;
    let disponibilidad: BloqueDisponibilidad[] = [];

    if (props.rol === "MANAGER") {
      const nombreLocal = (props.localNombre ?? "").trim();
      if (nombreLocal.length < 2) {
        return fail(
          new DomainError(
            "El nombre del local debe tener al menos 2 caracteres",
            "ALTA_LOCAL_INVALIDO",
          ),
        );
      }
      if (!props.plantilla || props.plantilla.length === 0) {
        return fail(
          new DomainError(
            "El local necesita al menos un bloque de turno",
            "ALTA_PLANTILLA_VACIA",
          ),
        );
      }
      const bloques: BloquePlantilla[] = [];
      for (const bloque of props.plantilla) {
        const result = crearBloquePlantilla(bloque);
        if (!result.success) return result;
        bloques.push(result.value);
      }
      localNombre = nombreLocal;
      plantilla = bloques;
    }

    if (props.rol === "EMPLOYEE") {
      if (props.creadoPorRol === "MANAGER") {
        managerId = props.creadoPorId;
      } else if (!props.managerId) {
        return fail(
          new DomainError(
            "Debes seleccionar un manager",
            "ALTA_SIN_MANAGER",
          ),
        );
      } else {
        managerId = props.managerId;
      }

      if (!props.disponibilidad || props.disponibilidad.length === 0) {
        return fail(
          new DomainError(
            "El trabajador necesita al menos un bloque de disponibilidad",
            "ALTA_DISPONIBILIDAD_VACIA",
          ),
        );
      }
      const bloques: BloqueDisponibilidad[] = [];
      for (const bloque of props.disponibilidad) {
        const result = crearBloqueDisponibilidad(bloque);
        if (!result.success) return result;
        bloques.push(result.value);
      }
      disponibilidad = bloques;
      localId = props.localId ?? null;
    }

    return ok(
      new AltaUsuario(
        email,
        nombre,
        props.rol,
        props.creadoPorId,
        managerId,
        localNombre,
        plantilla,
        localId,
        disponibilidad,
      ),
    );
  }
}
