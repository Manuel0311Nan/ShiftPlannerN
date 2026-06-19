-- CreateEnum
CREATE TYPE "InvitacionRol" AS ENUM ('MANAGER', 'EMPLOYEE');

-- CreateTable
CREATE TABLE "Invitacion" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "rol" "InvitacionRol" NOT NULL,
    "empresaId" TEXT NOT NULL,
    "managerId" TEXT,
    "invitadoPorId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "aceptadaEn" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invitacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invitacion_token_key" ON "Invitacion"("token");

-- CreateIndex
CREATE INDEX "Invitacion_empresaId_idx" ON "Invitacion"("empresaId");

-- CreateIndex
CREATE INDEX "Invitacion_email_empresaId_idx" ON "Invitacion"("email", "empresaId");

-- CreateIndex
CREATE INDEX "Invitacion_managerId_idx" ON "Invitacion"("managerId");

-- AddForeignKey
ALTER TABLE "Invitacion" ADD CONSTRAINT "Invitacion_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitacion" ADD CONSTRAINT "Invitacion_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitacion" ADD CONSTRAINT "Invitacion_invitadoPorId_fkey" FOREIGN KEY ("invitadoPorId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
