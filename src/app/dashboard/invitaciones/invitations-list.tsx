import { Badge } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";

type Invitacion = {
  id: string;
  email: string;
  rol: "MANAGER" | "EMPLOYEE";
  expiresAt: Date;
  manager: { nombre: string } | null;
};

const ROL_LABEL: Record<string, string> = {
  MANAGER: "Manager",
  EMPLOYEE: "Trabajador",
};

export function InvitationsList({
  invitations,
}: {
  invitations: Invitacion[];
}) {
  if (invitations.length === 0) {
    return (
      <Card className="bg-canvas-soft text-center text-[15px] text-ink-muted">
        No hay invitaciones pendientes.
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {invitations.map((invitacion) => (
        <Card key={invitacion.id} className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[15px] font-medium text-ink">
              {invitacion.email}
            </span>
            {invitacion.manager && (
              <span className="text-[14px] text-ink-muted">
                Manager: {invitacion.manager.nombre}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Badge>{ROL_LABEL[invitacion.rol]}</Badge>
            <span className="text-[14px] text-ink-faint">
              Expira el{" "}
              {invitacion.expiresAt.toLocaleDateString("es-ES", {
                day: "numeric",
                month: "short",
              })}
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
}
