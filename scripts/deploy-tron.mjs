import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { TronWeb } from 'tronweb';
import { compileContracts } from './compile-tron.mjs';

dotenv.config();
dotenv.config({ path: '.env.tron' });

const required = ['TRON_PRIVATE_KEY', 'TRON_USDT_ADDRESS'];
for (const key of required) {
  if (!process.env[key] || String(process.env[key]).trim() === '') {
    console.error(`Missing required env: ${key}`);
    process.exit(1);
  }
}

const fullHost = process.env.TRON_FULL_HOST || 'https://api.trongrid.io';
const privateKey = process.env.TRON_PRIVATE_KEY;
const usdtAddress = process.env.TRON_USDT_ADDRESS;
const ownerAddress = process.env.TRON_OWNER_ADDRESS || null;
const existingTokenAddressRaw = (process.env.TRON_EXISTING_TOKEN_ADDRESS || '').trim();
const tronApiKey = process.env.TRON_API_KEY || '';

const now = Math.floor(Date.now() / 1000);
const saleStart = Number(process.env.IDO_START_TIME || now + 300);
const saleEnd = Number(process.env.IDO_END_TIME || now + 30 * 24 * 60 * 60);
if (!Number.isFinite(saleStart) || !Number.isFinite(saleEnd) || saleEnd <= saleStart) {
  console.error('Invalid IDO_START_TIME / IDO_END_TIME values.');
  process.exit(1);
}

const saleAllocationTokensRaw = String(process.env.IDO_TOKEN_ALLOCATION || '300000000').trim();
if (!/^[0-9]+(\.[0-9]+)?$/.test(saleAllocationTokensRaw)) {
  console.error('IDO_TOKEN_ALLOCATION must be a numeric string.');
  process.exit(1);
}

const parseTokenUnits = (amount, decimals) => {
  const [whole, fraction = ''] = amount.split('.');
  const normalizedFraction = (fraction + '0'.repeat(decimals)).slice(0, decimals);
  return BigInt(whole || '0') * 10n ** BigInt(decimals) + BigInt(normalizedFraction || '0');
};

const feeLimit = Number(process.env.TRON_FEE_LIMIT || 1_500_000_000);

const tronWeb = new TronWeb({
  fullHost,
  privateKey,
  headers: tronApiKey ? { 'TRON-PRO-API-KEY': tronApiKey } : undefined,
});

const normalizeTronAddress = (value) => {
  const input = String(value || '').trim();
  if (!input) return '';
  // Accept both Base58 and 41-prefixed hex addresses from env.
  if (/^41[0-9a-fA-F]{40}$/.test(input)) {
    return tronWeb.address.fromHex(input);
  }
  return input;
};

const extractDeployTxId = (contractInstance) => {
  const txId =
    contractInstance?.transaction?.txID ||
    contractInstance?.transaction?.txid ||
    contractInstance?.txID ||
    contractInstance?.txid ||
    '';
  return String(txId || '');
};

const deploy = async () => {
  const compiled = compileContracts();

  const deployer = ownerAddress || tronWeb.address.fromPrivateKey(privateKey);
  const existingTokenAddress = normalizeTronAddress(existingTokenAddressRaw);
  const reuseToken = existingTokenAddress.length > 0;

  console.log(`Deployer: ${deployer}`);
  console.log(`Network: ${fullHost}`);
  if (reuseToken) {
    console.log(`Reusing token: ${existingTokenAddress}`);
  }

  let token;
  let tokenAddress;
  let tokenDeployTx = '';

  if (reuseToken) {
    tokenAddress = existingTokenAddress;
    token = await tronWeb.contract(compiled.IEFO.abi, tokenAddress);
  } else {
    token = await tronWeb.contract(compiled.IEFO.abi).new({
      abi: compiled.IEFO.abi,
      bytecode: compiled.IEFO.bytecode,
      feeLimit,
      callValue: 0,
      parameters: [deployer],
    });

    tokenAddress = normalizeTronAddress(token.address);
    tokenDeployTx = extractDeployTxId(token);
    console.log(`Token deployed: ${tokenAddress}`);
    if (tokenDeployTx) {
      console.log(`Token deploy tx: ${tokenDeployTx}`);
    }
  }

  const ido = await tronWeb.contract(compiled.IEFO_IDO.abi).new({
    abi: compiled.IEFO_IDO.abi,
    bytecode: compiled.IEFO_IDO.bytecode,
    feeLimit,
    callValue: 0,
    parameters: [usdtAddress, tokenAddress, saleStart, saleEnd],
  });

  const idoAddress = normalizeTronAddress(ido.address);
  const idoDeployTx = extractDeployTxId(ido);
  console.log(`IDO deployed: ${idoAddress}`);
  if (idoDeployTx) {
    console.log(`IDO deploy tx: ${idoDeployTx}`);
  }

  const allocation = parseTokenUnits(saleAllocationTokensRaw, 18);
  const transferTx = await token.transfer(idoAddress, allocation.toString()).send({ feeLimit });
  console.log(`Allocated tokens to IDO tx: ${transferTx}`);

  const verifyBalance = await token.balanceOf(idoAddress).call();
  console.log(`IDO token inventory: ${verifyBalance.toString()}`);

  const deployment = {
    network: fullHost,
    deployedAt: new Date().toISOString(),
    deployer,
    addresses: {
      token: tokenAddress,
      ido: idoAddress,
      usdt: usdtAddress,
    },
    settings: {
      saleStart,
      saleEnd,
      saleAllocationTokens: saleAllocationTokensRaw,
      feeLimit,
      reusedToken: reuseToken,
    },
    tx: {
      tokenDeployment: tokenDeployTx || null,
      idoDeployment: idoDeployTx || null,
      tokenAllocation: String(transferTx),
    },
  };

  const outDir = path.join(process.cwd(), 'deployments');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `tron-${Date.now()}.json`);
  fs.writeFileSync(outPath, JSON.stringify(deployment, null, 2));

  console.log('\nUse these values in website env:');
  console.log('VITE_NETWORK_MODE=TRON');
  console.log(`VITE_TOKEN_CONTRACT_ADDRESS=${tokenAddress}`);
  console.log(`VITE_IDO_CONTRACT_ADDRESS=${idoAddress}`);
  console.log(`VITE_USDT_CONTRACT_ADDRESS=${usdtAddress}`);
  console.log(`\nDeployment file: ${outPath}`);
};

deploy().catch((error) => {
  console.error('Deployment failed:', error);
  process.exit(1);
});
