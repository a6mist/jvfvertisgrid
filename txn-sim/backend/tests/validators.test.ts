import { describe, expect, it } from "vitest";
import { assertNoForbiddenFields, createSimulationSchema } from "../src/utils/validators";

describe("assertNoForbiddenFields", () => {
  it("throws when a body contains a cvv-like field", () => {
    expect(() => assertNoForbiddenFields({ amount: 10, cvv: "123" })).toThrow();
  });

  it("throws when a body contains a pan field", () => {
    expect(() => assertNoForbiddenFields({ pan: "4111111111111111" })).toThrow();
  });

  it("passes for a clean synthetic payload", () => {
    expect(() => assertNoForbiddenFields({ syntheticCardRef: "TEST-VISA-1234", amount: 10 })).not.toThrow();
  });
});

describe("createSimulationSchema", () => {
  const valid = {
    testTransactionId: "SIM-2026-000099",
    protocolCode: "101.1",
    cardNetwork: "VISA",
    syntheticCardRef: "TEST-VISA-1234",
    cardType: "DEBIT",
    syntheticIssuer: "Example Bank",
    currency: "USD",
    amount: 100,
    transactionType: "PURCHASE",
    referenceNumber: "SIM-REF-0000099",
    testAuthCode: "TEST-1234",
    testAccountStatus: "ACTIVE",
  };

  it("accepts a well-formed synthetic transaction", () => {
    expect(() => createSimulationSchema.parse(valid)).not.toThrow();
  });

  it("rejects a card reference that looks like a real PAN", () => {
    expect(() => createSimulationSchema.parse({ ...valid, syntheticCardRef: "4111111111111111" })).toThrow();
  });

  it("rejects a negative amount", () => {
    expect(() => createSimulationSchema.parse({ ...valid, amount: -5 })).toThrow();
  });
});
