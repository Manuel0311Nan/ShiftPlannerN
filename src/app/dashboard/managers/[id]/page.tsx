import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";

export default async function ManagerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (session!.user.rol !== "ADMIN") {
    redirect("/dashboard");
  }

  const { id } = await params;
  const manager = await prisma.usuario.findFirst({
    where: { id, empresaId: session!.user.empresaId, rol: "MANAGER" },
    select: { id: true, nombre: true, email: true },
  });
  if (!manager) {
    notFound();
  }

  const empleados = await prisma.usuario.findMany({
    where: { empresaId: session!.user.empresaId, managerId: manager.id },
    select: { id: true, nombre: true, email: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/dashboard/managers"
        className="inline-flex items-center gap-1.5 text-[15px] text-ink-muted hover:text-ink"
      >
        <ArrowLeft size={16} />
        Volver
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[26px] font-bold leading-[1.23] tracking-[-0.625px] text-ink">
            {manager.nombre}
          </h1>
          <p className="mt-1 text-[15px] text-ink-muted">{manager.email}</p>
        </div>
        <Link
          href={`/dashboard/invitaciones?rol=EMPLOYEE&managerId=${manager.id}`}
        >
          <Button variant="primary">Invitar trabajador</Button>
        </Link>
      </div>

      {empleados.length === 0 ? (
        <Card className="bg-canvas-soft text-center text-[15px] text-ink-muted">
          Este manager todavía no tiene trabajadores a cargo.
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {empleados.map((empleado) => (
            <Card key={empleado.id} className="flex items-center justify-between">
              <span className="text-[15px] font-medium text-ink">
                {empleado.nombre}
              </span>
              <span className="text-[14px] text-ink-muted">
                {empleado.email}
              </span>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
