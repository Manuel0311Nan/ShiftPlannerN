-- CreateEnum
CREATE TYPE "DiaSemana" AS ENUM ('LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO');

-- AlterTable
ALTER TABLE "Invitacion" ADD COLUMN     "datosAdicionales" JSONB;

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "localId" TEXT;

-- CreateTable
CREATE TABLE "Local" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Local_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlantillaTurno" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "localId" TEXT NOT NULL,
    "diaSemana" "DiaSemana" NOT NULL,
    "nombre" TEXT NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFin" TEXT NOT NULL,
    "personasRequeridas" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlantillaTurno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Disponibilidad" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "diaSemana" "DiaSemana" NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFin" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Disponibilidad_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Local_empresaId_idx" ON "Local"("empresaId");

-- CreateIndex
CREATE INDEX "Local_managerId_idx" ON "Local"("managerId");

-- CreateIndex
CREATE INDEX "PlantillaTurno_empresaId_idx" ON "PlantillaTurno"("empresaId");

-- CreateIndex
CREATE INDEX "PlantillaTurno_localId_idx" ON "PlantillaTurno"("localId");

-- CreateIndex
CREATE INDEX "Disponibilidad_empresaId_idx" ON "Disponibilidad"("empresaId");

-- CreateIndex
CREATE INDEX "Disponibilidad_usuarioId_idx" ON "Disponibilidad"("usuarioId");

-- CreateIndex
CREATE INDEX "Usuario_localId_idx" ON "Usuario"("localId");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_localId_fkey" FOREIGN KEY ("localId") REFERENCES "Local"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Local" ADD CONSTRAINT "Local_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Local" ADD CONSTRAINT "Local_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantillaTurno" ADD CONSTRAINT "PlantillaTurno_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantillaTurno" ADD CONSTRAINT "PlantillaTurno_localId_fkey" FOREIGN KEY ("localId") REFERENCES "Local"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Disponibilidad" ADD CONSTRAINT "Disponibilidad_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Disponibilidad" ADD CONSTRAINT "Disponibilidad_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
