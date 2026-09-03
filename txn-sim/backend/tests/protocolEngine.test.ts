import { describe, expect, it } from "vitest";
import { protocolEngine, SimulationInput } from "../src/protocols/engine";
import { PROTOCOL_SEEDS } from "../src/protocols/definitions";

function baseInput(overrides: Partial<SimulationInput> = {}): SimulationInput {
  return {
    testTransactionId: "SIM-TEST-000001",
    protocolCode: "101.1",
    cardNetwork: "VISA",
    syntheticCardRef: "TEST-VISA-1234",
    cardType: "DEBIT",
    syntheticIssuer: "Example Bank",
    currency: "USD",
    amount: 100,
    transactionType: "PURCHASE",
    referenceNumber: "SIM-REF-0000001",
    testAuthCode: "TEST-1234",
    testAccountStatus: "ACTIVE",
    ...overrides,
  };
}

describe("ProtocolEngine", () => {
  it("returns SUCCESS for a well-formed input under protocol 101.1", () => {
    const protocol = PROTOCOL_SEEDS.find((p) => p.code === "101.1")!;
    const result = protocolEngine.run(protocol, baseInput());
    expect(result.overallResult).toBe("SUCCESS");
    expect(result.steps.at(-1)?.stepName).toBe("COMPLETED");
    expect(result.simulationRefId).toMatch(/^SIM-REF-\d+$/);
  });

  it("fails when the synthetic card reference does not match the declared network", () => {
    const protocol = PROTOCOL_SEEDS.find((p) => p.code === "101.2")!;
    const result = protocolEngine.run(
      protocol,
      baseInput({ cardNetwork: "MASTERCARD", syntheticCardRef: "TEST-VISA-1234" })
    );
    expect(result.overallResult).toBe("FAILED");
    const cardStep = result.steps.find((s) => s.stepName === "CHECKING_SYNTHETIC_CARD_REFERENCE");
    expect(cardStep?.status).toBe("FAILED");
  });

  it("fails for an unsupported currency under protocol 101.3", () => {
    const protocol = PROTOCOL_SEEDS.find((p) => p.code === "101.3")!;
    const result = protocolEngine.run(protocol, baseInput({ currency: "ZZZ" }));
    expect(result.overallResult).toBe("FAILED");
  });

  it("fails and skips downstream steps for a RESTRICTED synthetic account status", () => {
    const protocol = PROTOCOL_SEEDS.find((p) => p.code === "101.6")!;
    const result = protocolEngine.run(protocol, baseInput({ testAccountStatus: "RESTRICTED" }));
    expect(result.overallResult).toBe("FAILED");
    const skipped = result.steps.filter((s) => s.status === "SKIPPED");
    expect(skipped.length).toBeGreaterThan(0);
  });

  it("honors a forced error scenario deterministically", () => {
    const protocol = PROTOCOL_SEEDS.find((p) => p.code === "101.1")!;
    const result = protocolEngine.run(protocol, baseInput({ errorScenario: "INVALID_AMOUNT" }));
    expect(result.overallResult).toBe("FAILED");
    const amountStep = result.steps.find((s) => s.stepName === "CHECKING_AMOUNT");
    expect(amountStep?.status).toBe("FAILED");
  });

  it("never produces a step diagnostic containing forbidden sensitive field names", () => {
    const protocol = PROTOCOL_SEEDS.find((p) => p.code === "201.3")!;
    const result = protocolEngine.run(protocol, baseInput());
    const serialized = JSON.stringify(result).toLowerCase();
    for (const forbidden of ["cvv", "cvc", "pin", "track1", "track2", "ssn"]) {
      expect(serialized).not.toContain(forbidden);
    }
  });
});
