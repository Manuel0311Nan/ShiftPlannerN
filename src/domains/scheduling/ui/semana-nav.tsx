"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { IconButton } from "@/shared/ui/icon-button";

function formatoFecha(fecha: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${fecha.getFullYear()}-${p(fecha.getMonth() + 1)}-${p(fecha.getDate())}`;
}

export function SemanaNav({ semanaInicio }: { semanaInicio: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function irASemana(offsetDias: number) {
    const [año, mes, dia] = semanaInicio.split("-").map(Number);
    const destino = new Date(año, mes - 1, dia);
    destino.setDate(destino.getDate() + offsetDias);

    const params = new URLSearchParams(searchParams.toString());
    params.set("semana", formatoFecha(destino));
    router.push(`?${params.toString()}`);
  }

  const [año, mes, dia] = semanaInicio.split("-").map(Number);
  const inicio = new Date(año, mes - 1, dia);
  const fin = new Date(inicio);
  fin.setDate(fin.getDate() + 6);

  const rango = `${inicio.getDate()} ${inicio.toLocaleDateString("es-ES", {
    month: "short",
  })} – ${fin.getDate()} ${fin.toLocaleDateString("es-ES", { month: "short" })}`;

  return (
    <div className="flex items-center gap-2">
      <IconButton label="Semana anterior" variant="outline" size="sm" onClick={() => irASemana(-7)}>
        <ChevronLeft />
      </IconButton>
      <span className="min-w-32 text-center text-sm font-medium text-ink tabular-nums">
        {rango}
      </span>
      <IconButton label="Semana siguiente" variant="outline" size="sm" onClick={() => irASemana(7)}>
        <ChevronRight />
      </IconButton>
    </div>
  );
}
