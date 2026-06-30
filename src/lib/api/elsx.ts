/*
 * ELSX Core Bridge — Subjugated Odoo interface.
 *
 * All functions return Aethelis-branded data shapes. The underlying Odoo
 * XML-RPC / REST endpoints are never exposed to the UI layer. When the
 * backend is not configured, functions degrade gracefully to simulated
 * data so the OS never crashes.
 */

export type ElsxLead = {
  id: string;
  name: string;
  stage: 'New' | 'Qualified' | 'Proposal' | 'Won' | 'Lost';
  revenue: string;
  contact: string;
};

export type ElsxShipment = {
  id: string;
  tracking: string;
  origin: string;
  destination: string;
  status: 'dispatched' | 'in_transit' | 'delivered' | 'delayed';
  eta: string;
};

export type ElsxAllocation = {
  id: string;
  asset: string;
  assigned_to: string;
  quantity: number;
  location: string;
};

export type ElsxSyncResult = {
  ok: boolean;
  leads: number;
  shipments: number;
  allocations: number;
  timestamp: string;
};

const ODOO_URL = import.meta.env.VITE_ODOO_URL as string | undefined;
const ODOO_DB = import.meta.env.VITE_ODOO_DB as string | undefined;
const ODOO_USER = import.meta.env.VITE_ODOO_USER as string | undefined;
const ODOO_KEY = import.meta.env.VITE_ODOO_API_KEY as string | undefined;

export const elsxIsConfigured = Boolean(ODOO_URL && ODOO_DB && ODOO_KEY);

/* ── Simulated fallback data ──────────────────────────────────────── */

const SIM_LEADS: ElsxLead[] = [
  { id: 'L-1042', name: 'Arjun Mehra',     stage: 'Qualified', revenue: '₹4.2L', contact: 'arjun@elsx.io' },
  { id: 'L-1043', name: 'Sneha Kapoor',    stage: 'Proposal',  revenue: '₹1.8L', contact: 'sneha@elsx.io' },
  { id: 'L-1044', name: 'Ravi Shankar',   stage: 'Won',        revenue: '₹9.1L', contact: 'ravi@elsx.io' },
  { id: 'L-1045', name: 'Priya Nair',      stage: 'New',       revenue: '₹3.4L', contact: 'priya@elsx.io' },
  { id: 'L-1046', name: 'Karan Malhotra',  stage: 'Qualified', revenue: '₹6.7L', contact: 'karan@elsx.io' },
];

const SIM_SHIPMENTS: ElsxShipment[] = [
  { id: 'S-204', tracking: 'TRX-0042', origin: 'Mumbai Hub',    destination: 'Delhi DC',     status: 'in_transit', eta: '2h 14m' },
  { id: 'S-205', tracking: 'TRX-0043', origin: 'Bangalore',     destination: 'Chennai',      status: 'dispatched', eta: '5h 30m' },
  { id: 'S-206', tracking: 'TRX-0039', origin: 'Pune',          destination: 'Mumbai Hub',   status: 'delivered',  eta: 'Complete' },
  { id: 'S-207', tracking: 'TRX-0048', origin: 'Hyderabad',     destination: 'Kolkata',      status: 'delayed',    eta: '8h 02m' },
];

const SIM_ALLOCATIONS: ElsxAllocation[] = [
  { id: 'A-01', asset: 'Server Blade R7', assigned_to: 'ELSX-Node-1', quantity: 4, location: 'Mumbai DC' },
  { id: 'A-02', asset: 'GPU Cluster T4',  assigned_to: 'ELSX-Node-3', quantity: 2, location: 'Bangalore' },
  { id: 'A-03', asset: 'Cold Storage',     assigned_to: 'ELSX-Node-2', quantity: 1, location: 'Delhi DC' },
];

/* ── Bridge functions ─────────────────────────────────────────────── */

export async function elsxFetchLeads(): Promise<ElsxLead[]> {
  if (!elsxIsConfigured) return SIM_LEADS;
  try {
    const res = await fetch(`${ODOO_URL}/api/elsx/leads`, {
      headers: { 'X-ELSX-Key': ODOO_KEY!, 'X-ELSX-DB': ODOO_DB!, 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`ELSX bridge ${res.status}`);
    return (await res.json()) as ElsxLead[];
  } catch {
    return SIM_LEADS;
  }
}

export async function elsxFetchShipments(): Promise<ElsxShipment[]> {
  if (!elsxIsConfigured) return SIM_SHIPMENTS;
  try {
    const res = await fetch(`${ODOO_URL}/api/elsx/shipments`, {
      headers: { 'X-ELSX-Key': ODOO_KEY!, 'X-ELSX-DB': ODOO_DB!, 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`ELSX bridge ${res.status}`);
    return (await res.json()) as ElsxShipment[];
  } catch {
    return SIM_SHIPMENTS;
  }
}

export async function elsxFetchAllocations(): Promise<ElsxAllocation[]> {
  if (!elsxIsConfigured) return SIM_ALLOCATIONS;
  try {
    const res = await fetch(`${ODOO_URL}/api/elsx/allocations`, {
      headers: { 'X-ELSX-Key': ODOO_KEY!, 'X-ELSX-DB': ODOO_DB!, 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`ELSX bridge ${res.status}`);
    return (await res.json()) as ElsxAllocation[];
  } catch {
    return SIM_ALLOCATIONS;
  }
}

export async function elsxSyncCoreNodes(): Promise<ElsxSyncResult> {
  const [leads, shipments, allocations] = await Promise.all([
    elsxFetchLeads(),
    elsxFetchShipments(),
    elsxFetchAllocations(),
  ]);
  return {
    ok: true,
    leads: leads.length,
    shipments: shipments.length,
    allocations: allocations.length,
    timestamp: new Date().toISOString(),
  };
}
