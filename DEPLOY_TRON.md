# TRON Deployment Guide

## 1. Prepare env

Copy `.env.tron.example` to `.env.tron` and fill all values.

## 2. Compile contracts

```bash
npm run compile:tron
```

Artifacts are generated in `artifacts/tron`.

## 3. Deploy to TRON mainnet

```bash
npm run deploy:tron
```

The deploy script will:
- Deploy `IEFO` token
- Deploy `IEFO_IDO`
- Transfer token allocation to IDO
- Save a deployment JSON file in `deployments/`
- Print frontend env values

## 4. Website env values

Set these values in your frontend environment:

```env
VITE_NETWORK_MODE=TRON
VITE_TOKEN_CONTRACT_ADDRESS=<printed token address>
VITE_IDO_CONTRACT_ADDRESS=<printed ido address>
VITE_USDT_CONTRACT_ADDRESS=<your tron usdt address>
```

## 5. Final pre-live checks

- Confirm token balance in IDO contract is funded
- Create 1 test invoice and pay once
- Test buy, claim, and portfolio activity
- Confirm admin wallet can create invoice and controls still work
