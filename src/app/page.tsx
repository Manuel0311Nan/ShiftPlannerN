import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CalendarRange,
  Check,
  Users,
} from "lucide-react";
import { Button } from "@/shared/ui/button";

const FEATURES = [
  {
    icon: CalendarRange,
    accent: "deep-sky-blue",
    title: "Turnos generados automáticamente",
    description:
      "Define disponibilidad, restricciones legales y coberturas mínimas; el motor genera el horario óptimo en segundos.",
  },
  {
    icon: Users,
    accent: "cool-horizon",
    title: "Managers y empleados, organizados",
    description:
      "Cada empresa puede tener varios managers, cada uno con su propio equipo de empleados y locales a cargo.",
  },
  {
    icon: BarChart3,
    accent: "fuchsia-plum",
    title: "Visibilidad de un vistazo",
    description:
      "Cobertura, huecos sin cubrir y horas por persona claros como un documento, no como una hoja de cálculo.",
  },
] as const;

const ACCENT_TILE: Record<string, string> = {
  "deep-sky-blue": "bg-deep-sky-blue/15 text-deep-sky-blue",
  "cool-horizon": "bg-cool-horizon/15 text-cool-horizon",
  "fuchsia-plum": "bg-fuchsia-plum/15 text-fuchsia-plum",
};

export default function Home() {
  return (
    <div className="flex flex-col bg-surface text-ink">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-hairline bg-surface/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-295 items-center justify-between px-6 md:px-8">
          <span className="text-h3 text-primary">ScheduleAI</span>
          <nav className="hidden items-center gap-6 md:flex">
            <a
              href="#caracteristicas"
              className="text-body-sm text-ink-muted transition-colors hover:text-ink"
            >
              Características
            </a>
            <a
              href="#precios"
              className="text-body-sm text-ink-muted transition-colors hover:text-ink"
            >
              Precios
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-3 text-button text-ink transition-colors hover:text-primary"
            >
              Iniciar sesión
            </Link>
            <Link href="/register">
              <Button variant="utility">Prueba gratis</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="w-full">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-b-4xl bg-secondary px-6 pb-16 pt-20 md:px-8">
          <svg
            aria-hidden
            className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]"
          >
            <defs>
              <pattern
                id="grid"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="white"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          <div className="relative z-10 mx-auto flex max-w-225 flex-col items-center text-center">
            <span className="mb-6 rounded-full bg-white/10 px-3 py-1 text-label-caps uppercase text-white/90 ring-1 ring-inset ring-white/20">
              Prueba gratuita de 30 días
            </span>
            <h1 className="text-[40px] font-bold leading-[1.05] tracking-tight text-white md:text-display-lg">
              Gestiona tus turnos con la claridad de un documento.
            </h1>
            <p className="mt-6 max-w-160 text-body-lg leading-relaxed text-white/75">
              ScheduleAI genera los turnos de tu empresa automáticamente,
              respetando disponibilidad, restricciones legales y la jerarquía de
              managers y empleados.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
              <Link href="/register" className="w-full sm:w-auto">
                <Button variant="primary" className="w-full">
                  Empezar gratis
                </Button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <button className="w-full rounded-full border border-white/30 px-6 py-3 text-base font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/10 active:scale-[0.96]">
                  Iniciar sesión
                </button>
              </Link>
            </div>
          </div>

          {/* Vista previa (mock construido con divs, sin imágenes externas) */}
          <div className="relative z-20 mx-auto mt-16 w-full max-w-240">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-surface shadow-2xl">
              <div className="flex items-center gap-2 border-b border-hairline bg-canvas-soft px-4 py-3">
                <span className="size-3 rounded-full bg-fuchsia-plum/60" />
                <span className="size-3 rounded-full bg-cool-horizon/60" />
                <span className="size-3 rounded-full bg-deep-sky-blue/60" />
                <span className="ml-3 text-label-caps uppercase text-ink-faint">
                  Horario semanal
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
                {[
                  { d: "Lun", a: "bg-deep-sky-blue", t: "07:00 – 15:00" },
                  { d: "Mar", a: "bg-cool-horizon", t: "15:00 – 23:00" },
                  { d: "Mié", a: null, t: "Libre" },
                  { d: "Jue", a: "bg-fuchsia-plum", t: "23:00 – 07:00" },
                ].map(({ d, a, t }) => (
                  <div
                    key={d}
                    className="rounded-lg border border-hairline bg-surface p-3"
                  >
                    <span className="text-label-caps uppercase text-ink-muted">
                      {d}
                    </span>
                    {a ? (
                      <div className={`mt-2 rounded border-l-4 ${a} bg-canvas-soft py-1.5 pl-2`}>
                        <span className="block text-[12px] font-semibold text-ink">
                          {t}
                        </span>
                      </div>
                    ) : (
                      <p className="mt-2 text-[12px] italic text-ink-faint">{t}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Características */}
        <section id="caracteristicas" className="bg-surface px-6 py-24 md:px-8">
          <div className="mx-auto max-w-295">
            <div className="mx-auto mb-16 max-w-175 text-center">
              <span className="mb-4 inline-block rounded-full bg-primary/10 px-3 py-1 text-label-caps uppercase text-primary">
                Características
              </span>
              <h2 className="text-h1 text-ink">
                Todo lo que necesitas, sin el ruido visual.
              </h2>
              <p className="mt-4 text-body-lg text-ink-muted">
                Diseñado para que te enfoques en lo importante: tu equipo.
                Olvídate de las hojas de cálculo y adopta un flujo de trabajo
                sereno.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {FEATURES.map(({ icon: Icon, accent, title, description }) => (
                <div
                  key={title}
                  className="flex flex-col rounded-xl border border-hairline bg-surface p-6 shadow-sm transition-shadow duration-300 hover:shadow-md"
                >
                  <div
                    className={`mb-6 flex size-12 items-center justify-center rounded-lg ${ACCENT_TILE[accent]}`}
                  >
                    <Icon size={22} />
                  </div>
                  <h3 className="text-h3 text-ink">{title}</h3>
                  <p className="mt-2 text-body-sm text-ink-muted">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Banda: escala con confianza */}
        <section className="border-y border-hairline bg-canvas-soft px-6 py-20 md:px-8">
          <div className="mx-auto flex max-w-295 flex-col items-center gap-10 md:flex-row">
            <div className="w-full md:w-1/2">
              <h2 className="text-h2 text-ink">Crece sin perder el orden</h2>
              <p className="mt-4 text-body-lg text-ink-muted">
                Pensado para escalar a medida que tu equipo crece: varios
                locales, varios managers y cada trabajador con su propia
                disponibilidad, todo bajo una misma cuenta.
              </p>
              <ul className="mt-6 flex flex-col gap-3">
                {[
                  "Multi-local y multi-tenant desde el primer día",
                  "Roles de admin, manager y trabajador",
                  "Disponibilidad y coberturas por persona",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 text-body-sm text-ink-secondary"
                  >
                    <span className="flex size-5 items-center justify-center rounded-full bg-accent-green-soft text-accent-green">
                      <Check size={13} strokeWidth={3} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid w-full grid-cols-2 gap-4 md:w-1/2">
              <div className="rounded-xl border border-hairline bg-surface p-5 shadow-sm">
                <span className="block text-display-sm text-primary">30</span>
                <span className="text-label-caps uppercase text-ink-muted">
                  Días de prueba gratis
                </span>
              </div>
              <div className="rounded-xl border border-hairline bg-surface p-5 shadow-sm">
                <span className="block text-display-sm text-primary">0€</span>
                <span className="text-label-caps uppercase text-ink-muted">
                  Sin tarjeta de crédito
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Precios */}
        <section id="precios" className="bg-surface px-6 py-24 md:px-8">
          <div className="mx-auto max-w-200 text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-hairline bg-surface px-3 py-1 shadow-sm">
              <span className="size-2 rounded-full bg-accent-green" />
              <span className="text-label-caps uppercase text-ink-secondary">
                Prueba activa 30 días
              </span>
            </div>
            <h2 className="text-h1 text-ink">
              Empieza gratis. Escala cuando lo necesites.
            </h2>
            <p className="mt-4 text-body-lg text-ink-muted">
              Crea tu empresa y planifica turnos hoy mismo, sin compromiso ni
              tarjeta de crédito.
            </p>
            <div className="mt-8">
              <Link href="/register">
                <Button variant="primary" className="shadow-md">
                  Crear mi empresa
                  <ArrowRight size={18} />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-hairline bg-surface px-6 py-10 md:px-8">
        <div className="mx-auto flex max-w-295 flex-col items-center justify-between gap-4 md:flex-row">
          <span className="text-h3 text-primary">ScheduleAI</span>
          <span className="text-body-sm text-ink-muted">
            © {new Date().getFullYear()} ScheduleAI. Todos los derechos
            reservados.
          </span>
        </div>
      </footer>
    </div>
  );
}
