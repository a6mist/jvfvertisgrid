import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";

const SYSTEM_VERSION = "1.0.0";

export interface AuditEventInput {
  simulationId?: string;
  transactionRef?: string;
  protocolCode?: string;
  eventType: string;
  result?: string;
  metadata?: Record<string, unknown>;
  actorId?: string;
}

export class AuditService {
  async record(event: AuditEventInput) {
    return prisma.auditLog.create({
      data: {
        simulationId: event.simulationId,
        transactionRef: event.transactionRef,
        protocolCode: event.protocolCode,
        eventType: event.eventType,
        result: event.result,
        systemVersion: SYSTEM_VERSION,
        metadata: (event.metadata ?? {}) as Prisma.InputJsonValue,
        actorId: event.actorId,
      },
    });
  }

  async list(filters: { protocolCode?: string; eventType?: string; take?: number; skip?: number }) {
    const where: Record<string, unknown> = {};
    if (filters.protocolCode) where.protocolCode = filters.protocolCode;
    if (filters.eventType) where.eventType = filters.eventType;

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: filters.take ?? 50,
        skip: filters.skip ?? 0,
        include: { actor: { select: { name: true, email: true, role: true } } },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { items, total };
  }
}

export const auditService = new AuditService();
