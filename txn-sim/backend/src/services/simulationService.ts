import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import { protocolRepository } from "./protocolRepository";
import { auditService } from "./auditService";
import { z } from "zod";
import { createSimulationSchema } from "../utils/validators";

type CreateSimulationInput = z.infer<typeof createSimulationSchema>;

export class SimulationService {
  async create(input: CreateSimulationInput, createdById: string) {
    const protocol = await protocolRepository.findByCode(input.protocolCode);
    if (!protocol.active) {
      throw new AppError(`Protocol "${input.protocolCode}" is not currently active.`, 400);
    }

    const existing = await prisma.simulation.findUnique({ where: { testTransactionId: input.testTransactionId } });
    if (existing) {
      throw new AppError(`Test Transaction ID "${input.testTransactionId}" already exists.`, 409);
    }

    const simulation = await prisma.simulation.create({
      data: {
        testTransactionId: input.testTransactionId,
        protocolId: protocol.id,
        cardNetwork: input.cardNetwork,
        syntheticCardRef: input.syntheticCardRef,
        cardType: input.cardType,
        syntheticIssuer: input.syntheticIssuer,
        currency: input.currency.toUpperCase(),
        amount: input.amount,
        transactionType: input.transactionType.toUpperCase(),
        referenceNumber: input.referenceNumber,
        testAuthCode: input.testAuthCode,
        testAccountStatus: input.testAccountStatus,
        errorScenario: input.errorScenario,
        status: "PENDING",
        createdById,
      },
      include: { protocol: true },
    });

    await auditService.record({
      simulationId: simulation.id,
      transactionRef: simulation.testTransactionId,
      protocolCode: protocol.code,
      eventType: "SIMULATION_CREATED",
      result: "INFO",
      metadata: { network: simulation.cardNetwork, currency: simulation.currency },
      actorId: createdById,
    });

    return simulation;
  }
}

export const simulationService = new SimulationService();
