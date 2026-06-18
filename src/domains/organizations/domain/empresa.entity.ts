import { DomainError, fail, ok, type Result } from "@/shared/kernel/result";

const TRIAL_DURATION_DAYS = 30;

export class Empresa {
  private constructor(
    readonly nombre: string,
    readonly trialEndsAt: Date,
    readonly id?: string,
  ) {}

  static create(props: { nombre: string }): Result<Empresa> {
    const nombre = props.nombre.trim();
    if (nombre.length < 2) {
      return fail(
        new DomainError(
          "El nombre de la empresa debe tener al menos 2 caracteres",
          "EMPRESA_NOMBRE_INVALIDO",
        ),
      );
    }

    const trialEndsAt = new Date(
      Date.now() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000,
    );
    return ok(new Empresa(nombre, trialEndsAt));
  }

  static fromPersistence(props: {
    id: string;
    nombre: string;
    trialEndsAt: Date;
  }): Empresa {
    return new Empresa(props.nombre, props.trialEndsAt, props.id);
  }
}
