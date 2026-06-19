import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";

const FEATURES = [
  {
    title: "Turnos generados automáticamente",
    description:
      "Define disponibilidad, restricciones legales y coberturas mínimas; el motor genera el horario óptimo en segundos.",
    accent: "bg-accent-teal",
  },
  {
    title: "Managers y empleados, organizados",
    description:
      "Cada empresa puede tener varios managers, cada uno con su propio equipo de empleados a cargo.",
    accent: "bg-accent-orange",
  },
  {
    title: "Prueba gratis 30 días",
    description:
      "Crea tu empresa y empieza a planificar turnos hoy mismo, sin tarjeta de crédito.",
    accent: "bg-accent-purple",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col">
      <header className="bg-canvas px-6 py-4 md:px-12">
        <nav className="mx-auto flex max-w-295 items-center justify-between text-[15px]">
          <span className="text-[20px] font-semibold tracking-[-0.125px] text-ink">
            ScheduleAI
          </span>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-ink hover:text-primary">
              Iniciar sesión
            </Link>
            <Link href="/register">
              <Button variant="utility">Prueba gratis</Button>
            </Link>
          </div>
        </nav>
      </header>

      <section className="bg-secondary px-6 py-24 text-center md:px-12">
        <div className="mx-auto flex max-w-[760px] flex-col items-center gap-6">
          <span className="rounded-full bg-surface px-2 py-1 text-[12px] font-semibold tracking-[0.125px] text-primary">
            Prueba gratuita de 30 días
          </span>
          <h1 className="text-[40px] font-bold leading-[1.1] tracking-[-1px] text-white md:text-[64px] md:leading-[1.0] md:tracking-[-2.125px]">
            Tus horarios de trabajo al momento
          </h1>
          <p className="max-w-140 text-[16px] leading-normal text-white/80">
            ScheduleAI genera los turnos de tu empresa automáticamente,
            respetando disponibilidad, restricciones legales y la jerarquía de
            managers y empleados.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/register">
              <Button variant="primary">Empezar gratis</Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary">Iniciar sesión</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-canvas-soft px-6 py-20 md:px-12">
        <div className="mx-auto max-w-[1180px]">
          <h2 className="text-center text-[26px] font-bold leading-[1.23] tracking-[-0.625px] text-ink md:text-[40px] md:leading-[1.1] md:tracking-[-1px]">
            Todo lo que necesitas para planificar turnos
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {FEATURES.map((feature) => (
              <Card key={feature.title}>
                <div className={`mb-4 h-2 w-10 rounded-full ${feature.accent}`} />
                <h3 className="text-[20px] font-semibold leading-[1.4] tracking-[-0.125px] text-ink">
                  {feature.title}
                </h3>
                <p className="mt-2 text-[15px] leading-[1.33] text-ink-muted">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-canvas-soft px-6 py-8 text-center text-[14px] text-ink-secondary md:px-12">
        © {new Date().getFullYear()} ScheduleAI. Todos los derechos
        reservados.
      </footer>
    </div>
  );
}
