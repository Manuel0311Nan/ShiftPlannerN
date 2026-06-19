"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions/login.action";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-[14px] text-ink-secondary">
          Email
        </label>
        <Input id="email" name="email" type="email" required />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-[14px] text-ink-secondary">
          Contraseña
        </label>
        <Input id="password" name="password" type="password" required />
      </div>

      {state.error && (
        <p className="text-[14px] text-red-600">{state.error}</p>
      )}

      <Button type="submit" variant="primary" disabled={pending} className="mt-2">
        {pending ? "Iniciando sesión…" : "Iniciar sesión"}
      </Button>
    </form>
  );
}
