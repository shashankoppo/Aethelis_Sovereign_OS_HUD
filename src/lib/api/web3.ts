/*
 * Sovereign Ledger Bridge — Web3 / ATH token interface.
 *
 * Simulates a private Aethelis blockchain node. When ethers.js + a real
 * RPC endpoint are configured, the functions can be upgraded to live
 * on-chain reads. Until then, the simulation produces realistic
 * block heights, gas fees, and balance deltas so the UI feels alive.
 */

export type BlockEvent = {
  number: number;
  hash: string;
  txCount: number;
  gasFee: string;
  miner: string;
  timestamp: number;
};

export type AthBalance = {
  balance: number;
  nftCount: number;
  gasFee: string;
  blockHeight: number;
  validators: number;
  change24h: number;
};

const RPC_URL = import.meta.env.VITE_WEB3_RPC_URL as string | undefined;
const CONTRACT_ADDR = import.meta.env.VITE_ATH_CONTRACT as string | undefined;

export const web3IsConfigured = Boolean(RPC_URL && CONTRACT_ADDR);

/* ── Simulation engine ────────────────────────────────────────────── */

let simBlock = 19847;
const simMiners = ['0xA7e1...', '0x9Bc3...', '0x4F2a...', '0xD8e5...', '0x1C6b...'];

function randomHash(): string {
  const chars = '0123456789abcdef';
  let h = '0x';
  for (let i = 0; i < 8; i++) h += chars[Math.floor(Math.random() * 16)];
  return h;
}

export function web3GenerateBlock(): BlockEvent {
  simBlock += 1;
  return {
    number: simBlock,
    hash: randomHash(),
    txCount: Math.floor(Math.random() * 40) + 5,
    gasFee: (Math.random() * 0.005 + 0.001).toFixed(4),
    miner: simMiners[Math.floor(Math.random() * simMiners.length)],
    timestamp: Date.now(),
  };
}

export function web3GenerateBlocks(count: number): BlockEvent[] {
  return Array.from({ length: count }, () => web3GenerateBlock());
}

export async function web3FetchBalance(currentBalance: number, currentNfts: number): Promise<AthBalance> {
  if (!web3IsConfigured) {
    const drift = (Math.random() - 0.45) * 200;
    return {
      balance: Math.max(0, currentBalance + drift),
      nftCount: currentNfts,
      gasFee: (Math.random() * 0.005 + 0.001).toFixed(4),
      blockHeight: simBlock,
      validators: 1402 + Math.floor(Math.random() * 20 - 10),
      change24h: (Math.random() * 30 - 5),
    };
  }
  try {
    const res = await fetch(`${RPC_URL}/v1/ath/balance/${CONTRACT_ADDR}`);
    if (!res.ok) throw new Error(`Web3 bridge ${res.status}`);
    return (await res.json()) as AthBalance;
  } catch {
    return {
      balance: currentBalance,
      nftCount: currentNfts,
      gasFee: '0.0000',
      blockHeight: simBlock,
      validators: 1402,
      change24h: 0,
    };
  }
}
