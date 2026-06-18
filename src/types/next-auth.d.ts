import type { Rol } from "@/domains/identity/domain/usuario.entity";

declare module "next-auth" {
  interface User {
    empresaId: string;
    rol: Rol;
  }

  interface Session {
    user: User & {
      id: string;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    empresaId: string;
    rol: Rol;
  }
}
