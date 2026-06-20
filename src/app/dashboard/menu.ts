import {
  Calendar,
  CreditCard,
  UserPlus,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Rol } from "@/domains/identity/domain/usuario.entity";

export type DashboardMenuItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  roles: Rol[];
};

export const DASHBOARD_MENU: DashboardMenuItem[] = [
  {
    href: "/dashboard/managers",
    label: "Managers",
    description: "Listado de managers y los equipos que tienen a cargo.",
    icon: UserCog,
    roles: ["ADMIN"],
  },
  {
    href: "/dashboard/empleados",
    label: "Trabajadores",
    description: "Empleados de la empresa, agrupados por manager.",
    icon: Users,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    href: "/dashboard/horarios",
    label: "Horarios",
    description: "Turnos anteriores y próximos de tu empresa.",
    icon: Calendar,
    roles: ["ADMIN", "MANAGER", "EMPLOYEE"],
  },
  {
    href: "/dashboard/equipo",
    label: "Equipo",
    description: "Crea cuentas para managers o empleados de tu empresa.",
    icon: UserPlus,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    href: "/dashboard/plan",
    label: "Plan",
    description: "Tu plan activo y el estado de la prueba gratuita.",
    icon: CreditCard,
    roles: ["ADMIN"],
  },
];

export function menuForRol(rol: Rol): DashboardMenuItem[] {
  return DASHBOARD_MENU.filter((item) => item.roles.includes(rol));
}
