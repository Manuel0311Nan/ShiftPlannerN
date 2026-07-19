-- CreateEnum
CREATE TYPE "SolicitudEstado" AS ENUM ('PENDIENTE', 'ACEPTADA', 'RECHAZADA');

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "diasLibres" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "SolicitudDisponibilidad" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "semanaInicio" TIMESTAMP(3) NOT NULL,
    "motivo" TEXT NOT NULL,
    "estado" "SolicitudEstado" NOT NULL DEFAULT 'PENDIENTE',
    "respuesta" TEXT,
    "resueltaPorId" TEXT,
    "resueltaAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SolicitudDisponibilidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisponibilidadSemana" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "semanaInicio" TIMESTAMP(3) NOT NULL,
    "diaSemana" "DiaSemana" NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFin" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DisponibilidadSemana_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SolicitudDisponibilidad_empresaId_idx" ON "SolicitudDisponibilidad"("empresaId");

-- CreateIndex
CREATE INDEX "SolicitudDisponibilidad_usuarioId_idx" ON "SolicitudDisponibilidad"("usuarioId");

-- CreateIndex
CREATE INDEX "SolicitudDisponibilidad_empresaId_estado_idx" ON "SolicitudDisponibilidad"("empresaId", "estado");

-- CreateIndex
CREATE INDEX "DisponibilidadSemana_empresaId_idx" ON "DisponibilidadSemana"("empresaId");

-- CreateIndex
CREATE INDEX "DisponibilidadSemana_usuarioId_semanaInicio_idx" ON "DisponibilidadSemana"("usuarioId", "semanaInicio");

-- AddForeignKey
ALTER TABLE "SolicitudDisponibilidad" ADD CONSTRAINT "SolicitudDisponibilidad_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitudDisponibilidad" ADD CONSTRAINT "SolicitudDisponibilidad_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisponibilidadSemana" ADD CONSTRAINT "DisponibilidadSemana_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisponibilidadSemana" ADD CONSTRAINT "DisponibilidadSemana_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
