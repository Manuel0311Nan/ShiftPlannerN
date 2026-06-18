import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/shared/kernel/password";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;

        const usuario = await prisma.usuario.findUnique({
          where: { email: parsed.data.email.trim().toLowerCase() },
        });
        if (!usuario) return null;

        const valid = await verifyPassword(
          parsed.data.password,
          usuario.passwordHash,
        );
        if (!valid) return null;

        return {
          id: usuario.id,
          email: usuario.email,
          name: usuario.nombre,
          empresaId: usuario.empresaId,
          rol: usuario.rol,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.empresaId = user.empresaId;
        token.rol = user.rol;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.sub!;
      session.user.empresaId = token.empresaId;
      session.user.rol = token.rol;
      return session;
    },
  },
});
