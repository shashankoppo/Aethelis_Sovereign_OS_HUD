import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
});

export type LedgerTransaction = {
  id: string;
  type: 'transfer' | 'nft_trade' | 'yield' | 'acquisition';
  asset: string;
  amount: number;
  direction: 'in' | 'out';
  label: string;
  note: string | null;
  created_at: string;
};

export type LogisticsOrder = {
  id: string;
  node_id: string;
  route: string;
  delta: number;
  currency: string;
  status: 'en_route' | 'pending' | 'complete' | 'failed';
  created_at: string;
};

export type MarketModule = {
  id: string;
  module_name: string;
  installed: boolean;
  installed_at: string | null;
};

export type SystemEvent = {
  id: string;
  category: 'network' | 'enterprise' | 'security' | 'ledger' | 'system';
  message: string;
  severity: 'info' | 'warn' | 'critical';
  created_at: string;
};

export type SystemLog = {
  id: string;
  source: 'kernel' | 'dashboard' | 'nexus' | 'oracle' | 'vault';
  level: 'sys' | 'info' | 'warn' | 'err' | 'user';
  message: string;
  created_at: string;
};

export type SovereignAsset = {
  id: number;
  ath_balance: number;
  nft_count: number;
  updated_at: string;
};

export type OracleMemory = {
  id: string;
  role: 'user' | 'oracle';
  content: string;
  created_at: string;
};

export type VaultFile = {
  id: string;
  name: string;
  file_type: string;
  encrypted: boolean;
  created_at: string;
};
