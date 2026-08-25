import { randomUUID } from "node:crypto";
import { Pool } from "pg";

/**
 * Los tests hablan con Postgres por `pg` y no por el cliente de Prisma: el
 * cliente generado es ESM (usa `import.meta`) y el runner de Playwright carga
 * los helpers en CommonJS. SQL directo también deja explícito qué toca cada
 * test, que es justo lo que se quiere verificar.
 */

/**
 * Marca de los datos creados por los e2e. Todo cuelga de una `Empresa` cuyo
 * nombre empieza por este prefijo, así el teardown la borra en cascada sin
 * tocar datos reales.
 */
export const E2E_PREFIJO = "E2E-";
export const E2E_DOMINIO = "e2e.eonlab.test";

let pool: Pool | undefined;

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL no está definida (¿falta .env / .env.test?)");
    }
    pool = new Pool({ connectionString, max: 4 });
  }
  return pool;
}

export async function query<T extends Record<string, unknown>>(
  texto: string,
  valores: unknown[] = [],
): Promise<T[]> {
  const resultado = await getPool().query(texto, valores);
  return resultado.rows as T[];
}

export async function queryUno<T extends Record<string, unknown>>(
  texto: string,
  valores: unknown[] = [],
): Promise<T | null> {
  const filas = await query<T>(texto, valores);
  return filas[0] ?? null;
}

export async function contar(texto: string, valores: unknown[] = []): Promise<number> {
  const fila = await queryUno<{ total: string }>(texto, valores);
  return Number(fila?.total ?? 0);
}

export async function cerrarDb(): Promise<void> {
  await pool?.end();
  pool = undefined;
}

/** Identificador único: sirve de PK (las columnas son `String`) y de sufijo. */
export function idUnico(): string {
  return randomUUID();
}

/**
 * Postgres guarda estas columnas como `timestamp` sin zona y `pg` serializa un
 * `Date` en hora local, así que el instante se desplazaría. Prisma persiste en
 * UTC: se envía el ISO en UTC para escribir exactamente igual que la app.
 */
export function fechaSql(fecha: Date): string {
  return fecha.toISOString();
}

export function emailE2E(etiqueta: string): string {
  return `${etiqueta}-${randomUUID().slice(0, 8)}@${E2E_DOMINIO}`;
}

/** Borra todas las empresas creadas por los e2e (cascada al resto de tablas). */
export async function limpiarDatosE2E(): Promise<number> {
  const filas = await query<{ id: string }>(
    `DELETE FROM "Empresa" WHERE "nombre" LIKE $1 RETURNING "id"`,
    [`${E2E_PREFIJO}%`],
  );
  return filas.length;
}

// ---------------------------------------------------------------------------
// Consultas de aserción usadas por los specs
// ---------------------------------------------------------------------------

export type UsuarioFila = {
  id: string;
  email: string;
  nombre: string;
  passwordHash: string;
  rol: string;
  horasContrato: number;
  diasLibres: number;
  empresaId: string;
  managerId: string | null;
  localId: string | null;
};

export function usuarioPorEmail(email: string): Promise<UsuarioFila | null> {
  return queryUno<UsuarioFila>(`SELECT * FROM "Usuario" WHERE "email" = $1`, [email]);
}

export function contarUsuariosPorEmail(email: string): Promise<number> {
  return contar(`SELECT COUNT(*)::text AS total FROM "Usuario" WHERE "email" = $1`, [
    email,
  ]);
}

export type EmpresaFila = { id: string; nombre: string; trialEndsAt: Date };

export function empresaPorNombre(nombre: string): Promise<EmpresaFila | null> {
  return queryUno<EmpresaFila>(`SELECT * FROM "Empresa" WHERE "nombre" = $1`, [nombre]);
}

export function contarEmpresasPorNombre(nombre: string): Promise<number> {
  return contar(`SELECT COUNT(*)::text AS total FROM "Empresa" WHERE "nombre" = $1`, [
    nombre,
  ]);
}

export function usuariosDeEmpresa(empresaId: string): Promise<UsuarioFila[]> {
  return query<UsuarioFila>(
    `SELECT * FROM "Usuario" WHERE "empresaId" = $1 ORDER BY "createdAt" ASC`,
    [empresaId],
  );
}

export type TurnoFila = { id: string; usuarioId: string; inicio: Date; fin: Date };

export function turnosDeEmpresa(empresaId: string): Promise<TurnoFila[]> {
  return query<TurnoFila>(
    `SELECT * FROM "Turno" WHERE "empresaId" = $1 ORDER BY "inicio" ASC`,
    [empresaId],
  );
}

export function contarTurnos(empresaId: string): Promise<number> {
  return contar(`SELECT COUNT(*)::text AS total FROM "Turno" WHERE "empresaId" = $1`, [
    empresaId,
  ]);
}

export type LocalFila = { id: string; nombre: string; managerId: string };

export function localesDeManager(managerId: string): Promise<LocalFila[]> {
  return query<LocalFila>(`SELECT * FROM "Local" WHERE "managerId" = $1`, [managerId]);
}

export function contarPlantilla(localId: string): Promise<number> {
  return contar(
    `SELECT COUNT(*)::text AS total FROM "PlantillaTurno" WHERE "localId" = $1`,
    [localId],
  );
}

export function contarDisponibilidad(usuarioId: string): Promise<number> {
  return contar(
    `SELECT COUNT(*)::text AS total FROM "Disponibilidad" WHERE "usuarioId" = $1`,
    [usuarioId],
  );
}

export type SolicitudFila = {
  id: string;
  usuarioId: string;
  estado: string;
  motivo: string;
  respuesta: string | null;
  resueltaPorId: string | null;
};

export function solicitudesDeUsuario(usuarioId: string): Promise<SolicitudFila[]> {
  return query<SolicitudFila>(
    `SELECT * FROM "SolicitudDisponibilidad" WHERE "usuarioId" = $1 ORDER BY "createdAt" DESC`,
    [usuarioId],
  );
}

export function contarSolicitudes(usuarioId: string): Promise<number> {
  return contar(
    `SELECT COUNT(*)::text AS total FROM "SolicitudDisponibilidad" WHERE "usuarioId" = $1`,
    [usuarioId],
  );
}

// ---------------------------------------------------------------------------
// Inserciones de apoyo (estado de partida que no se crea por la UI)
// ---------------------------------------------------------------------------

export async function crearTurno(input: {
  empresaId: string;
  usuarioId: string;
  inicio: Date;
  fin: Date;
}): Promise<string> {
  const id = idUnico();
  await query(
    `INSERT INTO "Turno" ("id", "empresaId", "usuarioId", "inicio", "fin", "metadata", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, '{}'::jsonb, NOW(), NOW())`,
    [id, input.empresaId, input.usuarioId, fechaSql(input.inicio), fechaSql(input.fin)],
  );
  return id;
}

export async function crearSolicitud(input: {
  empresaId: string;
  usuarioId: string;
  semanaInicio: Date;
  motivo: string;
}): Promise<string> {
  const id = idUnico();
  await query(
    `INSERT INTO "SolicitudDisponibilidad"
       ("id", "empresaId", "usuarioId", "semanaInicio", "motivo", "estado", "createdAt")
     VALUES ($1, $2, $3, $4, $5, 'PENDIENTE', NOW())`,
    [id, input.empresaId, input.usuarioId, fechaSql(input.semanaInicio), input.motivo],
  );
  return id;
}
