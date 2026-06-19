import Link from "next/link";
import { auth } from "@/auth";
import { Card } from "@/shared/ui/card";
import { menuForRol } from "./menu";

export default async function DashboardPage() {
  const session = await auth();
  const menu = menuForRol(session!.user.rol);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-[26px] font-bold leading-[1.23] tracking-[-0.625px] text-ink">
          Hola, {session!.user.name}
        </h1>
        <p className="mt-1 text-[15px] text-ink-muted">
          Empresa: {session!.user.empresaId}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {menu.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <Card elevated className="flex h-full flex-col gap-3 transition-transform hover:-translate-y-0.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-canvas-soft text-primary">
                  <Icon size={20} />
                </div>
                <h3 className="text-[20px] font-semibold leading-[1.4] tracking-[-0.125px] text-ink">
                  {item.label}
                </h3>
                <p className="text-[15px] leading-[1.33] text-ink-muted">
                  {item.description}
                </p>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
