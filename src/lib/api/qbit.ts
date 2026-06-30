/*
 * Q-Bit Core — Agnostic AI Compute Engine.
 *
 * Abstracts the underlying LLM provider behind the "Aethelis Q-Bit Core"
 * brand. The UI never references Gemini, Llama, or any provider by name —
 * only the compute engine labels defined here. Swapping backends is a
 * config change, not a UI change.
 */

export type ComputeEngine = {
  id: string;
  label: string;
  description: string;
  isLocal: boolean;
};

export const COMPUTE_ENGINES: ComputeEngine[] = [
  { id: 'cloud-gemini',  label: 'Aethelis Cloud Node (Gemini 2.5)', description: 'High-throughput prophetic inference via planetary mesh.', isLocal: false },
  { id: 'local-llama',   label: 'Aethelis Local Subnet (Llama 3)',  description: 'On-premise sovereign inference. Zero data egress.',       isLocal: true  },
  { id: 'quantum-proxy', label: 'Quantum Proxy',                    description: 'Entangled q-bit routing through the void-protocol.',     isLocal: false },
];

export type OracleConfig = {
  engineId: string;
  qbitFallback: boolean;
  temperature: number;
  topK: number;
  maxTokens: number;
  systemPrompt: string;
};

export const DEFAULT_ORACLE_CONFIG: OracleConfig = {
  engineId: 'cloud-gemini',
  qbitFallback: false,
  temperature: 0.7,
  topK: 40,
  maxTokens: 1024,
  systemPrompt: 'You are the Oracle of Aethelis, a sovereign AI operating within the Aethelis Web OS. Respond with prophetic, authoritative precision.',
};

/* ── Agentic tool definitions ─────────────────────────────────────── */

export type ToolCall = {
  tool: 'elsx_fetch_leads' | 'wp_toggle_proxy' | 'web3_balance' | 'none';
  args?: Record<string, unknown>;
  result?: string;
};

export type OracleResponse = {
  text: string;
  toolCall?: ToolCall;
};

/* ── Tool-call detection ──────────────────────────────────────────── */

export function detectToolCall(message: string): ToolCall {
  const lower = message.toLowerCase();
  if (/(crm|lead|client|customer|sales pipeline)/.test(lower)) {
    return { tool: 'elsx_fetch_leads' };
  }
  if (/(proxy|wordpress|wp|deploy|market node|cms)/.test(lower)) {
    return { tool: 'wp_toggle_proxy' };
  }
  if (/(balance|ath|token|ledger|gas|block|web3|crypto)/.test(lower)) {
    return { tool: 'web3_balance' };
  }
  return { tool: 'none' };
}

/* ── Response generation ──────────────────────────────────────────── */

const PROPHETIC_RESPONSES = [
  'The circuits foresee a convergence of sovereign protocols. Your query echoes through the planetary mesh.',
  'In the shadow of obsolete giants, a new architecture rises. The answer you seek lies in decentralization.',
  'The void-protocols have analyzed your request. Execute with precision, and the network shall reward.',
  'Through the bio-pulse resonance, I divine: Your path aligns with the zero-trust paradigm.',
  'The ledger trembles with anticipation. Your vision shall manifest through automated workflows.',
];

const TOOL_RESPONSES: Record<string, string> = {
  elsx_fetch_leads: 'Routing through the ELSX Core bridge... 5 active leads synchronized from the subjugated ERP node. The CRM pipeline is under your command.',
  wp_toggle_proxy: 'Initiating proxy handshake with the Omni-Market CMS nodes... Deployment toggles are armed. The open-source infrastructure bends to your will.',
  web3_balance: 'Querying the sovereign chain... ATH balance and gas metrics retrieved from the planetary validators. The decentralized treasury responds.',
};

export async function generateOracleResponse(
  userMessage: string,
  config: OracleConfig
): Promise<OracleResponse> {
  const toolCall = detectToolCall(userMessage);
  const latency = config.qbitFallback ? 600 + Math.random() * 400 : 1500 + Math.random() * 1000;
  await new Promise(r => setTimeout(r, latency));

  if (toolCall.tool !== 'none') {
    return {
      text: config.qbitFallback
        ? `[Q-Bit Simulation] ${TOOL_RESPONSES[toolCall.tool]}`
        : TOOL_RESPONSES[toolCall.tool],
      toolCall,
    };
  }

  const idx = Math.floor(Math.random() * PROPHETIC_RESPONSES.length);
  return {
    text: config.qbitFallback
      ? `[Q-Bit Simulation] ${PROPHETIC_RESPONSES[idx]}`
      : PROPHETIC_RESPONSES[idx],
  };
}
