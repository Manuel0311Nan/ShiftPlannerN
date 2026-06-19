import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/shared/ui/card";

export function StubPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
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
          {title}
        </h1>
        <p className="mt-1 text-[15px] text-ink-muted">{description}</p>
      </div>

      <Card className="bg-canvas-soft text-center text-[15px] text-ink-muted">
        Esta sección está en construcción. Pronto vas a poder gestionar{" "}
        {title.toLowerCase()} desde aquí.
      </Card>
    </div>
  );
}
