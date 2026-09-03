# Transaction Verification & Protocol Simulator

A production-quality **simulation console** for exercising synthetic Visa/Mastercard-style
transaction verification workflows. Every part of this project is designed to make it
structurally impossible to handle real payment data:

> **SIMULATION / TEST ENVIRONMENT — NOT CONNECTED TO VISA, MASTERCARD, BANKING NETWORKS, OR
> PAYMENT NETWORKS.**

- No real card numbers (PANs), CVV/CVC, PINs, track data, or bank credentials are ever
  accepted, stored, or logged. The API rejects any request body containing a field that
  looks like one of these (`assertNoForbiddenFields`).
- All seven simulated protocols (`101.1`–`101.6`, `201.3`) are explicitly labeled
  **"Custom simulation protocol — not an official Visa/Mastercard specification."** They are
  not derived from, and do not claim to be, real payment-network standards.
- The verification engine (`ProtocolEngine`) is 100% local and deterministic — it never makes
  an outbound network call, and every "result" is computed from the synthetic input you typed
  in, not from a real bank or card network.
- Every results page and audit record repeats the simulation disclaimer so the output can
  never be mistaken for a genuine authorization or bank confirmation.

## Architecture

```
txn-sim/
├── backend/     Node.js + TypeScript + Express + Prisma (PostgreSQL) REST API
├── frontend/    React + TypeScript + Vite + Tailwind CSS console UI
└── docker-compose.yml   Local Postgres for development
```

### Backend service layout

```
backend/src/
├── config/env.ts            Environment loading
├── lib/{prisma,jwt}.ts      Prisma client + JWT helpers
├── middleware/               Auth (JWT + RBAC), centralized error handling
├── protocols/
│   ├── definitions.ts        Seed data for the 7 simulator protocols + their non-official label
│   └── engine.ts              ProtocolEngine — deterministic, local-only simulation logic
├── services/
│   ├── protocolRepository.ts  Data access for protocol definitions
│   ├── simulationService.ts   Creates synthetic transaction records
│   ├── verificationService.ts Runs the engine, persists steps, updates the simulation
│   ├── transactionService.ts  Search/filter/dashboard queries
│   └── auditService.ts        Immutable-style audit log writes/reads
├── routes/                    REST endpoints (auth, simulations, protocols, audit-logs, dashboard)
└── utils/validators.ts        Zod schemas + forbidden-field guard
```

### Database schema (Prisma)

- `User` — email/password (bcrypt) + role (`ADMIN` / `OPERATOR` / `VIEWER`)
- `ProtocolDefinition` — configurable protocol metadata, always carrying a classification label
- `Simulation` — one synthetic transaction + its verification outcome
- `SimulationStep` — the persisted step-by-step engine trace for a simulation
- `AuditLog` — append-style audit trail, never containing authentication secrets
- `SystemSetting` — reserved for future admin-configurable global settings

### API

| Method | Path                          | Notes                                   |
|--------|-------------------------------|------------------------------------------|
| POST   | `/api/auth/register`          | Create an account (ADMIN/OPERATOR/VIEWER) |
| POST   | `/api/auth/login`              | Returns a JWT                            |
| POST   | `/api/simulations`              | Create a synthetic transaction (ADMIN/OPERATOR) |
| GET    | `/api/simulations`              | Search/filter/paginate                   |
| GET    | `/api/simulations/:id`          | Full detail incl. steps + audit          |
| POST   | `/api/simulations/:id/verify`   | Run the protocol engine (ADMIN/OPERATOR) |
| GET    | `/api/protocols`                | List protocol definitions                |
| GET    | `/api/protocols/:code`          | Detail for one protocol                  |
| PATCH  | `/api/protocols/:code`          | Admin-only: edit a protocol definition   |
| GET    | `/api/audit-logs`               | Filterable audit trail                   |
| GET    | `/api/dashboard/summary`        | Aggregate counts + distributions         |

All input is validated server-side with Zod. Role-based access control gates
simulation-creation and protocol-editing endpoints.

## Getting started

## Cloud deployment

The backend is ready to deploy as a Node service with PostgreSQL. A Render
Blueprint is provided in `render.yaml`; create a new Blueprint from this repository
and choose `txn-sim/render.yaml`. Set `DATABASE_URL` to the connection string from
your Supabase project. Render will run Prisma migrations during startup and expose
`/api/health` as the health check.

Set `CORS_ORIGIN` to the exact HTTPS origin of the deployed frontend. After the
first deployment, run the seed command once against the production database only
if demo data is wanted:

```bash
npm run prisma:seed -w backend
```

For other container hosts, use `backend/Dockerfile`; it runs migrations before
starting the API. Set `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `NODE_ENV`,
and `CORS_ORIGIN` as service environment variables. Never commit those values.

### 1. Prerequisites

- Node.js 20+
- Docker (for the bundled Postgres) — or point `DATABASE_URL` at your own Postgres instance

### 2. Install dependencies

```bash
npm install
```

This installs the root, `backend`, and `frontend` workspaces together.

### 3. Start Postgres

```bash
docker compose up -d
```

### 4. Configure environment variables

```bash
cp backend/.env.example backend/.env
# edit backend/.env if you're not using the bundled docker-compose Postgres
```

### 5. Set up the database

```bash
npm run prisma:migrate   # creates tables
npm run prisma:seed      # loads fictional demo users, protocols, and transactions
```

### 6. Run the app

```bash
npm run dev
```

This starts the API on `http://localhost:4000` and the console UI on
`http://localhost:5173` (which proxies `/api` to the backend).

### Demo accounts (all fictional, password `Password123!`)

| Role     | Email                     |
|----------|---------------------------|
| ADMIN    | admin@jvfvertisgrid.online      |
| OPERATOR | operator@jvfvertisgrid.online   |
| VIEWER   | Viewer@jvfvertisgrid.online     |

### 7. Run tests

```bash
npm test
```

Covers the protocol engine's deterministic behavior across success paths, forced
error scenarios, and a check that no output ever contains a sensitive field name.

## Security notes

- Passwords are hashed with bcrypt (cost factor 12); sessions are JWTs with a configurable
  expiry.
- `helmet`, CORS allow-listing, and `express-rate-limit` are applied to every API route.
- Prisma's parameterized queries prevent SQL injection; all API responses are JSON so there is
  no server-rendered HTML injection surface.
- The `assertNoForbiddenFields` guard is defense-in-depth on top of the fact that the schema
  itself never defines a CVV/PIN/PAN/track-data/SSN field anywhere in the stack.
- If real payment processing is ever added to a project like this, it should go through a
  PCI-compliant, properly licensed payment processor or tokenization provider — this codebase
  intentionally never touches raw card data and should not be extended to do so directly.

## Extending protocol definitions

Protocol behavior (name, description, validation rules, success/failure conditions) is
configurable from **Settings** by an ADMIN user, or directly via
`PATCH /api/protocols/:code`. The underlying step *sequence* (`INITIALIZING` →
... → `COMPLETED`) is defined by the engine; editable fields are documentation
and rule metadata, not arbitrary code execution.
