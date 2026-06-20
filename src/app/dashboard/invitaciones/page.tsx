import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/shared/ui/card";
import { InviteForm } from "./invite-form";
import { InvitationsList } from "./invitations-list";

export default async function InvitacionesPage({
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
          where: { empresaId, rol: "MANAGER" },
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

  const invitations = await prisma.invitacion.findMany({
    where: {
      empresaId,
      aceptadaEn: null,
      expiresAt: { gt: new Date() },
      ...(viewerRol === "MANAGER" ? { invitadoPorId: session!.user.id } : {}),
    },
    select: {
      id: true,
      email: true,
      rol: true,
      expiresAt: true,
      manager: { select: { nombre: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const initialRol = params.rol === "MANAGER" ? "MANAGER" : "EMPLOYEE";

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-[26px] font-bold leading-[1.23] tracking-[-0.625px] text-ink">
          Invitaciones
        </h1>
        <p className="mt-1 text-[15px] text-ink-muted">
          Invita nuevos managers o trabajadores a tu empresa.
        </p>
      </div>

      <Card elevated className="max-w-120">
        <InviteForm
          viewerRol={viewerRol}
          managers={managers}
          initialRol={initialRol}
          initialManagerId={params.managerId ?? ""}
        />
      </Card>

      <div>
        <h2 className="text-[20px] font-semibold leading-[1.4] tracking-[-0.125px] text-ink">
          Pendientes
        </h2>
        <div className="mt-4">
          <InvitationsList invitations={invitations} />
        </div>
      </div>
    </div>
  );
}
