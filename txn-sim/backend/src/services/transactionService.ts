import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";

export interface TransactionFilters {
  protocolCode?: string;
  network?: "VISA" | "MASTERCARD";
  status?: "PENDING" | "RUNNING" | "VERIFIED" | "FAILED";
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  take?: number;
  skip?: number;
  sortBy?: "createdAt" | "amount" | "status";
  sortDir?: "asc" | "desc";
}

export class TransactionService {
  async list(filters: TransactionFilters) {
    const where: Prisma.SimulationWhereInput = {};

    if (filters.network) where.cardNetwork = filters.network;
    if (filters.status) where.status = filters.status;
    if (filters.protocolCode) where.protocol = { code: filters.protocolCode };
    if (filters.search) {
      where.OR = [
        { testTransactionId: { contains: filters.search, mode: "insensitive" } },
        { referenceNumber: { contains: filters.search, mode: "insensitive" } },
        { syntheticCardRef: { contains: filters.search, mode: "insensitive" } },
      ];
    }
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) (where.createdAt as Prisma.DateTimeFilter).gte = new Date(filters.dateFrom);
      if (filters.dateTo) (where.createdAt as Prisma.DateTimeFilter).lte = new Date(filters.dateTo);
    }

    const orderBy: Prisma.SimulationOrderByWithRelationInput = {
      [filters.sortBy ?? "createdAt"]: filters.sortDir ?? "desc",
    };

    const [items, total] = await Promise.all([
      prisma.simulation.findMany({
        where,
        orderBy,
        take: filters.take ?? 25,
        skip: filters.skip ?? 0,
        include: { protocol: true },
      }),
      prisma.simulation.count({ where }),
    ]);

    return { items, total };
  }

  async findById(id: string) {
    const simulation = await prisma.simulation.findUnique({
      where: { id },
      include: { protocol: true, steps: { orderBy: { stepOrder: "asc" } }, auditLogs: true },
    });
    if (!simulation) throw new AppError("Simulation not found.", 404);
    return simulation;
  }

  async dashboardSummary() {
    const [total, verified, failed, pending, running, byProtocol, byStatus] = await Promise.all([
      prisma.simulation.count(),
      prisma.simulation.count({ where: { status: "VERIFIED" } }),
      prisma.simulation.count({ where: { status: "FAILED" } }),
      prisma.simulation.count({ where: { status: "PENDING" } }),
      prisma.simulation.count({ where: { status: "RUNNING" } }),
      prisma.simulation.groupBy({ by: ["protocolId"], _count: { _all: true } }),
      prisma.simulation.groupBy({ by: ["status"], _count: { _all: true } }),
    ]);

    const protocols = await prisma.protocolDefinition.findMany();
    const protocolMap = new Map(protocols.map((p) => [p.id, p.code]));
    const protocolDistribution = byProtocol.map((row) => ({
      protocolCode: protocolMap.get(row.protocolId) ?? "unknown",
      count: row._count._all,
    }));

    const statusDistribution = byStatus.map((row) => ({
      status: row.status,
      count: row._count._all,
    }));

    const recent = await prisma.simulation.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { protocol: true },
    });

    return {
      totals: { total, verified, failed, pending, running },
      protocolDistribution,
      statusDistribution,
      recent,
    };
  }
}

export const transactionService = new TransactionService();
