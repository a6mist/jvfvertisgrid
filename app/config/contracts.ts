import { type Address, isAddress } from 'viem';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as Address;

const getEnvAddress = (key: 'VITE_IDO_CONTRACT_ADDRESS' | 'VITE_USDT_CONTRACT_ADDRESS'): Address => {
  const value = import.meta.env[key];
  if (typeof value === 'string' && isAddress(value)) {
    return value as Address;
  }
  return ZERO_ADDRESS;
};

export const IDO_CONTRACT_ADDRESS = getEnvAddress('VITE_IDO_CONTRACT_ADDRESS');
export const USDT_CONTRACT_ADDRESS = getEnvAddress('VITE_USDT_CONTRACT_ADDRESS');

export const isContractsConfigured =
  IDO_CONTRACT_ADDRESS !== ZERO_ADDRESS && USDT_CONTRACT_ADDRESS !== ZERO_ADDRESS;
