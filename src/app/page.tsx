import Link from "next/link";
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Gauge,
  Users,
} from "lucide-react";
import { Button } from "@/shared/ui/button";

/* -------------------------------------------------------------------------
 * Vista previa del board de horarios.
 * Reproduce la anatomía real de `domains/scheduling/ui` (DayColumn +
 * TurnoCard + resumen de cobertura) con datos de muestra, para que la home
 * enseñe el producto tal cual es. Si el board cambia, esta vista debe
 * actualizarse a mano: es una maqueta, no el componente real.
 * ---------------------------------------------------------------------- */

const FRANJA_STYLES = {
  morning: {
    block: "border-deep-sky-blue bg-deep-sky-blue-soft",
    label: "text-deep-sky-blue",
    text: "Mañana",
  },
  afternoon: {
    block: "border-cool-horizon bg-cool-horizon-soft",
    label: "text-cool-horizon",
    text: "Tarde",
  },
  night: {
    block: "border-fuchsia-plum bg-fuchsia-plum-soft",
    label: "text-fuchsia-plum",
    text: "Noche",
  },
} as const;

type Franja = keyof typeof FRANJA_STYLES;

type TurnoDemo = { franja: Franja; nombre: string; horas: string };

const SEMANA_DEMO: {
  dia: number;
  label: string;
  finde?: boolean;
  faltan?: number;
  turnos: TurnoDemo[];
}[] = [
  {
    dia: 18,
    label: "Lunes",
    turnos: [
      { franja: "morning", nombre: "Marta Ruiz", horas: "07:00 — 15:00" },
      { franja: "afternoon", nombre: "Iván Prats", horas: "15:00 — 23:00" },
    ],
  },
  {
    dia: 19,
    label: "Martes",
    turnos: [
      { franja: "morning", nombre: "Marta Ruiz", horas: "07:00 — 15:00" },
      { franja: "night", nombre: "Nuria Sanz", horas: "23:00 — 07:00" },
    ],
  },
  {
    dia: 20,
    label: "Miércoles",
    turnos: [
      { franja: "afternoon", nombre: "Iván Prats", horas: "15:00 — 23:00" },
      { franja: "night", nombre: "Nuria Sanz", horas: "23:00 — 07:00" },
    ],
  },
  {
    dia: 21,
    label: "Jueves",
    turnos: [
      { franja: "morning", nombre: "Marta Ruiz", horas: "07:00 — 15:00" },
      { franja: "afternoon", nombre: "Luis Márquez", horas: "10:00 — 18:00" },
    ],
  },
  {
    dia: 22,
    label: "Viernes",
    faltan: 1,
    turnos: [
      { franja: "morning", nombre: "Marta Ruiz", horas: "07:00 — 15:00" },
    ],
  },
  {
    dia: 23,
    label: "Sábado",
    finde: true,
    turnos: [
      { franja: "afternoon", nombre: "Iván Prats", horas: "15:00 — 23:00" },
      { franja: "night", nombre: "Nuria Sanz", horas: "23:00 — 07:00" },
    ],
  },
  {
    dia: 24,
    label: "Domingo",
    finde: true,
    turnos: [
      { franja: "afternoon", nombre: "Luis Márquez", horas: "10:00 — 18:00" },
    ],
  },
];

const RESUMEN_DEMO = [
  {
    icon: Users,
    tono: "bg-primary/10 text-primary",
    label: "Turnos asignados",
    valor: "13 / 14",
  },
  {
    icon: Gauge,
    tono: "bg-accent-green-soft text-accent-green",
    label: "Cobertura de la semana",
    valor: "93%",
  },
  {
    icon: AlertTriangle,
    tono: "bg-accent-orange-soft text-accent-orange-deep",
    label: "Huecos sin cubrir",
    valor: "1",
  },
] as const;

const PASOS = [
  {
    numero: "01",
    titulo: "Da de alta tus locales y tu gente",
    descripcion:
      "Cada local con su plantilla de turnos y su manager. Cada trabajador con sus horas de contrato, sus días libres y su disponibilidad habitual.",
  },
  {
    numero: "02",
    titulo: "Genera la semana",
    descripcion:
      "El motor busca el reparto que cubre todos los turnos sin pasarse del máximo legal ni saltarse los días libres. Si un turno se queda sin cubrir, lo marca antes de que lo descubras el lunes.",
  },
  {
    numero: "03",
    titulo: "Publica y deja que pidan cambios",
    descripcion:
      "Cada trabajador ve su semana y solicita un cambio puntual desde su cuenta. Tú apruebas, y la siguiente generación ya lo tiene en cuenta.",
  },
] as const;

const ROLES = [
  {
    rol: "Admin",
    chip: "bg-secondary text-white",
    descripcion:
      "Ve la empresa entera: todos los locales, todos los managers y quién entra.",
  },
  {
    rol: "Manager",
    chip: "bg-primary text-primary-foreground",
    descripcion:
      "Su local y su gente: genera la semana, mueve turnos, aprueba cambios y da de alta a los trabajadores a su cargo.",
  },
  {
    rol: "Trabajador",
    chip: "border border-hairline bg-surface text-ink-secondary",
    descripcion:
      "Su semana y sus horas, y un botón para pedir un cambio puntual sin llamar a nadie.",
  },
] as const;

const INCLUIDO = [
  "Sin tarjeta de crédito para empezar",
  "Todos tus locales y todo tu equipo",
  "Cancelas cuando quieras",
] as const;

const NAV = [
  { href: "#producto", label: "Producto" },
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#equipos", label: "Equipos" },
  { href: "#precios", label: "Precios" },
] as const;

function TurnoDemoCard({ franja, nombre, horas }: TurnoDemo) {
  const styles = FRANJA_STYLES[franja];
  return (
    <div
      className={`flex flex-col rounded-lg border-l-[3px] px-2.5 py-2 shadow-sm ${styles.block}`}
    >
      <span
        className={`text-[10px] font-semibold uppercase tracking-wider ${styles.label}`}
      >
        {styles.text}
      </span>
      <span className="mt-0.5 truncate text-[13px] font-semibold text-ink">
        {nombre}
      </span>
      <span className="text-[12px] tabular-nums text-ink-muted">{horas}</span>
    </div>
  );
}

function BoardPreview() {
  return (
    <div className="overflow-hidden rounded-xl border border-hairline bg-surface shadow-lg">
      {/* Cabecera de la página de horarios */}
      <div className="flex flex-col gap-3 border-b border-hairline bg-canvas-soft px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="text-title-md text-ink">Local Centro</span>
          <div className="flex items-center gap-2">
            <span className="flex size-7.5 items-center justify-center rounded-md border border-hairline bg-surface text-ink-muted">
              <ChevronLeft size={16} />
            </span>
            <span className="min-w-32 text-center text-sm font-medium tabular-nums text-ink">
              18 mar – 24 mar
            </span>
            <span className="flex size-7.5 items-center justify-center rounded-md border border-hairline bg-surface text-ink-muted">
              <ChevronRight size={16} />
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="rounded-md border border-hairline bg-surface px-3.5 py-1.5 text-button text-ink">
            Exportar
          </span>
          <span className="rounded-full bg-primary px-5 py-2.5 text-button text-primary-foreground">
            Generar semana
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-6 p-5">
        {/* Columnas por día, como el board real */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SEMANA_DEMO.map(({ dia, label, finde, faltan, turnos }) => (
            <div
              key={dia}
              className={`flex min-h-48 flex-col gap-2.5 rounded-lg border border-hairline p-3 ${
                finde ? "bg-canvas-soft/40" : "bg-surface"
              }`}
            >
              <div className="flex items-center justify-between gap-2 border-b border-hairline pb-2.5">
                <div className="flex min-w-0 items-baseline gap-2">
                  <span className="text-title-md text-ink">{dia}</span>
                  <span className="truncate text-label-caps uppercase text-ink-muted">
                    {label}
                  </span>
                </div>
                {faltan ? (
                  <span className="whitespace-nowrap rounded-xs bg-accent-orange-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase text-accent-orange-deep">
                    Faltan {faltan}
                  </span>
                ) : (
                  <span className="whitespace-nowrap rounded-xs bg-accent-green-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase text-accent-green">
                    Completo
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                {turnos.map((turno) => (
                  <TurnoDemoCard key={turno.franja + turno.nombre} {...turno} />
                ))}
                {faltan ? (
                  <div className="rounded-lg border border-dashed border-hairline py-5 text-center text-xs text-ink-faint">
                    Sin turnos
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        {/* Resumen de cobertura */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {RESUMEN_DEMO.map(({ icon: Icon, tono, label, valor }) => (
            <div
              key={label}
              className="flex items-center gap-4 rounded-xl border border-hairline bg-surface p-5 shadow-sm"
            >
              <span
                className={`flex size-12 shrink-0 items-center justify-center rounded-full ${tono}`}
              >
                <Icon size={22} />
              </span>
              <div>
                <p className="text-label-caps uppercase text-ink-muted">
                  {label}
                </p>
                <p className="text-h3 text-ink">{valor}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col bg-surface text-ink">
      {/* Header sobre el navy */}
      <header className="sticky top-0 z-50 bg-secondary">
        <div className="mx-auto flex h-16 max-w-295 items-center justify-between px-6 md:px-8">
          <div className="flex items-center gap-10">
            <span className="text-h3 text-white">EonLab</span>
            <nav className="hidden items-center gap-6 md:flex">
              {NAV.map(({ href, label }) => (
                <a
                  key={href}
                  href={href}
                  className="text-body-sm text-white/72 transition-colors hover:text-white"
                >
                  {label}
                </a>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-3 text-button text-white/90 transition-colors hover:text-white"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-surface px-5 py-2.5 text-button text-secondary transition-transform active:scale-[0.96]"
            >
              Prueba gratis
            </Link>
          </div>
        </div>
      </header>

      <main className="w-full">
        {/* Hero */}
        <section className="relative overflow-hidden bg-secondary px-6 pb-40 pt-20 md:px-8 md:pb-60">
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

          <div className="relative z-10 mx-auto flex max-w-205 flex-col items-center gap-6 text-center">
            <span className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 ring-1 ring-inset ring-white/20">
              <span className="size-2 rounded-full bg-deep-sky-blue" />
              <span className="text-label-caps uppercase text-white/90">
                30 días gratis · sin tarjeta
              </span>
            </span>

            <h1 className="text-[40px] font-bold leading-[1.05] tracking-tight text-white md:text-display-lg">
              Deja de cuadrar turnos a mano.
            </h1>

            <p className="max-w-155 text-body-lg leading-relaxed text-white/75">
              EonLab genera el horario de cada local respetando disponibilidad,
              horas de contrato, días libres y el máximo legal. Tú revisas,
              mueves lo que quieras y publicas.
            </p>

            <div className="mt-2 flex flex-col items-center gap-4 sm:flex-row">
              <Link
                href="/register"
                className="w-full rounded-full bg-surface px-7 py-3.5 text-center text-base font-medium text-secondary transition-transform active:scale-[0.96] sm:w-auto"
              >
                Crear mi empresa
              </Link>
              <span className="text-body-sm text-white/60">
                Listo en 10 minutos
              </span>
            </div>
          </div>
        </section>

        {/* El board real, montado sobre el corte del hero */}
        {/* `relative z-10`: sin él, el hero (posicionado) pintaría por encima
            del board que se le monta con el margen negativo. */}
        <section className="relative z-10 bg-surface px-6 pb-24 md:px-8">
          <div className="mx-auto -mt-32 max-w-295 md:-mt-50">
            <BoardPreview />
          </div>
        </section>

        {/* Cómo funciona */}
        <section
          id="como-funciona"
          className="border-y border-hairline bg-canvas-soft px-6 py-24 md:px-8"
        >
          <div className="mx-auto max-w-295">
            <div className="grid gap-6 pb-14 md:grid-cols-12 md:gap-10">
              <div className="md:col-span-5">
                <span className="text-label-caps uppercase text-primary">
                  Cómo funciona
                </span>
                <h2 className="mt-3 text-h1 text-ink">
                  Tres pasos, una vez. Luego solo revisas.
                </h2>
              </div>
              <p className="text-body-lg text-ink-muted md:col-span-5 md:col-start-7 md:self-end">
                La configuración inicial la haces una sola vez. A partir de ahí,
                cada semana el horario se genera solo y tú decides si lo publicas
                tal cual o mueves un turno.
              </p>
            </div>

            <div className="flex flex-col">
              {PASOS.map(({ numero, titulo, descripcion }, i) => (
                <div
                  key={numero}
                  className={`grid gap-3 border-t border-hairline py-8 md:grid-cols-12 md:gap-10 ${
                    i === PASOS.length - 1 ? "border-b" : ""
                  }`}
                >
                  <span className="text-h2 text-ink-faint md:col-span-1">
                    {numero}
                  </span>
                  <h3 className="text-h3 text-ink md:col-span-4">{titulo}</h3>
                  <p className="text-body-lg text-ink-muted md:col-span-6 md:col-start-7">
                    {descripcion}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Producto */}
        <section id="producto" className="bg-surface px-6 py-24 md:px-8">
          <div className="mx-auto max-w-295">
            <div className="max-w-165 pb-12">
              <span className="text-label-caps uppercase text-primary">
                Producto
              </span>
              <h2 className="mt-3 text-h1 text-ink">
                Las tres cosas que se te escapan cada semana.
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {/* Disponibilidad */}
              <div className="flex flex-col overflow-hidden rounded-xl border border-hairline bg-surface">
                <div className="flex flex-col gap-2.5 px-6 pb-5 pt-6">
                  <h3 className="text-h3 text-ink">Quién puede y quién no</h3>
                  <p className="text-body-sm text-ink-muted">
                    La disponibilidad de cada persona vive en su ficha, y se
                    puede sobreescribir solo para una semana concreta.
                  </p>
                </div>
                <div className="flex flex-col gap-2 border-t border-hairline bg-canvas-soft p-5">
                  {[
                    { franja: "Mañanas", activa: true },
                    { franja: "Tardes", activa: true },
                    { franja: "Noches", activa: false },
                  ].map(({ franja, activa }) => (
                    <div
                      key={franja}
                      className="flex items-center justify-between rounded-lg border border-hairline bg-surface px-3 py-2.5"
                    >
                      <span
                        className={`text-body-sm ${
                          activa ? "text-ink-secondary" : "text-ink-faint"
                        }`}
                      >
                        {franja}
                      </span>
                      <span
                        className={`flex h-5 w-8.5 items-center rounded-full px-0.75 ${
                          activa
                            ? "justify-end bg-primary"
                            : "justify-start bg-hairline"
                        }`}
                      >
                        <span className="size-3.5 rounded-full bg-surface" />
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Límites legales */}
              <div className="flex flex-col overflow-hidden rounded-xl border border-hairline bg-surface">
                <div className="flex flex-col gap-2.5 px-6 pb-5 pt-6">
                  <h3 className="text-h3 text-ink">
                    Los límites que no se negocian
                  </h3>
                  <p className="text-body-sm text-ink-muted">
                    Horas de contrato, días libres y el tope legal de 40 horas
                    son restricciones del motor, no avisos que se puedan
                    ignorar.
                  </p>
                </div>
                <div className="flex flex-col gap-3 border-t border-hairline bg-canvas-soft p-5">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-label-caps uppercase text-ink-muted">
                        Iván Prats
                      </span>
                      <span className="text-[12px] font-semibold tabular-nums text-ink-muted">
                        40 / 40 h
                      </span>
                    </div>
                    <span className="block h-2 overflow-hidden rounded-full bg-hairline">
                      <span className="block h-full w-full rounded-full bg-primary" />
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 rounded-lg border border-hairline bg-surface px-3 py-2.5">
                    <CircleAlert
                      size={16}
                      className="shrink-0 text-accent-orange"
                    />
                    <span className="text-[12px] text-ink-secondary">
                      No se puede añadir otro turno esta semana
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 rounded-lg border border-hairline bg-surface px-3 py-2.5">
                    <Check
                      size={16}
                      strokeWidth={2.5}
                      className="shrink-0 text-accent-green"
                    />
                    <span className="text-[12px] text-ink-secondary">
                      2 días libres respetados
                    </span>
                  </div>
                </div>
              </div>

              {/* Huecos */}
              <div className="flex flex-col overflow-hidden rounded-xl border border-hairline bg-surface">
                <div className="flex flex-col gap-2.5 px-6 pb-5 pt-6">
                  <h3 className="text-h3 text-ink">Los huecos, antes del lunes</h3>
                  <p className="text-body-sm text-ink-muted">
                    Si un turno se queda sin cubrir, aparece marcado en el día y
                    en el resumen de cobertura. No lo descubres cuando abres.
                  </p>
                </div>
                <div className="flex flex-col gap-2 border-t border-hairline bg-canvas-soft p-5">
                  {[
                    { local: "Local Centro", faltan: 1 },
                    { local: "Local Norte", faltan: 0 },
                    { local: "Local Playa", faltan: 0 },
                  ].map(({ local, faltan }) => (
                    <div
                      key={local}
                      className="flex items-center justify-between rounded-lg border border-hairline bg-surface p-3"
                    >
                      <span className="text-body-sm text-ink-secondary">
                        {local}
                      </span>
                      {faltan ? (
                        <span className="rounded-xs bg-accent-orange-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase text-accent-orange-deep">
                          Faltan {faltan}
                        </span>
                      ) : (
                        <span className="rounded-xs bg-accent-green-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase text-accent-green">
                          Completo
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Equipos */}
        <section
          id="equipos"
          className="border-t border-hairline bg-canvas-soft px-6 py-24 md:px-8"
        >
          <div className="mx-auto grid max-w-295 gap-10 md:grid-cols-12">
            <div className="flex flex-col gap-4 md:col-span-4">
              <span className="text-label-caps uppercase text-primary">
                Equipos
              </span>
              <h2 className="text-h1 text-ink">Cada uno entra y ve lo suyo.</h2>
              <p className="text-body-lg text-ink-muted">
                Das de alta a la persona, recibe su acceso por correo y ya está
                dentro. Sin invitaciones pendientes ni cuentas a medias.
              </p>
            </div>

            <div className="flex flex-col md:col-span-7 md:col-start-6">
              {ROLES.map(({ rol, chip, descripcion }, i) => (
                <div
                  key={rol}
                  className={`flex flex-col gap-3 border-t border-hairline py-6 sm:flex-row sm:items-start sm:gap-5 ${
                    i === ROLES.length - 1 ? "border-b" : ""
                  }`}
                >
                  <span
                    className={`w-fit whitespace-nowrap rounded-sm px-2.5 py-1.5 text-label-caps uppercase ${chip}`}
                  >
                    {rol}
                  </span>
                  <p className="text-body-lg text-ink-muted">{descripcion}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Precios */}
        <section id="precios" className="bg-secondary px-6 py-22 md:px-8">
          <div className="mx-auto grid max-w-295 items-center gap-10 md:grid-cols-12">
            <div className="flex flex-col gap-5 md:col-span-6">
              <span className="text-label-caps uppercase text-deep-sky-blue">
                Precios
              </span>
              <h2 className="text-h1 text-white">
                Treinta días completos. Después, 30 € al mes por cada 5
                trabajadores.
              </h2>
              <p className="text-body-lg text-white/75">
                Sin tarjeta para empezar y sin límite de locales durante la
                prueba. Si creces, añades tramos de 5; si no te convence, tus
                datos se van contigo.
              </p>
            </div>

            <div className="md:col-span-5 md:col-start-8">
              <div className="flex flex-col gap-5 rounded-xl bg-surface p-8 shadow-lg">
                <div className="flex flex-col gap-1.5">
                  <span className="text-label-caps uppercase text-ink-muted">
                    Empieza hoy
                  </span>
                  <span className="text-display-sm text-ink">30 días gratis</span>
                  <span className="text-body-sm text-ink-muted">
                    Después, 30 € al mes por cada 5 trabajadores.
                  </span>
                </div>

                <ul className="flex flex-col gap-2.5">
                  {INCLUIDO.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2.5 text-body-sm text-ink-secondary"
                    >
                      <span className="flex size-4.5 shrink-0 items-center justify-center rounded-full bg-accent-green-soft text-accent-green">
                        <Check size={11} strokeWidth={3} />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>

                <Button variant="primary" className="w-full" asChild>
                  <Link href="/register">Crear mi empresa</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-hairline bg-surface px-6 py-10 md:px-8">
        <div className="mx-auto flex max-w-295 flex-col items-center justify-between gap-4 md:flex-row">
          <span className="text-h3 text-primary">EonLab</span>
          <span className="text-body-sm text-ink-muted">
            © {new Date().getFullYear()} EonLab. Todos los derechos reservados.
          </span>
        </div>
      </footer>
    </div>
  );
}
