-- CreateEnum
CREATE TYPE "TipoTurno" AS ENUM ('APERTURA', 'CIERRE', 'PARTIDO');

-- CreateTable
CREATE TABLE "CondicionTurno" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tipo" "TipoTurno" NOT NULL,
    "minimo" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CondicionTurno_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CondicionTurno_empresaId_idx" ON "CondicionTurno"("empresaId");

-- CreateIndex
CREATE INDEX "CondicionTurno_usuarioId_idx" ON "CondicionTurno"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "CondicionTurno_usuarioId_tipo_key" ON "CondicionTurno"("usuarioId", "tipo");

-- AddForeignKey
ALTER TABLE "CondicionTurno" ADD CONSTRAINT "CondicionTurno_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CondicionTurno" ADD CONSTRAINT "CondicionTurno_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
