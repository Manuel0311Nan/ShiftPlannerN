import Link from "next/link";
import { Card } from "@/shared/ui/card";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-canvas-soft px-6 py-16">
      <div className="flex w-full max-w-[420px] flex-col gap-6">
        <Link
          href="/"
          className="text-center text-[20px] font-semibold tracking-[-0.125px] text-ink"
        >
          Turnia
        </Link>

        <Card elevated className="flex flex-col gap-6">
          <div className="text-center">
            <h1 className="text-[22px] font-bold leading-[1.27] tracking-[-0.25px] text-ink">
              Crea tu empresa
            </h1>
            <p className="mt-1 text-[15px] text-ink-muted">
              30 días gratis, sin tarjeta de crédito.
            </p>
          </div>
          <RegisterForm />
        </Card>

        <p className="text-center text-[14px] text-ink-muted">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-primary">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
