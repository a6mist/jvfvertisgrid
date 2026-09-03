import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import { protocolEngine, SimulationInput } from "../protocols/engine";
import { auditService } from "./auditService";
import { ProtocolSeed } from "../protocols/definitions";

export class VerificationService {
  async verify(simulationId: string, actorId: string) {
    const simulation = await prisma.simulation.findUnique({
      where: { id: simulationId },
      include: { protocol: true },
    });
    if (!simulation) throw new AppError("Simulation not found.", 404);
    if (simulation.status === "VERIFIED" || simulation.status === "FAILED") {
      throw new AppError("This simulation has already been run. Create a new simulation to test again.", 400);
    }

    await prisma.simulation.update({ where: { id: simulationId }, data: { status: "RUNNING" } });

    const protocolSeed: ProtocolSeed = {
      code: simulation.protocol.code,
      name: simulation.protocol.name,
      version: simulation.protocol.version,
      description: simulation.protocol.description,
      inputRequirements: simulation.protocol.inputRequirements as string[],
      validationRules: simulation.protocol.validationRules as string[],
      simulationSteps: simulation.protocol.simulationSteps as string[],
      successConditions: simulation.protocol.successConditions as string[],
      failureConditions: simulation.protocol.failureConditions as string[],
    };

    const engineInput: SimulationInput = {
      testTransactionId: simulation.testTransactionId,
      protocolCode: simulation.protocol.code,
      cardNetwork: simulation.cardNetwork,
      syntheticCardRef: simulation.syntheticCardRef,
      cardType: simulation.cardType,
      syntheticIssuer: simulation.syntheticIssuer,
      currency: simulation.currency,
      amount: Number(simulation.amount),
      transactionType: simulation.transactionType,
      referenceNumber: simulation.referenceNumber,
      testAuthCode: simulation.testAuthCode,
      testAccountStatus: simulation.testAccountStatus,
      errorScenario: (simulation.errorScenario as SimulationInput["errorScenario"]) ?? undefined,
    };

    const runResult = protocolEngine.run(protocolSeed, engineInput);

    // Persist step results
    await prisma.simulationStep.createMany({
      data: runResult.steps.map((step, index) => ({
        simulationId: simulation.id,
        stepName: step.stepName,
        stepOrder: index,
        status: step.status,
        startedAt: new Date(),
        finishedAt: new Date(),
        durationMs: step.durationMs,
        result: step.result,
        diagnostic: step.diagnostic as any,
      })),
    });

    const finalStatus = runResult.overallResult === "FAILED" ? "FAILED" : "VERIFIED";

    const updated = await prisma.simulation.update({
      where: { id: simulation.id },
      data: {
        status: finalStatus,
        overallResult: runResult.overallResult,
        simulationRefId: runResult.simulationRefId,
        processingDurationMs: runResult.processingDurationMs,
      },
      include: { protocol: true, steps: { orderBy: { stepOrder: "asc" } } },
    });

    await auditService.record({
      simulationId: simulation.id,
      transactionRef: simulation.testTransactionId,
      protocolCode: simulation.protocol.code,
      eventType: "SIMULATION_COMPLETED",
      result: runResult.overallResult,
      metadata: {
        simulationRefId: runResult.simulationRefId,
        processingDurationMs: runResult.processingDurationMs,
        stepCount: runResult.steps.length,
      },
      actorId,
    });

    return updated;
  }
}

export const verificationService = new VerificationService();
