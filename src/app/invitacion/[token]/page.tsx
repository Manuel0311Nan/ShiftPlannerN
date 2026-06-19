import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card } from "@/shared/ui/card";
import { AcceptForm } from "./accept-form";

const ROL_LABEL: Record<string, string> = {
  MANAGER: "Manager",
  EMPLOYEE: "Trabajador",
};

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-canvas-soft px-6 py-16">
      <div className="flex w-full max-w-[420px] flex-col gap-6">
        <Link
          href="/"
          className="text-center text-[20px] font-semibold tracking-[-0.125px] text-ink"
        >
          ScheduleAI
        </Link>
        <Card elevated className="flex flex-col gap-6">
          {children}
        </Card>
      </div>
    </div>
  );
}

export default async function InvitacionPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invitacion = await prisma.invitacion.findUnique({
    where: { token },
    select: {
      rol: true,
      expiresAt: true,
      aceptadaEn: true,
      empresa: { select: { nombre: true } },
    },
  });

  if (!invitacion) {
    return (
      <Shell>
        <p className="text-center text-[15px] text-ink-muted">
          Esta invitación no existe o ya no es válida.
        </p>
      </Shell>
    );
  }

  if (invitacion.aceptadaEn) {
    return (
      <Shell>
        <p className="text-center text-[15px] text-ink-muted">
          Esta invitación ya fue utilizada.{" "}
          <Link href="/login" className="text-primary">
            Inicia sesión
          </Link>
          .
        </p>
      </Shell>
    );
  }

  if (invitacion.expiresAt < new Date()) {
    return (
      <Shell>
        <p className="text-center text-[15px] text-ink-muted">
          Esta invitación ha expirado. Pide a tu administrador que te invite
          de nuevo.
        </p>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="text-center">
        <h1 className="text-[22px] font-bold leading-[1.27] tracking-[-0.25px] text-ink">
          Te invitaron a {invitacion.empresa.nombre}
        </h1>
        <p className="mt-1 text-[15px] text-ink-muted">
          Como {ROL_LABEL[invitacion.rol]}. Crea tu cuenta para empezar.
        </p>
      </div>
      <AcceptForm token={token} />
    </Shell>
  );
}
