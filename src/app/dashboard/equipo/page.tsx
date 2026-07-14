import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/shared/ui/card";
import { CreateUserForm } from "./create-user-form";
import {
  TeamDiagram,
  type ManagerNode,
  type WorkerNode,
} from "./team-diagram";

export default async function EquipoPage({
  searchParams,
}: {
  searchParams: Promise<{ rol?: string; managerId?: string }>;
}) {
  const session = await auth();
  const empresaId = session!.user.empresaId;
  const viewerId = session!.user.id;
  const viewerRol = session!.user.rol === "ADMIN" ? "ADMIN" : "MANAGER";
  const params = await searchParams;

  // Los botones "Añadir manager"/"Crear trabajador" llegan con ?rol=…; en ese
  // caso mostramos el formulario. Sin params, la pestaña es el organigrama.
  const modoCrear = params.rol === "MANAGER" || params.rol === "EMPLOYEE";

  if (modoCrear) {
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
            where: { id: viewerId },
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
          <Link
            href="/dashboard/equipo"
            className="mb-4 inline-flex items-center gap-1.5 text-body-sm text-ink-muted hover:text-ink"
          >
            <ArrowLeft size={16} />
            Volver al equipo
          </Link>
          <h1 className="text-[26px] font-bold leading-[1.23] tracking-[-0.625px] text-ink">
            {initialRol === "MANAGER" ? "Nuevo manager" : "Nuevo trabajador"}
          </h1>
          <p className="mt-1 text-[15px] text-ink-muted">
            La cuenta queda activa al instante y recibe sus credenciales por
            email.
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

  // Organigrama: managers con sus trabajadores a cargo.
  const managersRaw =
    viewerRol === "ADMIN"
      ? await prisma.usuario.findMany({
          where: { empresaId, localesComoManager: { some: {} } },
          select: {
            id: true,
            nombre: true,
            email: true,
            _count: { select: { localesComoManager: true } },
            empleados: {
              where: { rol: "EMPLOYEE" },
              select: {
                id: true,
                nombre: true,
                email: true,
                local: { select: { nombre: true } },
              },
              orderBy: { nombre: "asc" },
            },
          },
          orderBy: { nombre: "asc" },
        })
      : await prisma.usuario.findMany({
          where: { id: viewerId },
          select: {
            id: true,
            nombre: true,
            email: true,
            _count: { select: { localesComoManager: true } },
            empleados: {
              where: { rol: "EMPLOYEE" },
              select: {
                id: true,
                nombre: true,
                email: true,
                local: { select: { nombre: true } },
              },
              orderBy: { nombre: "asc" },
            },
          },
        });

  const managers: ManagerNode[] = managersRaw.map((manager) => ({
    id: manager.id,
    nombre: manager.nombre,
    email: manager.email,
    numLocales: manager._count.localesComoManager,
    trabajadores: manager.empleados.map((empleado) => ({
      id: empleado.id,
      nombre: empleado.nombre,
      email: empleado.email,
      localNombre: empleado.local?.nombre ?? null,
    })),
  }));

  // Trabajadores huérfanos (su manager fue eliminado) — solo relevante al admin.
  const huerfanosRaw =
    viewerRol === "ADMIN"
      ? await prisma.usuario.findMany({
          where: { empresaId, rol: "EMPLOYEE", managerId: null },
          select: {
            id: true,
            nombre: true,
            email: true,
            local: { select: { nombre: true } },
          },
          orderBy: { nombre: "asc" },
        })
      : [];

  const huerfanos: WorkerNode[] = huerfanosRaw.map((empleado) => ({
    id: empleado.id,
    nombre: empleado.nombre,
    email: empleado.email,
    localNombre: empleado.local?.nombre ?? null,
  }));

  return (
    <TeamDiagram viewerRol={viewerRol} managers={managers} huerfanos={huerfanos} />
  );
}
