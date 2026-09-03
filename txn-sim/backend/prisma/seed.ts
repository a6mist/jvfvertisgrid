/**
 * Seed data for the Transaction Verification & Protocol Simulator.
 *
 * Every value below is fictional and cannot be mistaken for a real
 * payment credential: card references use the TEST-<NETWORK>-#### shape,
 * issuer names are clearly fictitious, and authorization codes use the
 * TEST-#### shape.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PROTOCOL_SEEDS, SIMULATOR_CLASSIFICATION_LABEL } from "../src/protocols/definitions";
import { protocolEngine } from "../src/protocols/engine";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding fictional users...");
  const passwords = {
    admin: "AvaAdmin!2026#Jvf",
    operator: "OwenOperator!2026#Jvf",
    viewer: "VeraViewer!2026#Jvf",
    payer: "PayerAccount!2026#Jvf",
  };

  const emailMigrations = [
    ["admin@simulator.test", "admin@jvfvertisgrid.online"],
    ["operator@simulator.test", "operator@jvfvertisgrid.online"],
    ["viewer@simulator.test", "Viewer@jvfvertisgrid.online"],
  ] as const;
  for (const [legacyEmail, requestedEmail] of emailMigrations) {
    const requestedUser = await prisma.user.findUnique({ where: { email: requestedEmail } });
    if (!requestedUser) {
      await prisma.user.updateMany({ where: { email: legacyEmail }, data: { email: requestedEmail } });
    }
  }

  const admin = await prisma.user.upsert({
    where: { email: "admin@jvfvertisgrid.online" },
    update: { passwordHash: await bcrypt.hash(passwords.admin, 12), role: "ADMIN" },
    create: {
      email: "admin@jvfvertisgrid.online",
      name: "Ava Administrator",
      passwordHash: await bcrypt.hash(passwords.admin, 12),
      role: "ADMIN",
    },
  });

  const operator = await prisma.user.upsert({
    where: { email: "operator@jvfvertisgrid.online" },
    update: { passwordHash: await bcrypt.hash(passwords.operator, 12), role: "OPERATOR" },
    create: {
      email: "operator@jvfvertisgrid.online",
      name: "Owen Operator",
      passwordHash: await bcrypt.hash(passwords.operator, 12),
      role: "OPERATOR",
    },
  });

  const viewer = await prisma.user.upsert({
    where: { email: "Viewer@jvfvertisgrid.online" },
    update: { passwordHash: await bcrypt.hash(passwords.viewer, 12), role: "VIEWER" },
    create: {
      email: "Viewer@jvfvertisgrid.online",
      name: "Vera Viewer",
      passwordHash: await bcrypt.hash(passwords.viewer, 12),
      role: "VIEWER",
    },
  });

  await prisma.user.upsert({
    where: { email: "payer@jvfvertisgrid.online" },
    update: { passwordHash: await bcrypt.hash(passwords.payer, 12), role: "VIEWER" },
    create: {
      email: "payer@jvfvertisgrid.online",
      name: "Parker Payer",
      passwordHash: await bcrypt.hash(passwords.payer, 12),
      role: "VIEWER",
    },
  });

  console.log("Seeding protocol definitions...");
  for (const seed of PROTOCOL_SEEDS) {
    await prisma.protocolDefinition.upsert({
      where: { code: seed.code },
      update: {
        name: seed.name,
        version: seed.version,
        description: seed.description,
        inputRequirements: seed.inputRequirements,
        validationRules: seed.validationRules,
        simulationSteps: seed.simulationSteps,
        successConditions: seed.successConditions,
        failureConditions: seed.failureConditions,
        classificationLabel: SIMULATOR_CLASSIFICATION_LABEL,
      },
      create: {
        code: seed.code,
        name: seed.name,
        version: seed.version,
        description: seed.description,
        isOfficial: false,
        classificationLabel: SIMULATOR_CLASSIFICATION_LABEL,
        inputRequirements: seed.inputRequirements,
        validationRules: seed.validationRules,
        simulationSteps: seed.simulationSteps,
        successConditions: seed.successConditions,
        failureConditions: seed.failureConditions,
      },
    });
  }

  console.log("Seeding fictional demo transactions...");
  const demoTransactions = [
    {
      testTransactionId: "SIM-2026-000001",
      protocolCode: "101.1",
      cardNetwork: "VISA" as const,
      syntheticCardRef: "TEST-VISA-9447",
      cardType: "DEBIT" as const,
      syntheticIssuer: "Example Bank",
      currency: "USD",
      amount: 1000000.0,
      transactionType: "PURCHASE",
      referenceNumber: "SIM-REF-9937185",
      testAuthCode: "TEST-4821",
      testAccountStatus: "ACTIVE",
    },
    {
      testTransactionId: "SIM-2026-000002",
      protocolCode: "101.3",
      cardNetwork: "MASTERCARD" as const,
      syntheticCardRef: "TEST-MASTERCARD-2210",
      cardType: "CREDIT" as const,
      syntheticIssuer: "Fictional Trust Co.",
      currency: "EUR",
      amount: 249.99,
      transactionType: "PURCHASE",
      referenceNumber: "SIM-REF-1123344",
      testAuthCode: "TEST-1190",
      testAccountStatus: "ACTIVE",
    },
    {
      testTransactionId: "SIM-2026-000003",
      protocolCode: "101.6",
      cardNetwork: "VISA" as const,
      syntheticCardRef: "TEST-VISA-5581",
      cardType: "PREPAID" as const,
      syntheticIssuer: "Sandbox Financial Group",
      currency: "GBP",
      amount: 75.5,
      transactionType: "REFUND",
      referenceNumber: "SIM-REF-8871234",
      testAuthCode: "TEST-7734",
      testAccountStatus: "RESTRICTED",
    },
    {
      testTransactionId: "SIM-2026-000004",
      protocolCode: "201.3",
      cardNetwork: "MASTERCARD" as const,
      syntheticCardRef: "TEST-MASTERCARD-7788",
      cardType: "CREDIT" as const,
      syntheticIssuer: "Northgate Test Bank",
      currency: "USD",
      amount: 4820.0,
      transactionType: "AUTHORIZATION",
      referenceNumber: "SIM-REF-4455667",
      testAuthCode: "TEST-3305",
      testAccountStatus: "ACTIVE",
    },
  ];

  for (const tx of demoTransactions) {
    const protocol = await prisma.protocolDefinition.findUniqueOrThrow({ where: { code: tx.protocolCode } });

    const existing = await prisma.simulation.findUnique({ where: { testTransactionId: tx.testTransactionId } });
    if (existing) continue;

    const simulation = await prisma.simulation.create({
      data: {
        testTransactionId: tx.testTransactionId,
        protocolId: protocol.id,
        cardNetwork: tx.cardNetwork,
        syntheticCardRef: tx.syntheticCardRef,
        cardType: tx.cardType,
        syntheticIssuer: tx.syntheticIssuer,
        currency: tx.currency,
        amount: tx.amount,
        transactionType: tx.transactionType,
        referenceNumber: tx.referenceNumber,
        testAuthCode: tx.testAuthCode,
        testAccountStatus: tx.testAccountStatus,
        status: "PENDING",
        createdById: operator.id,
      },
    });

    const runResult = protocolEngine.run(
      {
        code: protocol.code,
        name: protocol.name,
        version: protocol.version,
        description: protocol.description,
        inputRequirements: protocol.inputRequirements as string[],
        validationRules: protocol.validationRules as string[],
        simulationSteps: protocol.simulationSteps as string[],
        successConditions: protocol.successConditions as string[],
        failureConditions: protocol.failureConditions as string[],
      },
      {
        testTransactionId: tx.testTransactionId,
        protocolCode: tx.protocolCode,
        cardNetwork: tx.cardNetwork,
        syntheticCardRef: tx.syntheticCardRef,
        cardType: tx.cardType,
        syntheticIssuer: tx.syntheticIssuer,
        currency: tx.currency,
        amount: tx.amount,
        transactionType: tx.transactionType,
        referenceNumber: tx.referenceNumber,
        testAuthCode: tx.testAuthCode,
        testAccountStatus: tx.testAccountStatus,
      }
    );

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

    await prisma.simulation.update({
      where: { id: simulation.id },
      data: {
        status: runResult.overallResult === "FAILED" ? "FAILED" : "VERIFIED",
        overallResult: runResult.overallResult,
        simulationRefId: runResult.simulationRefId,
        processingDurationMs: runResult.processingDurationMs,
      },
    });

    await prisma.auditLog.create({
      data: {
        simulationId: simulation.id,
        transactionRef: tx.testTransactionId,
        protocolCode: tx.protocolCode,
        eventType: "SIMULATION_COMPLETED",
        result: runResult.overallResult,
        systemVersion: "1.0.0",
        metadata: { seed: true, simulationRefId: runResult.simulationRefId },
        actorId: operator.id,
      },
    });
  }

  console.log("Seed complete.");
  console.log("Demo accounts (each account has a different password):");
  console.log(`  ADMIN    admin@jvfvertisgrid.online / ${passwords.admin}`);
  console.log(`  OPERATOR operator@jvfvertisgrid.online / ${passwords.operator}`);
  console.log(`  VIEWER   Viewer@jvfvertisgrid.online / ${passwords.viewer}`);
  console.log(`  PAYER    payer@jvfvertisgrid.online / ${passwords.payer} (VIEWER permissions)`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
