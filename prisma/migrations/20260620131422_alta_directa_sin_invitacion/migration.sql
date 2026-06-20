/*
  Warnings:

  - You are about to drop the `Invitacion` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Invitacion" DROP CONSTRAINT "Invitacion_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "Invitacion" DROP CONSTRAINT "Invitacion_invitadoPorId_fkey";

-- DropForeignKey
ALTER TABLE "Invitacion" DROP CONSTRAINT "Invitacion_managerId_fkey";

-- DropTable
DROP TABLE "Invitacion";

-- DropEnum
DROP TYPE "InvitacionRol";
