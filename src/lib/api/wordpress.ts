/*
 * Omni-Market Bridge — Subjugated WordPress / WooCommerce interface.
 *
 * Fetches live order counts, plugin statuses, and server health from
 * WordPress REST endpoints. The UI never sees "WordPress" — only the
 * "Hijacked Proxy" abstraction. Degrades to simulated data when no
 * backend is configured.
 */

export type ProxyNode = {
  id: string;
  name: string;
  url: string;
  status: 'online' | 'degraded' | 'offline';
  orders: number;
  revenue: string;
  plugins: { name: string; active: boolean; version: string }[];
  health: { cpu: number; memory: number; uptime: string };
  proxyEnabled: boolean;
};

const WP_URL = import.meta.env.VITE_WP_URL as string | undefined;
const WP_KEY = import.meta.env.VITE_WP_API_KEY as string | undefined;

export const wpIsConfigured = Boolean(WP_URL && WP_KEY);

/* ── Simulated fallback data ──────────────────────────────────────── */

const SIM_NODES: ProxyNode[] = [
  {
    id: 'wp-01', name: 'Sovereign CMS Alpha', url: 'https://node-alpha.aethelis.io',
    status: 'online', orders: 1284, revenue: '₹4.2L',
    plugins: [
      { name: 'WooCommerce', active: true, version: '8.9.2' },
      { name: 'Yoast SEO', active: true, version: '21.8' },
      { name: 'WP Rocket', active: false, version: '3.15' },
    ],
    health: { cpu: 34, memory: 62, uptime: '47d 12h' },
    proxyEnabled: true,
  },
  {
    id: 'wp-02', name: 'Commerce Node Beta', url: 'https://node-beta.aethelis.io',
    status: 'degraded', orders: 842, revenue: '₹2.8L',
    plugins: [
      { name: 'WooCommerce', active: true, version: '8.9.2' },
      { name: 'Elementor', active: true, version: '3.18' },
    ],
    health: { cpu: 78, memory: 89, uptime: '12d 3h' },
    proxyEnabled: true,
  },
  {
    id: 'wp-03', name: 'Media Stream Gamma', url: 'https://node-gamma.aethelis.io',
    status: 'offline', orders: 0, revenue: '₹0',
    plugins: [
      { name: 'WooCommerce', active: false, version: '8.9.2' },
    ],
    health: { cpu: 0, memory: 0, uptime: '—' },
    proxyEnabled: false,
  },
];

/* ── Bridge functions ─────────────────────────────────────────────── */

export async function wpFetchNodes(): Promise<ProxyNode[]> {
  if (!wpIsConfigured) return SIM_NODES;
  try {
    const res = await fetch(`${WP_URL}/wp-json/aethelis/v1/nodes`, {
      headers: { 'X-Aethelis-Key': WP_KEY!, 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`WP bridge ${res.status}`);
    return (await res.json()) as ProxyNode[];
  } catch {
    return SIM_NODES;
  }
}

export async function wpToggleProxy(nodeId: string, enabled: boolean): Promise<boolean> {
  if (!wpIsConfigured) {
    await new Promise(r => setTimeout(r, 800));
    return true;
  }
  try {
    const res = await fetch(`${WP_URL}/wp-json/aethelis/v1/nodes/${nodeId}/proxy`, {
      method: 'POST',
      headers: { 'X-Aethelis-Key': WP_KEY!, 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
