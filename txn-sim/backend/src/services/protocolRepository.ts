import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";

export class ProtocolRepository {
  async listActive() {
    return prisma.protocolDefinition.findMany({ where: { active: true }, orderBy: { code: "asc" } });
  }

  async listAll() {
    return prisma.protocolDefinition.findMany({ orderBy: { code: "asc" } });
  }

  async findByCode(code: string) {
    const protocol = await prisma.protocolDefinition.findUnique({ where: { code } });
    if (!protocol) {
      throw new AppError(`Protocol "${code}" was not found.`, 404);
    }
    return protocol;
  }

  async update(code: string, data: Record<string, unknown>) {
    await this.findByCode(code);
    return prisma.protocolDefinition.update({ where: { code }, data });
  }
}

export const protocolRepository = new ProtocolRepository();
