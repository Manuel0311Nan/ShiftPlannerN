import Link from "next/link";
import { Card } from "@/shared/ui/card";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-canvas-soft px-6 py-16">
      <div className="flex w-full max-w-[420px] flex-col gap-6">
        <Link
          href="/"
          className="text-center text-[20px] font-semibold tracking-[-0.125px] text-ink"
        >
          ScheduleAI
        </Link>

        <Card elevated className="flex flex-col gap-6">
          <div className="text-center">
            <h1 className="text-[22px] font-bold leading-[1.27] tracking-[-0.25px] text-ink">
              Inicia sesión
            </h1>
          </div>
          <LoginForm />
        </Card>

        <p className="text-center text-[14px] text-ink-muted">
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="text-primary">
            Crea tu empresa
          </Link>
        </p>
      </div>
    </div>
  );
}
