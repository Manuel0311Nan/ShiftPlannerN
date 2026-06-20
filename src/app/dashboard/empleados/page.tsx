import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/shared/ui/card";

export default async function EmpleadosPage() {
  const session = await auth();
  const empresaId = session!.user.empresaId;

  const empleados =
    session!.user.rol === "ADMIN"
      ? await prisma.usuario.findMany({
          where: { empresaId, rol: "EMPLOYEE" },
          select: {
            id: true,
            nombre: true,
            email: true,
            manager: { select: { nombre: true } },
          },
          orderBy: { createdAt: "asc" },
        })
      : await prisma.usuario.findMany({
          where: { empresaId, rol: "EMPLOYEE", managerId: session!.user.id },
          select: {
            id: true,
            nombre: true,
            email: true,
            manager: { select: { nombre: true } },
          },
          orderBy: { createdAt: "asc" },
        });

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-[15px] text-ink-muted hover:text-ink"
      >
        <ArrowLeft size={16} />
        Volver
      </Link>

      <div>
        <h1 className="text-[26px] font-bold leading-[1.23] tracking-[-0.625px] text-ink">
          Trabajadores
        </h1>
        <p className="mt-1 text-[15px] text-ink-muted">
          {session!.user.rol === "ADMIN"
            ? "Todos los empleados de tu empresa, agrupados por manager."
            : "Los empleados que tienes a cargo."}
        </p>
      </div>

      {empleados.length === 0 ? (
        <Card className="bg-canvas-soft text-center text-[15px] text-ink-muted">
          Todavía no hay trabajadores.
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {empleados.map((empleado) => (
            <Card
              key={empleado.id}
              className="flex items-center justify-between"
            >
              <div className="flex flex-col">
                <span className="text-[15px] font-medium text-ink">
                  {empleado.nombre}
                </span>
                <span className="text-[14px] text-ink-muted">
                  {empleado.email}
                </span>
              </div>
              {session!.user.rol === "ADMIN" && (
                <span className="text-[14px] text-ink-faint">
                  Manager: {empleado.manager?.nombre}
                </span>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
