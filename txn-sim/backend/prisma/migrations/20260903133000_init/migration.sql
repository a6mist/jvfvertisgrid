-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'OPERATOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "CardNetwork" AS ENUM ('VISA', 'MASTERCARD');

-- CreateEnum
CREATE TYPE "CardType" AS ENUM ('DEBIT', 'CREDIT', 'PREPAID');

-- CreateEnum
CREATE TYPE "SimulationStatus" AS ENUM ('PENDING', 'RUNNING', 'VERIFIED', 'FAILED');

-- CreateEnum
CREATE TYPE "StepStatus" AS ENUM ('PENDING', 'SUCCESS', 'WARNING', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'VIEWER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProtocolDefinition" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "description" TEXT NOT NULL,
    "isOfficial" BOOLEAN NOT NULL DEFAULT false,
    "classificationLabel" TEXT NOT NULL DEFAULT 'Custom simulation protocol — not an official Visa/Mastercard specification.',
    "inputRequirements" JSONB NOT NULL,
    "validationRules" JSONB NOT NULL,
    "simulationSteps" JSONB NOT NULL,
    "successConditions" JSONB NOT NULL,
    "failureConditions" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProtocolDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Simulation" (
    "id" TEXT NOT NULL,
    "testTransactionId" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "cardNetwork" "CardNetwork" NOT NULL,
    "syntheticCardRef" TEXT NOT NULL,
    "cardType" "CardType" NOT NULL,
    "syntheticIssuer" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "transactionType" TEXT NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "testAuthCode" TEXT NOT NULL,
    "testAccountStatus" TEXT NOT NULL,
    "status" "SimulationStatus" NOT NULL DEFAULT 'PENDING',
    "simulationRefId" TEXT,
    "overallResult" TEXT,
    "processingDurationMs" INTEGER,
    "errorScenario" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Simulation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimulationStep" (
    "id" TEXT NOT NULL,
    "simulationId" TEXT NOT NULL,
    "stepName" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "status" "StepStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "result" TEXT,
    "diagnostic" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SimulationStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "simulationId" TEXT,
    "transactionRef" TEXT,
    "protocolCode" TEXT,
    "eventType" TEXT NOT NULL,
    "result" TEXT,
    "systemVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "metadata" JSONB,
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ProtocolDefinition_code_key" ON "ProtocolDefinition"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Simulation_testTransactionId_key" ON "Simulation"("testTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "Simulation_simulationRefId_key" ON "Simulation"("simulationRefId");

-- AddForeignKey
ALTER TABLE "Simulation" ADD CONSTRAINT "Simulation_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "ProtocolDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Simulation" ADD CONSTRAINT "Simulation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulationStep" ADD CONSTRAINT "SimulationStep_simulationId_fkey" FOREIGN KEY ("simulationId") REFERENCES "Simulation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_simulationId_fkey" FOREIGN KEY ("simulationId") REFERENCES "Simulation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
