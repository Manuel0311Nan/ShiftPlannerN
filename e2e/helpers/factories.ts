import { hashPassword } from "../../src/shared/kernel/password";
import { E2E_PREFIJO, emailE2E, fechaSql, idUnico, query } from "./db";

export const PASSWORD_E2E = "e2e-password-123";

export const DIAS_LABORABLES = [
  "LUNES",
  "MARTES",
  "MIERCOLES",
  "JUEVES",
  "VIERNES",
] as const;

/** Bloque estándar de los tests: jornada de 8h, una persona requerida. */
export const BLOQUE = { horaInicio: "09:00", horaFin: "17:00" } as const;

export type EmpleadoSeed = {
  nombre: string;
  /** Mínimo blando de horas semanales. Por defecto 40. */
  horasContrato?: number;
  /** Días de libranza: el tope duro de días trabajados es `7 - diasLibres`. */
  diasLibres?: number;
};

export type PersonaSeed = {
  id: string;
  email: string;
  nombre: string;
  password: string;
};

export type EmpresaSeed = {
  empresaId: string;
  empresaNombre: string;
  localId: string;
  localNombre: string;
  admin: PersonaSeed;
  empleados: PersonaSeed[];
};

async function crearUsuario(input: {
  empresaId: string;
  email: string;
  nombre: string;
  passwordHash: string;
  rol: "ADMIN" | "MANAGER" | "EMPLOYEE";
  managerId?: string;
  localId?: string;
  horasContrato?: number;
  diasLibres?: number;
}): Promise<string> {
  const id = idUnico();
  await query(
    `INSERT INTO "Usuario"
       ("id", "email", "nombre", "passwordHash", "rol", "horasContrato", "diasLibres",
        "empresaId", "managerId", "localId", "metadata", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5::"Rol", $6, $7, $8, $9, $10, '{}'::jsonb, NOW(), NOW())`,
    [
      id,
      input.email,
      input.nombre,
      input.passwordHash,
      input.rol,
      input.horasContrato ?? 40,
      input.diasLibres ?? 0,
      input.empresaId,
      input.managerId ?? null,
      input.localId ?? null,
    ],
  );
  return id;
}

/**
 * Crea una empresa completa lista para generar horarios: admin que además
 * gestiona un local, plantilla de lunes a viernes y empleados con
 * disponibilidad que cubre esos bloques.
 *
 * Se hace por SQL y no por la UI a propósito: el alta por pantalla ya tiene su
 * propio test; el resto de specs solo necesita el estado de partida.
 */
export async function seedEmpresa(
  opciones: { etiqueta: string; empleados?: EmpleadoSeed[] } = { etiqueta: "base" },
): Promise<EmpresaSeed> {
  const { etiqueta } = opciones;
  const empleadosSeed = opciones.empleados ?? [
    { nombre: "Empleada Uno", horasContrato: 40, diasLibres: 2 },
  ];

  const empresaId = idUnico();
  const empresaNombre = `${E2E_PREFIJO}${etiqueta}-${empresaId.slice(0, 8)}`;
  const passwordHash = await hashPassword(PASSWORD_E2E);
  const trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await query(
    `INSERT INTO "Empresa" ("id", "nombre", "configuracion", "trialEndsAt", "createdAt", "updatedAt")
     VALUES ($1, $2, '{}'::jsonb, $3, NOW(), NOW())`,
    [empresaId, empresaNombre, fechaSql(trialEndsAt)],
  );

  const adminEmail = emailE2E("admin");
  const adminId = await crearUsuario({
    empresaId,
    email: adminEmail,
    nombre: "Admin E2E",
    passwordHash,
    rol: "ADMIN",
  });

  const localId = idUnico();
  const localNombre = `Local ${etiqueta}`;
  await query(
    `INSERT INTO "Local" ("id", "nombre", "empresaId", "managerId", "createdAt")
     VALUES ($1, $2, $3, $4, NOW())`,
    [localId, localNombre, empresaId, adminId],
  );

  for (const diaSemana of DIAS_LABORABLES) {
    await query(
      `INSERT INTO "PlantillaTurno"
         ("id", "empresaId", "localId", "diaSemana", "nombre", "horaInicio", "horaFin",
          "personasRequeridas", "createdAt")
       VALUES ($1, $2, $3, $4::"DiaSemana", 'Jornada', $5, $6, 1, NOW())`,
      [idUnico(), empresaId, localId, diaSemana, BLOQUE.horaInicio, BLOQUE.horaFin],
    );
  }

  const empleados: PersonaSeed[] = [];
  for (const empleado of empleadosSeed) {
    const email = emailE2E("empleado");
    const usuarioId = await crearUsuario({
      empresaId,
      email,
      nombre: empleado.nombre,
      passwordHash,
      rol: "EMPLOYEE",
      managerId: adminId,
      localId,
      horasContrato: empleado.horasContrato ?? 40,
      diasLibres: empleado.diasLibres ?? 2,
    });

    for (const diaSemana of DIAS_LABORABLES) {
      await query(
        `INSERT INTO "Disponibilidad"
           ("id", "empresaId", "usuarioId", "diaSemana", "horaInicio", "horaFin", "createdAt")
         VALUES ($1, $2, $3, $4::"DiaSemana", $5, $6, NOW())`,
        [idUnico(), empresaId, usuarioId, diaSemana, BLOQUE.horaInicio, BLOQUE.horaFin],
      );
    }

    empleados.push({
      id: usuarioId,
      email,
      nombre: empleado.nombre,
      password: PASSWORD_E2E,
    });
  }

  return {
    empresaId,
    empresaNombre,
    localId,
    localNombre,
    admin: { id: adminId, email: adminEmail, nombre: "Admin E2E", password: PASSWORD_E2E },
    empleados,
  };
}

/** Lunes de la semana de `referencia` a medianoche local. */
export function lunesDeLaSemana(referencia = new Date()): Date {
  const fecha = new Date(referencia);
  fecha.setHours(0, 0, 0, 0);
  const dia = fecha.getDay();
  fecha.setDate(fecha.getDate() + (dia === 0 ? -6 : 1 - dia));
  return fecha;
}

/** "YYYY-MM-DD" en horario local (no usar toISOString: desplaza el día). */
export function formatoFecha(fecha: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${fecha.getFullYear()}-${p(fecha.getMonth() + 1)}-${p(fecha.getDate())}`;
}
