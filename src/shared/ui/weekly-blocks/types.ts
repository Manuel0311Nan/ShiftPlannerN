import type { DiaSemana } from "@/shared/kernel/dia-semana";

export type BloqueSemanal = {
  id: string;
  diaSemana: DiaSemana;
  horaInicio: string;
  horaFin: string;
  nombre?: string;
  personasRequeridas?: number;
};

export type PresetFranja = {
  label: string;
  rangos: { horaInicio: string; horaFin: string }[];
};
