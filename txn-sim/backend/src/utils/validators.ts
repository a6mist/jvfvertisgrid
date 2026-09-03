import { z } from "zod";
import { AppError } from "../middleware/errorHandler";

// Explicitly reject any field name that suggests real payment credentials,
// as a defense-in-depth check even though the schema below never defines them.
const FORBIDDEN_FIELD_NAMES = ["cvv", "cvc", "pin", "pan", "track1", "track2", "ssn"];

export function assertNoForbiddenFields(body: Record<string, unknown>) {
  const keys = Object.keys(body).map((k) => k.toLowerCase());
  const hit = keys.find((k) => FORBIDDEN_FIELD_NAMES.some((forbidden) => k.includes(forbidden)));
  if (hit) {
    throw new AppError(
      `Field "${hit}" is not permitted. This simulator never accepts real card credentials, CVV, PIN, track data, or SSNs.`,
      400
    );
  }
}

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters."),
  name: z.string().min(1),
  role: z.enum(["ADMIN", "OPERATOR", "VIEWER"]).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const errorScenarioEnum = z.enum([
  "INVALID_PROTOCOL",
  "INVALID_AMOUNT",
  "UNSUPPORTED_CURRENCY",
  "EXPIRED_TEST_REFERENCE",
  "INVALID_TRANSACTION_TYPE",
  "PROTOCOL_VALIDATION_FAILURE",
  "SIMULATED_NETWORK_TIMEOUT",
  "SIMULATED_PROCESSOR_UNAVAILABLE",
  "SIMULATED_AUTHORIZATION_FAILURE",
]);

export const createSimulationSchema = z.object({
  testTransactionId: z
    .string()
    .min(3)
    .regex(/^[A-Za-z0-9-]+$/, "Use letters, numbers, and hyphens only."),
  protocolCode: z.string().min(1),
  cardNetwork: z.enum(["VISA", "MASTERCARD"]),
  syntheticCardRef: z
    .string()
    .regex(/^TEST-(VISA|MASTERCARD)-\d{3,6}$/, "Use the format TEST-VISA-1234 or TEST-MASTERCARD-1234."),
  cardType: z.enum(["DEBIT", "CREDIT", "PREPAID"]),
  syntheticIssuer: z.string().min(1).max(80),
  currency: z.string().length(3),
  amount: z.number().positive().max(5_000_000),
  transactionType: z.string().min(1),
  referenceNumber: z.string().min(1).max(60),
  testAuthCode: z
    .string()
    .regex(/^TEST-\d{3,6}$/, "Use the format TEST-1234."),
  testAccountStatus: z.enum(["ACTIVE", "RESTRICTED", "CLOSED"]),
  errorScenario: errorScenarioEnum.optional(),
});

export const protocolDefinitionUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  version: z.string().min(1).optional(),
  inputRequirements: z.array(z.string()).optional(),
  validationRules: z.array(z.string()).optional(),
  simulationSteps: z.array(z.string()).optional(),
  successConditions: z.array(z.string()).optional(),
  failureConditions: z.array(z.string()).optional(),
  active: z.boolean().optional(),
});
