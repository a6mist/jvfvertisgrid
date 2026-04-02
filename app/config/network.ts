const rawMode = String(import.meta.env.VITE_NETWORK_MODE || 'EVM').trim().toUpperCase();

export const isTronMode = rawMode === 'TRON' || rawMode === 'TRC' || rawMode === 'TRC20';

export const NETWORK_DISPLAY_NAME = isTronMode ? 'TRON Mainnet' : 'Ethereum Mainnet';
export const NETWORK_SHORT_NAME = isTronMode ? 'TRON / TRC20' : 'EVM';
export const GAS_SYMBOL = isTronMode ? 'TRX' : 'ETH';
