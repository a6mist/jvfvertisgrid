import { type Address, isAddress } from 'viem';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as Address;

const DEFAULT_IDO_CONTRACT_ADDRESS = '0x26a48B8945647bF862c6B630dD306BD8edea9F8D' as Address;
const DEFAULT_USDT_CONTRACT_ADDRESS = '0xdAC17F958D2ee523a2206206994597C13D831ec7' as Address;
const DEFAULT_TOKEN_CONTRACT_ADDRESS = '0xf326b4EaDDbc0e9D3B329074DC70A69ed843DaD1' as Address;

const getEnvAddress = (
  key: 'VITE_IDO_CONTRACT_ADDRESS' | 'VITE_USDT_CONTRACT_ADDRESS' | 'VITE_TOKEN_CONTRACT_ADDRESS',
): Address => {
  const value = import.meta.env[key];

  if (typeof value === 'string' && isAddress(value)) {
    return value as Address;
  }

  if (key === 'VITE_IDO_CONTRACT_ADDRESS') {
    return DEFAULT_IDO_CONTRACT_ADDRESS;
  }

  if (key === 'VITE_USDT_CONTRACT_ADDRESS') {
    return DEFAULT_USDT_CONTRACT_ADDRESS;
  }

  if (key === 'VITE_TOKEN_CONTRACT_ADDRESS') {
    return DEFAULT_TOKEN_CONTRACT_ADDRESS;
  }

  return ZERO_ADDRESS;
};

export const IDO_CONTRACT_ADDRESS = getEnvAddress('VITE_IDO_CONTRACT_ADDRESS');
export const USDT_CONTRACT_ADDRESS = getEnvAddress('VITE_USDT_CONTRACT_ADDRESS');
export const TOKEN_CONTRACT_ADDRESS = getEnvAddress('VITE_TOKEN_CONTRACT_ADDRESS');

export const isContractsConfigured =
  IDO_CONTRACT_ADDRESS !== ZERO_ADDRESS && USDT_CONTRACT_ADDRESS !== ZERO_ADDRESS;

export const isTokenConfigured = TOKEN_CONTRACT_ADDRESS !== ZERO_ADDRESS;
