import { prisma } from "@/lib/prisma";

const TENANT_SCOPED_MODELS = new Set([
  "Usuario",
  "Turno",
  "Local",
  "PlantillaTurno",
  "Disponibilidad",
]);

const READ_OPERATIONS = new Set([
  "findUnique",
  "findUniqueOrThrow",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "count",
  "aggregate",
  "groupBy",
  "update",
  "updateMany",
  "delete",
  "deleteMany",
]);

/**
 * Cliente Prisma acotado a una empresa: inyecta `empresaId` en el `where` de
 * toda lectura/escritura y lo fuerza en `data` al crear, para que ningún
 * repositorio pueda filtrar por tenant incorrecto (u olvidarlo) aunque lo
 * intente.
 */
export function tenantPrisma(empresaId: string) {
  return prisma.$extends({
    name: "tenant-scope",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!TENANT_SCOPED_MODELS.has(model)) {
            return query(args);
          }

          const scopedArgs = args as Record<string, unknown>;

          if (READ_OPERATIONS.has(operation)) {
            scopedArgs.where = { ...(scopedArgs.where as object), empresaId };
          } else if (operation === "create") {
            scopedArgs.data = { ...(scopedArgs.data as object), empresaId };
          } else if (operation === "createMany") {
            scopedArgs.data = (scopedArgs.data as object[]).map((d) => ({
              ...d,
              empresaId,
            }));
          } else if (operation === "upsert") {
            scopedArgs.where = { ...(scopedArgs.where as object), empresaId };
            scopedArgs.create = {
              ...(scopedArgs.create as object),
              empresaId,
            };
            scopedArgs.update = {
              ...(scopedArgs.update as object),
              empresaId,
            };
          }

          return query(scopedArgs);
        },
      },
    },
  });
}

export type TenantPrismaClient = ReturnType<typeof tenantPrisma>;
