/**
 * Protocol definitions for the Transaction Verification & Protocol Simulator.
 *
 * IMPORTANT: None of the protocols below (101.1–101.6, 201.3) are official
 * Visa or Mastercard specifications. They are simulator-defined workflow
 * templates used to exercise the verification engine for testing, QA, and
 * training purposes. Every definition carries an explicit classification
 * label that is surfaced in the UI and API responses.
 */

export const SIMULATOR_CLASSIFICATION_LABEL =
  "Custom simulation protocol — not an official Visa/Mastercard specification.";

export interface ProtocolSeed {
  code: string;
  name: string;
  version: string;
  description: string;
  inputRequirements: string[];
  validationRules: string[];
  simulationSteps: string[];
  successConditions: string[];
  failureConditions: string[];
}

const BASE_STEPS = [
  "INITIALIZING",
  "VALIDATING_TEST_INPUT",
  "VALIDATING_PROTOCOL",
  "CHECKING_CARD_REFERENCE",
  "CHECKING_CURRENCY",
  "CHECKING_AMOUNT",
  "CHECKING_TRANSACTION_TYPE",
  "RUNNING_PROTOCOL_RULES",
  "GENERATING_RESULT",
  "SAVING_AUDIT_EVENT",
  "COMPLETED",
];

export const PROTOCOL_SEEDS: ProtocolSeed[] = [
  {
    code: "101.1",
    name: "Basic Field Validation",
    version: "1.0.0",
    description:
      "Simulator-defined baseline workflow that checks a synthetic transaction has all required fields populated in a structurally valid form before deeper checks run.",
    inputRequirements: ["testTransactionId", "syntheticCardRef", "currency", "amount", "transactionType"],
    validationRules: [
      "All required fields must be present",
      "Amount must be a positive decimal",
      "Currency must be a supported 3-letter code",
    ],
    simulationSteps: BASE_STEPS,
    successConditions: ["All required fields present and well-formed"],
    failureConditions: ["One or more required fields missing or malformed"],
  },
  {
    code: "101.2",
    name: "Synthetic Card Reference Format Check",
    version: "1.0.0",
    description:
      "Simulator-defined workflow that verifies the synthetic card reference follows the TEST-<NETWORK>-#### pattern and matches the declared card network, without handling any real card data.",
    inputRequirements: ["syntheticCardRef", "cardNetwork"],
    validationRules: [
      "syntheticCardRef must match pattern TEST-<NETWORK>-####",
      "Declared network prefix must match the selected cardNetwork",
    ],
    simulationSteps: BASE_STEPS,
    successConditions: ["Synthetic card reference format and network prefix match"],
    failureConditions: ["Reference format invalid or network mismatch"],
  },
  {
    code: "101.3",
    name: "Currency & Amount Bounds Check",
    version: "1.0.0",
    description:
      "Simulator-defined workflow that checks the transaction currency is on the supported list and the amount falls within configured simulation bounds.",
    inputRequirements: ["currency", "amount"],
    validationRules: [
      "Currency must be in the configured supported currency list",
      "Amount must be between the configured minimum and maximum simulation bounds",
    ],
    simulationSteps: BASE_STEPS,
    successConditions: ["Currency supported and amount within bounds"],
    failureConditions: ["Unsupported currency or amount outside configured bounds"],
  },
  {
    code: "101.4",
    name: "Transaction Type Consistency Check",
    version: "1.0.0",
    description:
      "Simulator-defined workflow verifying the declared transaction type is one of the configured supported types and is consistent with the declared card type.",
    inputRequirements: ["transactionType", "cardType"],
    validationRules: [
      "transactionType must be a configured supported type",
      "transactionType must be consistent with cardType (e.g. PREPAID cannot run a CREDIT-only type)",
    ],
    simulationSteps: BASE_STEPS,
    successConditions: ["Transaction type valid and consistent with card type"],
    failureConditions: ["Unsupported or inconsistent transaction type"],
  },
  {
    code: "101.5",
    name: "Test Authorization Code Shape Check",
    version: "1.0.0",
    description:
      "Simulator-defined workflow that checks a synthetic test authorization code was supplied in the expected shape. This never checks a real authorization network — it only validates the shape of a synthetic test value.",
    inputRequirements: ["testAuthCode"],
    validationRules: ["testAuthCode must match pattern TEST-####", "testAuthCode must not be empty"],
    simulationSteps: BASE_STEPS,
    successConditions: ["Synthetic authorization code present and correctly shaped"],
    failureConditions: ["Synthetic authorization code missing or malformed"],
  },
  {
    code: "101.6",
    name: "Synthetic Account Status Check",
    version: "1.0.0",
    description:
      "Simulator-defined workflow that reads the operator-declared synthetic account status (e.g. ACTIVE, CLOSED, RESTRICTED) and applies simulator rules — this does not query any real account or bank system.",
    inputRequirements: ["testAccountStatus"],
    validationRules: [
      "testAccountStatus must be one of the configured statuses",
      "RESTRICTED or CLOSED statuses produce a simulated failure result",
    ],
    simulationSteps: BASE_STEPS,
    successConditions: ["Synthetic account status is ACTIVE"],
    failureConditions: ["Synthetic account status is RESTRICTED or CLOSED"],
  },
  {
    code: "201.3",
    name: "Composite Verification Workflow",
    version: "1.0.0",
    description:
      "Simulator-defined composite workflow that chains the 101.x checks together into a single end-to-end simulated verification run, mirroring a full console verification pass. Entirely local and synthetic — no external network calls are made.",
    inputRequirements: [
      "testTransactionId",
      "syntheticCardRef",
      "cardNetwork",
      "cardType",
      "currency",
      "amount",
      "transactionType",
      "testAuthCode",
      "testAccountStatus",
    ],
    validationRules: [
      "All 101.x checks must pass",
      "Simulated authorization result is derived deterministically from input, not randomly",
    ],
    simulationSteps: BASE_STEPS,
    successConditions: ["All composite checks pass"],
    failureConditions: ["Any composite check fails"],
  },
];
