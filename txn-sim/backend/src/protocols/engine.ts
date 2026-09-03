/**
 * ProtocolEngine
 *
 * Deterministic, fully local simulation engine. It never contacts Visa,
 * Mastercard, a bank, or any payment processor. Every result is computed
 * from the synthetic input the operator supplied.
 */

import { ProtocolSeed } from "./definitions";

export type StepStatus = "SUCCESS" | "WARNING" | "FAILED" | "SKIPPED";

export interface SimulationInput {
  testTransactionId: string;
  protocolCode: string;
  cardNetwork: "VISA" | "MASTERCARD";
  syntheticCardRef: string;
  cardType: "DEBIT" | "CREDIT" | "PREPAID";
  syntheticIssuer: string;
  currency: string;
  amount: number;
  transactionType: string;
  referenceNumber: string;
  testAuthCode: string;
  testAccountStatus: string;
  /** Optional: intentionally force a specific error-path scenario for QA/training. */
  errorScenario?: ErrorScenario;
}

export type ErrorScenario =
  | "INVALID_PROTOCOL"
  | "INVALID_AMOUNT"
  | "UNSUPPORTED_CURRENCY"
  | "EXPIRED_TEST_REFERENCE"
  | "INVALID_TRANSACTION_TYPE"
  | "PROTOCOL_VALIDATION_FAILURE"
  | "SIMULATED_NETWORK_TIMEOUT"
  | "SIMULATED_PROCESSOR_UNAVAILABLE"
  | "SIMULATED_AUTHORIZATION_FAILURE";

export interface EngineStepResult {
  stepName: string;
  status: StepStatus;
  durationMs: number;
  result: string;
  diagnostic: Record<string, unknown>;
}

export interface EngineRunResult {
  overallResult: "SUCCESS" | "FAILED" | "WARNING";
  decision: "APPROVED" | "DENIED";
  decisionReason: string;
  simulationRefId: string;
  processingDurationMs: number;
  steps: EngineStepResult[];
}

const SUPPORTED_CURRENCIES = ["USD", "EUR", "GBP", "JPY", "AUD", "CAD", "PHP", "SGD"];
const SUPPORTED_TRANSACTION_TYPES = ["PURCHASE", "REFUND", "AUTHORIZATION", "REVERSAL", "PREAUTH"];
const MIN_AMOUNT = 0.01;
const MAX_AMOUNT = 5_000_000;

function refId(): string {
  const rand = Math.floor(Math.random() * 9_000_000) + 1_000_000;
  return `SIM-REF-${rand}`;
}

// Small, deterministic, seeded "duration" so re-runs of identical input are stable-ish
// for demo purposes while still feeling like real timing data.
function stepDuration(seed: string, base: number, spread: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return base + (hash % spread);
}

export class ProtocolEngine {
  run(protocol: ProtocolSeed, input: SimulationInput): EngineRunResult {
    const steps: EngineStepResult[] = [];
    const forcedFailureStep = this.forcedFailureStepFor(input.errorScenario);
    let hasFailed = false;
    let hasWarning = false;

    for (const stepName of protocol.simulationSteps) {
      const seedKey = `${input.testTransactionId}:${stepName}`;
      const durationMs = stepDuration(seedKey, 8, 40);

      if (hasFailed && stepName !== "SAVING_AUDIT_EVENT" && stepName !== "COMPLETED") {
        steps.push({
          stepName,
          status: "SKIPPED",
          durationMs: 0,
          result: "Skipped after upstream failure.",
          diagnostic: {},
        });
        continue;
      }

      const evaluated = this.evaluateStep(stepName, input, protocol, forcedFailureStep);
      steps.push({ ...evaluated, durationMs: evaluated.durationMs ?? durationMs });

      if (evaluated.status === "FAILED") hasFailed = true;
      if (evaluated.status === "WARNING") hasWarning = true;
    }

    const overallResult: "SUCCESS" | "FAILED" | "WARNING" = hasFailed
      ? "FAILED"
      : hasWarning
      ? "WARNING"
      : "SUCCESS";

    const processingDurationMs = steps.reduce((sum, s) => sum + s.durationMs, 0);
    const failedStep = steps.find((step) => step.status === "FAILED");

    return {
      overallResult,
      decision: hasFailed ? "DENIED" : "APPROVED",
      decisionReason: failedStep?.result ?? "All configured synthetic checks passed.",
      simulationRefId: refId(),
      processingDurationMs,
      steps,
    };
  }

  private forcedFailureStepFor(scenario?: ErrorScenario): string | null {
    switch (scenario) {
      case "INVALID_PROTOCOL":
        return "VALIDATING_PROTOCOL";
      case "INVALID_AMOUNT":
        return "CHECKING_AMOUNT";
      case "UNSUPPORTED_CURRENCY":
        return "CHECKING_CURRENCY";
      case "EXPIRED_TEST_REFERENCE":
        return "CHECKING_SYNTHETIC_CARD_REFERENCE";
      case "INVALID_TRANSACTION_TYPE":
        return "CHECKING_TRANSACTION_TYPE";
      case "PROTOCOL_VALIDATION_FAILURE":
        return "RUNNING_PROTOCOL_RULES";
      case "SIMULATED_NETWORK_TIMEOUT":
        return "GENERATING_SIMULATED_RESULT";
      case "SIMULATED_PROCESSOR_UNAVAILABLE":
        return "RUNNING_PROTOCOL_RULES";
      case "SIMULATED_AUTHORIZATION_FAILURE":
        return "RUNNING_PROTOCOL_RULES";
      default:
        return null;
    }
  }

  private evaluateStep(
    stepName: string,
    input: SimulationInput,
    protocol: ProtocolSeed,
    forcedFailureStep: string | null
  ): Omit<EngineStepResult, "durationMs"> & { durationMs?: number } {
    const forced = forcedFailureStep === stepName;

    switch (stepName) {
      case "INITIALIZING":
        return {
          stepName,
          status: "SUCCESS",
          result: `Simulation initialized for protocol ${protocol.code}.`,
          diagnostic: { protocol: protocol.code, network: input.cardNetwork },
        };

      case "VALIDATING_TEST_INPUT": {
        const missing = protocol.inputRequirements.filter(
          (field) => (input as unknown as Record<string, unknown>)[field] === undefined || (input as unknown as Record<string, unknown>)[field] === ""
        );
        if (missing.length > 0) {
          return {
            stepName,
            status: "FAILED",
            result: `Missing required test input: ${missing.join(", ")}.`,
            diagnostic: { missingFields: missing },
          };
        }
        return {
          stepName,
          status: "SUCCESS",
          result: "All required synthetic input fields present.",
          diagnostic: { requiredFields: protocol.inputRequirements },
        };
      }

      case "VALIDATING_PROTOCOL":
        if (forced) {
          return {
            stepName,
            status: "FAILED",
            result: `Protocol ${input.protocolCode} failed simulator validation (forced test scenario).`,
            diagnostic: { protocolCode: input.protocolCode, scenario: "INVALID_PROTOCOL" },
          };
        }
        return {
          stepName,
          status: "SUCCESS",
          result: `Protocol ${protocol.code} (${protocol.name}) recognized.`,
          diagnostic: { classification: "Custom simulation protocol" },
        };

      case "CHECKING_SYNTHETIC_CARD_REFERENCE": {
        if (forced) {
          return {
            stepName,
            status: "FAILED",
            result: "Synthetic card reference has expired in the test dataset (forced test scenario).",
            diagnostic: { syntheticCardRef: input.syntheticCardRef },
          };
        }
        const pattern = /^TEST-(VISA|MASTERCARD)-\d{3,6}$/;
        const match = pattern.test(input.syntheticCardRef);
        const networkPrefixOk = input.syntheticCardRef.toUpperCase().includes(input.cardNetwork);
        if (!match || !networkPrefixOk) {
          return {
            stepName,
            status: "FAILED",
            result: "Synthetic card reference format invalid or network mismatch.",
            diagnostic: { syntheticCardRef: input.syntheticCardRef, expectedNetwork: input.cardNetwork },
          };
        }
        return {
          stepName,
          status: "SUCCESS",
          result: "Synthetic card reference format and network prefix verified.",
          diagnostic: { syntheticCardRefMasked: this.maskRef(input.syntheticCardRef) },
        };
      }

      case "CHECKING_CURRENCY": {
        if (forced || !SUPPORTED_CURRENCIES.includes(input.currency.toUpperCase())) {
          return {
            stepName,
            status: "FAILED",
            result: `Currency ${input.currency} is not on the configured supported list.`,
            diagnostic: { currency: input.currency, supported: SUPPORTED_CURRENCIES },
          };
        }
        return {
          stepName,
          status: "SUCCESS",
          result: `Currency ${input.currency} is supported.`,
          diagnostic: { currency: input.currency },
        };
      }

      case "CHECKING_AMOUNT": {
        if (forced || input.amount < MIN_AMOUNT || input.amount > MAX_AMOUNT || Number.isNaN(input.amount)) {
          return {
            stepName,
            status: "FAILED",
            result: `Amount ${input.amount} is outside the configured simulation bounds (${MIN_AMOUNT}–${MAX_AMOUNT}).`,
            diagnostic: { amount: input.amount, min: MIN_AMOUNT, max: MAX_AMOUNT },
          };
        }
        return {
          stepName,
          status: "SUCCESS",
          result: "Amount within configured bounds.",
          diagnostic: { amount: input.amount },
        };
      }

      case "CHECKING_TRANSACTION_TYPE": {
        const type = input.transactionType.toUpperCase();
        if (forced || !SUPPORTED_TRANSACTION_TYPES.includes(type)) {
          return {
            stepName,
            status: "FAILED",
            result: `Transaction type ${input.transactionType} is not supported.`,
            diagnostic: { transactionType: input.transactionType, supported: SUPPORTED_TRANSACTION_TYPES },
          };
        }
        if (input.cardType === "PREPAID" && type === "AUTHORIZATION") {
          return {
            stepName,
            status: "WARNING",
            result: "PREPAID cards typically do not support AUTHORIZATION-only flows in this simulator; proceeding with a warning.",
            diagnostic: { cardType: input.cardType, transactionType: type },
          };
        }
        return {
          stepName,
          status: "SUCCESS",
          result: "Transaction type supported and consistent with card type.",
          diagnostic: { transactionType: type, cardType: input.cardType },
        };
      }

      case "RUNNING_PROTOCOL_RULES": {
        if (forced) {
          const scenario =
            forcedFailureStep === "RUNNING_PROTOCOL_RULES"
              ? "Protocol rules produced a simulated failure (forced test scenario)."
              : "Protocol rules failed.";
          return {
            stepName,
            status: "FAILED",
            result: scenario,
            diagnostic: { protocol: protocol.code, rules: protocol.validationRules },
          };
        }
        if (input.testAccountStatus.toUpperCase() === "RESTRICTED" || input.testAccountStatus.toUpperCase() === "CLOSED") {
          return {
            stepName,
            status: "FAILED",
            result: `Synthetic account status "${input.testAccountStatus}" causes a simulated decline under protocol ${protocol.code}.`,
            diagnostic: { testAccountStatus: input.testAccountStatus },
          };
        }
        return {
          stepName,
          status: "SUCCESS",
          result: `All protocol ${protocol.code} rules passed.`,
          diagnostic: { rulesApplied: protocol.validationRules.length },
        };
      }

      case "GENERATING_SIMULATED_RESULT":
        if (forced) {
          return {
            stepName,
            status: "FAILED",
            result: "Simulated network timeout while generating the result (forced test scenario).",
            diagnostic: { scenario: "SIMULATED_NETWORK_TIMEOUT" },
          };
        }
        return {
          stepName,
          status: "SUCCESS",
          result: "Simulated result generated locally — no external network call was made.",
          diagnostic: {},
        };

      case "SAVING_AUDIT_EVENT":
        return {
          stepName,
          status: "SUCCESS",
          result: "Audit event recorded.",
          diagnostic: {},
        };

      case "COMPLETED":
        return {
          stepName,
          status: "SUCCESS",
          result: "Simulation run completed.",
          diagnostic: {},
        };

      default:
        return {
          stepName,
          status: "SKIPPED",
          result: "Unrecognized step.",
          diagnostic: {},
        };
    }
  }

  private maskRef(ref: string): string {
    if (ref.length <= 4) return "****";
    return `${ref.slice(0, 4)}${"*".repeat(Math.max(ref.length - 8, 0))}${ref.slice(-4)}`;
  }
}

export const protocolEngine = new ProtocolEngine();
