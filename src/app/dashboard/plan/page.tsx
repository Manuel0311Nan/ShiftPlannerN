import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/shared/ui/card";

function diasRestantesDeTrial(trialEndsAt: Date): number {
  return Math.max(
    0,
    Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  );
}

export default async function PlanPage() {
  const session = await auth();
  const empresa = await prisma.empresa.findUniqueOrThrow({
    where: { id: session!.user.empresaId },
    select: { nombre: true, trialEndsAt: true },
  });

  const diasRestantes = diasRestantesDeTrial(empresa.trialEndsAt);
  const trialActivo = diasRestantes > 0;

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
          Plan
        </h1>
        <p className="mt-1 text-[15px] text-ink-muted">
          Plan activo de {empresa.nombre}.
        </p>
      </div>

      <Card elevated className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-[20px] font-semibold tracking-[-0.125px] text-ink">
            Prueba gratuita
          </span>
          <span
            className={
              trialActivo
                ? "rounded-full bg-surface px-2 py-1 text-[12px] font-semibold text-accent-green"
                : "rounded-full bg-surface px-2 py-1 text-[12px] font-semibold text-accent-orange-deep"
            }
          >
            {trialActivo ? "Activa" : "Finalizada"}
          </span>
        </div>
        <p className="text-[15px] text-ink-muted">
          {trialActivo
            ? `Te quedan ${diasRestantes} día${diasRestantes === 1 ? "" : "s"} de prueba gratuita.`
            : "Tu periodo de prueba ha terminado."}
        </p>
        <p className="text-[14px] text-ink-faint">
          Vence el{" "}
          {empresa.trialEndsAt.toLocaleDateString("es-ES", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
          .
        </p>
      </Card>

      <Card className="bg-canvas-soft text-center text-[15px] text-ink-muted">
        Los planes de pago todavía no están disponibles. Te avisaremos antes
        de que termine tu prueba gratuita.
      </Card>
    </div>
  );
}
