"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createUserAction } from "@/app/actions/create-user.action";
import { alertaError, toastExito } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { PlantillaEditor } from "@/domains/shifts/ui/plantilla-editor";
import { DisponibilidadEditor } from "@/domains/employees/ui/disponibilidad-editor";
import { CondicionesEditor } from "@/domains/employees/ui/condiciones-editor";

type Manager = { id: string; nombre: string; locales: { id: string; nombre: string }[] };

export function CreateUserForm({
  viewerRol,
  managers,
  initialRol,
  initialManagerId,
}: {
  viewerRol: "ADMIN" | "MANAGER";
  managers: Manager[];
  initialRol: "MANAGER" | "EMPLOYEE";
  initialManagerId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [rol, setRol] = useState<"MANAGER" | "EMPLOYEE">(initialRol);
  const [managerId, setManagerId] = useState(initialManagerId);
  // Cambiar esta key remonta los campos del formulario (incluidos los editores
  // de horario/disponibilidad, que tienen estado propio) para dejarlo en blanco.
  const [formKey, setFormKey] = useState(0);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await createUserAction({}, formData);
      if (result.error) {
        alertaError(result.error);
        return;
      }
      if (result.rol === "MANAGER" && result.usuarioId) {
        // Manager creado: ir a su ficha.
        toastExito("Manager creado. Le enviamos sus credenciales por email.");
        router.push(`/dashboard/managers/${result.usuarioId}`);
        return;
      }
      // Trabajador creado: limpiar el formulario para crear otro.
      toastExito("Trabajador creado. Le enviamos sus credenciales por email.");
      setRol(initialRol);
      setManagerId(initialManagerId);
      setFormKey((k) => k + 1);
    });
  }

  const managerSeleccionado =
    viewerRol === "MANAGER" ? managers[0] : managers.find((m) => m.id === managerId);
  const locales = managerSeleccionado?.locales ?? [];

  return (
    <form key={formKey} onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="nombre">Nombre</Label>
        <Input id="nombre" name="nombre" required minLength={2} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
      </div>

      {viewerRol === "ADMIN" ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rol">Rol</Label>
          <Select
            name="rol"
            value={rol}
            onValueChange={(value) => setRol(value as "MANAGER" | "EMPLOYEE")}
            items={{ MANAGER: "Manager", EMPLOYEE: "Trabajador" }}
          >
            <SelectTrigger id="rol">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MANAGER">Manager</SelectItem>
              <SelectItem value="EMPLOYEE">Trabajador</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ) : (
        <input type="hidden" name="rol" value="EMPLOYEE" />
      )}

      {rol === "EMPLOYEE" && viewerRol === "ADMIN" && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="managerId">Manager</Label>
          <Select
            name="managerId"
            required
            value={managerId}
            onValueChange={(value) => setManagerId(value ?? "")}
            items={Object.fromEntries(managers.map((m) => [m.id, m.nombre]))}
          >
            <SelectTrigger id="managerId">
              <SelectValue placeholder="Selecciona un manager" />
            </SelectTrigger>
            <SelectContent>
              {managers.map((manager) => (
                <SelectItem key={manager.id} value={manager.id}>
                  {manager.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {rol === "EMPLOYEE" && locales.length > 1 && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="localId">Local</Label>
          <Select
            name="localId"
            required
            items={Object.fromEntries(locales.map((l) => [l.id, l.nombre]))}
          >
            <SelectTrigger id="localId">
              <SelectValue placeholder="Selecciona un local" />
            </SelectTrigger>
            <SelectContent>
              {locales.map((local) => (
                <SelectItem key={local.id} value={local.id}>
                  {local.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {rol === "MANAGER" && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="localNombre">Nombre del local</Label>
          <Input id="localNombre" name="localNombre" required minLength={2} />
        </div>
      )}

      {rol === "MANAGER" && <PlantillaEditor />}
      {rol === "EMPLOYEE" && (
        <>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="horasContrato">Horas de contrato (semanales)</Label>
            <Input
              id="horasContrato"
              name="horasContrato"
              type="number"
              min={1}
              max={40}
              defaultValue={40}
              required
              className="w-32"
            />
            <p className="text-body-sm text-ink-muted">
              Mínimo que el horario intenta cumplir y tope de horas asignadas
              (máximo legal 40h). Las horas extra al generar suben el tope hasta
              40h.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="diasLibres">Días de libranza (por semana)</Label>
            <Input
              id="diasLibres"
              name="diasLibres"
              type="number"
              min={0}
              max={6}
              defaultValue={0}
              required
              className="w-32"
            />
            <p className="text-body-sm text-ink-muted">
              Días que el trabajador libra obligatoriamente cada semana. El
              horario nunca le asignará turnos en más de 7 − estos días.
            </p>
          </div>
          <DisponibilidadEditor />
          <CondicionesEditor />
        </>
      )}

      <Button type="submit" variant="primary" loading={pending}>
        {pending ? "Creando…" : "Crear cuenta"}
      </Button>
    </form>
  );
}
