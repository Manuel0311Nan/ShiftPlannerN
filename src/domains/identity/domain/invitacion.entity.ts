import { randomBytes } from "node:crypto";
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

export type InvitacionRol = "MANAGER" | "EMPLOYEE";

const INVITATION_EXPIRY_DAYS = 7;

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

export class Invitacion {
  private constructor(
    readonly email: string,
    readonly rol: InvitacionRol,
    readonly invitadoPorId: string,
    readonly managerId: string | null,
    readonly token: string,
    readonly expiresAt: Date,
    readonly localNombre: string | null,
    readonly plantilla: BloquePlantilla[],
    readonly localId: string | null,
    readonly disponibilidad: BloqueDisponibilidad[],
  ) {}

  static create(props: {
    email: string;
    rol: InvitacionRol;
    invitadoPorId: string;
    invitadoPorRol: Rol;
    managerId?: string | null;
    localNombre?: string;
    plantilla?: BloquePlantillaInput[];
    localId?: string | null;
    disponibilidad?: BloqueDisponibilidadInput[];
  }): Result<Invitacion> {
    const email = props.email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(email)) {
      return fail(
        new DomainError("Email inválido", "INVITACION_EMAIL_INVALIDO"),
      );
    }

    if (props.invitadoPorRol === "EMPLOYEE") {
      return fail(
        new DomainError(
          "Un empleado no puede enviar invitaciones",
          "INVITACION_ROL_NO_PERMITIDO",
        ),
      );
    }

    if (props.rol === "MANAGER" && props.invitadoPorRol !== "ADMIN") {
      return fail(
        new DomainError(
          "Solo un administrador puede invitar a un manager",
          "INVITACION_ROL_NO_PERMITIDO",
        ),
      );
    }

    let managerId: string | null = null;
    let localNombre: string | null = null;
    let plantilla: BloquePlantilla[] = [];
    let localId: string | null = null;
    let disponibilidad: BloqueDisponibilidad[] = [];

    if (props.rol === "MANAGER") {
      const nombre = (props.localNombre ?? "").trim();
      if (nombre.length < 2) {
        return fail(
          new DomainError(
            "El nombre del local debe tener al menos 2 caracteres",
            "INVITACION_LOCAL_INVALIDO",
          ),
        );
      }
      if (!props.plantilla || props.plantilla.length === 0) {
        return fail(
          new DomainError(
            "El local necesita al menos un bloque de turno",
            "INVITACION_PLANTILLA_VACIA",
          ),
        );
      }
      const bloques: BloquePlantilla[] = [];
      for (const bloque of props.plantilla) {
        const result = crearBloquePlantilla(bloque);
        if (!result.success) return result;
        bloques.push(result.value);
      }
      localNombre = nombre;
      plantilla = bloques;
    }

    if (props.rol === "EMPLOYEE") {
      if (props.invitadoPorRol === "MANAGER") {
        managerId = props.invitadoPorId;
      } else if (!props.managerId) {
        return fail(
          new DomainError(
            "Debes seleccionar un manager",
            "INVITACION_SIN_MANAGER",
          ),
        );
      } else {
        managerId = props.managerId;
      }

      if (!props.disponibilidad || props.disponibilidad.length === 0) {
        return fail(
          new DomainError(
            "El trabajador necesita al menos un bloque de disponibilidad",
            "INVITACION_DISPONIBILIDAD_VACIA",
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

    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(
      Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    );

    return ok(
      new Invitacion(
        email,
        props.rol,
        props.invitadoPorId,
        managerId,
        token,
        expiresAt,
        localNombre,
        plantilla,
        localId,
        disponibilidad,
      ),
    );
  }
}
