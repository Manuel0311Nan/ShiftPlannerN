import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/shared/ui/card";
import { CreateUserForm } from "./create-user-form";

export default async function EquipoPage({
  searchParams,
}: {
  searchParams: Promise<{ rol?: string; managerId?: string }>;
}) {
  const session = await auth();
  const empresaId = session!.user.empresaId;
  const viewerRol = session!.user.rol === "ADMIN" ? "ADMIN" : "MANAGER";
  const params = await searchParams;

  const managersRaw =
    viewerRol === "ADMIN"
      ? await prisma.usuario.findMany({
          where: { empresaId, localesComoManager: { some: {} } },
          select: {
            id: true,
            nombre: true,
            localesComoManager: { select: { id: true, nombre: true } },
          },
          orderBy: { nombre: "asc" },
        })
      : await prisma.usuario.findMany({
          where: { id: session!.user.id },
          select: {
            id: true,
            nombre: true,
            localesComoManager: { select: { id: true, nombre: true } },
          },
        });

  const managers = managersRaw.map((manager) => ({
    id: manager.id,
    nombre: manager.nombre,
    locales: manager.localesComoManager,
  }));

  const initialRol = params.rol === "MANAGER" ? "MANAGER" : "EMPLOYEE";

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-[26px] font-bold leading-[1.23] tracking-[-0.625px] text-ink">
          Equipo
        </h1>
        <p className="mt-1 text-[15px] text-ink-muted">
          Crea cuentas para managers o trabajadores — quedan activas al
          instante y reciben sus credenciales por email.
        </p>
      </div>

      <Card elevated className="max-w-120">
        <CreateUserForm
          viewerRol={viewerRol}
          managers={managers}
          initialRol={initialRol}
          initialManagerId={params.managerId ?? ""}
        />
      </Card>
    </div>
  );
}
