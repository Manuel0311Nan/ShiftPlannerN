"use client";

import { useActionState, useState } from "react";
import { createUserAction } from "@/app/actions/create-user.action";
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
  const [state, formAction, pending] = useActionState(createUserAction, {});
  const [rol, setRol] = useState<"MANAGER" | "EMPLOYEE">(initialRol);
  const [managerId, setManagerId] = useState(initialManagerId);

  const managerSeleccionado =
    viewerRol === "MANAGER" ? managers[0] : managers.find((m) => m.id === managerId);
  const locales = managerSeleccionado?.locales ?? [];

  return (
    <form action={formAction} className="flex flex-col gap-4">
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
          <Select name="localId" required>
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
          <DisponibilidadEditor />
          <CondicionesEditor />
        </>
      )}

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && (
        <p className="text-sm text-accent-green">
          Cuenta creada. Le enviamos las credenciales por email.
        </p>
      )}

      <Button type="submit" variant="primary" loading={pending}>
        {pending ? "Creando…" : "Crear cuenta"}
      </Button>
    </form>
  );
}
