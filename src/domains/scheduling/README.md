# Scheduling — motor de generación de horarios

Detalle específico de este bounded context. El `CLAUDE.md` raíz solo referencia
este archivo; las decisiones firmes del motor viven aquí.

## Modelo de optimización (decisión tomada)

El motor es un **ILP (programación lineal entera)** agnóstico del solver: el
dominio construye un `ModeloILP` (`domain/generar-asignaciones-ilp.ts`,
`domain/modelo-ilp.ts`) y un adaptador de infraestructura lo resuelve con
**yalps** (`infrastructure/yalps-solver.ts`, puerto `ScheduleSolver`). Así el
solver es intercambiable sin tocar dominio ni use case.

> Nota histórica: existió un heurístico greedy previo
> (`domain/generar-asignaciones.ts`); de ahí se reutilizan las funciones puras
> `cubreDisponibilidad`, `seSuperponen`, `duracionHoras` y
> `calcularFechasBloque`. La generación real usa el ILP. La función
> `generarAsignaciones` de ese archivo ya no la llama nadie.

Estructura del modelo (variables/restricciones principales):

- `x__w__b` (binaria): trabajador `w` cubre el bloque `b`. Solo se crea para
  pares disponibles. Recompensa cobertura en el objetivo. "Disponible" se
  evalúa sobre la **unión** de las franjas del trabajador ese día
  (`cubreDisponibilidad` → `shared/kernel/intervalos.ts`), no franja a franja:
  quien declara 09:00-14:00 y 14:00-22:00 puede cubrir un turno de 12:00-18:00.
- Cobertura: `Σ_w x ≤ personasRequeridas` por bloque.
- No-solape: pares de bloques solapados del mismo día, `≤ 1`.
- Partido: aux `p__w__día` con `2·p − Σ x ≤ 0`.
- Mínimos por tipo (apertura/cierre/partido): duros, o blandos con slack
  penalizado en el modelo elástico.
- Equidad: minimizar la carga máxima `H` (objetivo secundario).

Ante infactibilidad de las condiciones duras, en vez de abortar se resuelve un
**modelo elástico** (mínimos blandos con slack) para generar lo posible y
reportar qué queda por cubrir a mano (`condicionesIncumplidas`,
`horasIncumplidas`, `huecos`).

`PlantillaTurno` define el horario semanal del local (bloques por día);
`Disponibilidad` la del trabajador (día por día).

## Bloques solapados en la plantilla (decisión tomada)

Los bloques de `PlantillaTurno` **pueden solaparse**: en las horas compartidas
la demanda de cada bloque se suma. Es la única forma de expresar un refuerzo de
mediodía sobre una mañana y una tarde ya definidas. El motor no necesitó cambios
—la cobertura ya era por bloque y el no-solape ya era por trabajador—; lo que se
quitó fue el bloqueo del editor (`WeeklyBlocksEditor`, prop `permitirSolape`),
que era la única regla que lo impedía y vivía solo en el cliente.

En el editor de **disponibilidad** el solape sigue bloqueado: dos tramos
solapados no declaran nada que uno solo no diga ya.

Con solapes, las cifras del editor son de unión, no sumas: horas de cobertura
(el tiempo solapado cuenta una vez) y pico de personas simultáneas
(`shared/ui/weekly-blocks/solapamiento.ts`).

## Horas de contrato + tope legal (decisión tomada)

Cada `Usuario` tiene `horasContrato` (semanales, 1–40; `crearHorasContrato`). En
el motor es a la vez el mínimo semanal a cumplir (blando: si no se puede, se
reporta el déficit en `horasIncumplidas` en vez de abortar) y el tope de horas
asignadas. Máximo legal fijo de 40h (`MAX_HORAS_SEMANALES`). El interruptor
`permitirHorasExtra` sube el tope de cada trabajador del contrato hasta 40h para
absorber cobertura sin cubrir; sin él, tope = contrato.

## Días de libranza (decisión tomada)

Cada `Usuario` tiene `diasLibres` (0–6; `crearDiasLibres`), días de descanso
obligatorio por semana que fija el manager. En el motor es un tope duro de días
trabajados: `7 − diasLibres` (aux binaria por día `d__w__día`). Es un tope
(trabajar menos días siempre es factible), así que nunca provoca infactibilidad
por sí solo; si choca con el mínimo de horas, el elástico reporta el déficit de
horas. Se cuenta sobre 7 días, así que en locales que abren pocos días solo
muerde con valores altos (pensado para hostelería que abre 6–7 días).

## Cambio de disponibilidad por semana (decisión tomada)

La `Disponibilidad` base es fija, pero un trabajador puede pedir un cambio para
una semana concreta desde `/dashboard/solicitudes` (`SolicitudDisponibilidad`:
semana + motivo en texto, con `DIAS_ANTELACION_SOLICITUD` = 15 días de antelación
mínima). El manager la resuelve en la misma pantalla: al aceptar define la
disponibilidad de esa semana (`ResolverSolicitudDisponibilidadCommand`), que se
guarda como override `DisponibilidadSemana` (por `usuarioId` + `semanaInicio`).
El motor (`empleadosParaOptimizacion(localId, semanaInicio)`) usa ese override en
lugar de la disponibilidad base cuando existe para la semana generada. Un MANAGER
solo resuelve solicitudes de sus trabajadores.
