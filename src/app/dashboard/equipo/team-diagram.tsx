import Link from "next/link";
import { Store, UserPlus, Users } from "lucide-react";
import { Avatar } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";

export type WorkerNode = {
  id: string;
  nombre: string;
  email: string;
  localNombre: string | null;
};

export type ManagerNode = {
  id: string;
  nombre: string;
  email: string;
  numLocales: number;
  trabajadores: WorkerNode[];
};

function WorkerRow({ trabajador }: { trabajador: WorkerNode }) {
  return (
    <Link
      href={`/dashboard/empleados/${trabajador.id}`}
      className="relative flex items-center gap-3 rounded-lg border border-hairline bg-surface px-3 py-2.5 transition-colors hover:border-primary hover:bg-canvas-soft"
    >
      {/* Conector con el rail del manager */}
      <span
        aria-hidden
        className="absolute -left-6 top-1/2 h-px w-6 -translate-y-1/2 bg-hairline"
      />
      <Avatar nombre={trabajador.nombre} size="sm" />
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-body-sm font-medium text-ink">
          {trabajador.nombre}
        </span>
        <span className="truncate text-xs text-ink-muted">
          {trabajador.localNombre ?? "Sin local"}
        </span>
      </div>
    </Link>
  );
}

function ManagerGroup({ manager }: { manager: ManagerNode }) {
  return (
    <Card className="p-0">
      {/* Nodo manager */}
      <div className="flex flex-wrap items-center gap-4 p-5">
        <Link
          href={`/dashboard/managers/${manager.id}`}
          className="group flex min-w-0 flex-1 items-center gap-4"
        >
          <Avatar nombre={manager.nombre} size="lg" />
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-title-md text-ink group-hover:text-primary">
              {manager.nombre}
            </span>
            <span className="truncate text-body-sm text-ink-muted">
              {manager.email}
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <Badge variant="neutral" className="gap-1.5">
            <Store size={13} />
            {manager.numLocales} local{manager.numLocales === 1 ? "" : "es"}
          </Badge>
          <Badge variant="default" className="gap-1.5">
            <Users size={13} />
            {manager.trabajadores.length}
          </Badge>
        </div>
      </div>

      {/* Trabajadores a cargo, indentados bajo un rail vertical */}
      <div className="border-t border-hairline p-5">
        {manager.trabajadores.length === 0 ? (
          <p className="text-body-sm text-ink-faint">
            Sin trabajadores a cargo todavía.
          </p>
        ) : (
          <div className="ml-6 flex flex-col gap-2.5 border-l-2 border-hairline pl-6">
            {manager.trabajadores.map((trabajador) => (
              <WorkerRow key={trabajador.id} trabajador={trabajador} />
            ))}
          </div>
        )}
        <Link
          href={`/dashboard/equipo?rol=EMPLOYEE&managerId=${manager.id}`}
          className="mt-4 inline-flex items-center gap-1.5 text-body-sm font-semibold text-primary hover:underline"
        >
          <UserPlus size={15} />
          Crear trabajador a su cargo
        </Link>
      </div>
    </Card>
  );
}

export function TeamDiagram({
  viewerRol,
  managers,
  huerfanos,
}: {
  viewerRol: "ADMIN" | "MANAGER";
  managers: ManagerNode[];
  huerfanos: WorkerNode[];
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-label-caps uppercase text-primary">Equipo</p>
          <h1 className="text-h2 text-ink">Organigrama del equipo</h1>
          <p className="mt-1 text-body-sm text-ink-muted">
            {viewerRol === "ADMIN"
              ? "Cada manager con los trabajadores que tiene a su cargo."
              : "Los trabajadores que tienes a tu cargo."}
          </p>
        </div>
        <div className="flex gap-2">
          {viewerRol === "ADMIN" && (
            <Link href="/dashboard/equipo?rol=MANAGER">
              <Button variant="utility">
                <UserPlus className="size-4" />
                Añadir manager
              </Button>
            </Link>
          )}
          <Link href="/dashboard/equipo?rol=EMPLOYEE">
            <Button variant="primary">
              <UserPlus className="size-4" />
              Crear trabajador
            </Button>
          </Link>
        </div>
      </div>

      {managers.length === 0 ? (
        <Card className="bg-canvas-soft text-center text-body-sm text-ink-muted">
          {viewerRol === "ADMIN"
            ? "Todavía no hay managers. Añade uno para empezar a organizar el equipo."
            : "Todavía no gestionas ningún local."}
        </Card>
      ) : (
        <div className="flex flex-col gap-5">
          {managers.map((manager) => (
            <ManagerGroup key={manager.id} manager={manager} />
          ))}
        </div>
      )}

      {huerfanos.length > 0 && (
        <Card className="p-0">
          <div className="flex items-center gap-3 p-5">
            <span className="flex size-10 items-center justify-center rounded-full bg-canvas-soft text-ink-muted">
              <Users size={18} />
            </span>
            <div className="flex flex-col">
              <span className="text-title-md text-ink">Sin manager asignado</span>
              <span className="text-body-sm text-ink-muted">
                Trabajadores cuyo manager fue eliminado.
              </span>
            </div>
          </div>
          <div className="border-t border-hairline p-5">
            <div className="ml-6 flex flex-col gap-2.5 border-l-2 border-hairline pl-6">
              {huerfanos.map((trabajador) => (
                <WorkerRow key={trabajador.id} trabajador={trabajador} />
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
