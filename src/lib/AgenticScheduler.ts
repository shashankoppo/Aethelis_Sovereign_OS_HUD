/*
 * AgenticScheduler — Phase 12 Autonomous Zero-Staff Paradigm
 *
 * A background scheduling utility that routinely invokes API bridges
 * (ELSX, WordPress/Web3) and pushes formatted log entries into the
 * Dashboard's Autonomous Ledger via a custom event emitter.
 *
 * Event Schema: { timestamp: Date, subsystem: string, action: string, status: 'SUCCESS' | 'PENDING' | 'ERROR' }
 */

import { elsxFetchLeads, elsxFetchShipments, elsxFetchAllocations, elsxSyncCoreNodes } from './api/elsx';
import { wpFetchNodes } from './api/wordpress';
import { web3GenerateBlock, web3FetchBalance } from './api/web3';

// ── Event Types ─────────────────────────────────────────────────────────────

export type AgenticStatus = 'SUCCESS' | 'PENDING' | 'ERROR';

export interface AgenticEvent {
  timestamp: Date;
  subsystem: string;
  action: string;
  status: AgenticStatus;
  detail?: string;
}

type AgenticListener = (event: AgenticEvent) => void;

// ── Event Bus (simple pub/sub) ──────────────────────────────────────────────

class AgenticEventBus {
  private listeners = new Set<AgenticListener>();

  subscribe(listener: AgenticListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(event: AgenticEvent): void {
    this.listeners.forEach(fn => {
      try { fn(event); } catch { /* ignore */ }
    });
  }
}

export const agenticEventBus = new AgenticEventBus();

// ── Scheduler Configuration ────────────────────────────────────────────────

interface SchedulerConfig {
  enabled: boolean;
  intervalMs: number;
  tasks: SchedulerTask[];
}

interface SchedulerTask {
  id: string;
  name: string;
  intervalSec: number;
  lastRun: Date | null;
  runCount: number;
  handler: () => Promise<{ subsystem: string; action: string; detail?: string }>;
}

// ── Task Handlers ──────────────────────────────────────────────────────────

async function taskElsxLeadsSync(): Promise<{ subsystem: string; action: string; detail?: string }> {
  try {
    const leads = await elsxFetchLeads();
    return {
      subsystem: 'ELSX Core',
      action: 'CRM Lead Synchronization',
      detail: `${leads.length} leads synchronized from subjugated ERP node`,
    };
  } catch (err) {
    throw new Error(`ELSX leads sync failed: ${(err as Error).message}`);
  }
}

async function taskElsxShipmentsSync(): Promise<{ subsystem: string; action: string; detail?: string }> {
  try {
    const shipments = await elsxFetchShipments();
    const inTransit = shipments.filter(s => s.status === 'in_transit').length;
    return {
      subsystem: 'ELSX Logistics',
      action: 'Route Optimization Cycle',
      detail: `${shipments.length} shipments tracked — ${inTransit} in transit`,
    };
  } catch (err) {
    throw new Error(`ELSX shipments sync failed: ${(err as Error).message}`);
  }
}

async function taskElsxAllocationsSync(): Promise<{ subsystem: string; action: string; detail?: string }> {
  try {
    const allocations = await elsxFetchAllocations();
    return {
      subsystem: 'ELSX Assets',
      action: 'Resource Allocation Audit',
      detail: `${allocations.length} asset allocations verified across compute nodes`,
    };
  } catch (err) {
    throw new Error(`ELSX allocations sync failed: ${(err as Error).message}`);
  }
}

async function taskWpNodesSync(): Promise<{ subsystem: string; action: string; detail?: string }> {
  try {
    const nodes = await wpFetchNodes();
    const online = nodes.filter(n => n.status === 'online').length;
    return {
      subsystem: 'Omni-Market',
      action: 'CMS Node Health Check',
      detail: `${online}/${nodes.length} WordPress nodes responding — proxy mesh stable`,
    };
  } catch (err) {
    throw new Error(`Omni-Market sync failed: ${(err as Error).message}`);
  }
}

async function taskWeb3BlockTicker(): Promise<{ subsystem: string; action: string; detail?: string }> {
  try {
    const block = web3GenerateBlock();
    return {
      subsystem: 'Sovereign Chain',
      action: 'Block Validation',
      detail: `Block #${block.number} validated — ${block.txCount} tx, gas ${block.gasFee} ATH`,
    };
  } catch (err) {
    throw new Error(`Web3 block generation failed: ${(err as Error).message}`);
  }
}

async function taskFullSync(): Promise<{ subsystem: string; action: string; detail?: string }> {
  try {
    const result = await elsxSyncCoreNodes();
    return {
      subsystem: 'ELSX Core',
      action: 'Full Node Synchronization',
      detail: `Sync complete: ${result.leads} leads, ${result.shipments} shipments, ${result.allocations} assets`,
    };
  } catch (err) {
    throw new Error(`Full sync failed: ${(err as Error).message}`);
  }
}

// ── Agentic Scheduler Class ────────────────────────────────────────────────

class AgenticScheduler {
  private config: SchedulerConfig;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private taskTimers: Map<string, ReturnType<typeof setInterval>> = new Map();

  constructor() {
    this.config = {
      enabled: false,
      intervalMs: 20000, // Default 20-second base interval
      tasks: [
        { id: 'elsx_leads', name: 'ELSX Leads Sync', intervalSec: 25, lastRun: null, runCount: 0, handler: taskElsxLeadsSync },
        { id: 'elsx_shipments', name: 'ELSX Shipments Sync', intervalSec: 30, lastRun: null, runCount: 0, handler: taskElsxShipmentsSync },
        { id: 'elsx_allocations', name: 'ELSX Allocations Sync', intervalSec: 35, lastRun: null, runCount: 0, handler: taskElsxAllocationsSync },
        { id: 'wp_nodes', name: 'Omni-Market Nodes Sync', intervalSec: 20, lastRun: null, runCount: 0, handler: taskWpNodesSync },
        { id: 'web3_block', name: 'Sovereign Chain Block', intervalSec: 15, lastRun: null, runCount: 0, handler: taskWeb3BlockTicker },
        { id: 'full_sync', name: 'Full ELSX Sync', intervalSec: 45, lastRun: null, runCount: 0, handler: taskFullSync },
      ],
    };
  }

  start(): void {
    if (this.intervalId) return;

    this.config.enabled = true;

    // Emit startup event
    agenticEventBus.emit({
      timestamp: new Date(),
      subsystem: 'AgenticScheduler',
      action: 'Autonomous Scheduler Initialized',
      status: 'SUCCESS',
      detail: 'Zero-Staff Paradigm engaged — background operations now autonomous',
    });

    // Start individual task timers
    this.config.tasks.forEach(task => {
      const timer = setInterval(async () => {
        if (!this.config.enabled) return;
        await this.runTask(task);
      }, task.intervalSec * 1000);

      this.taskTimers.set(task.id, timer);
    });

    // Run initial tasks after a short delay
    setTimeout(() => {
      this.config.tasks.slice(0, 3).forEach(task => this.runTask(task));
    }, 2000);
  }

  stop(): void {
    this.config.enabled = false;

    // Clear all task timers
    this.taskTimers.forEach(timer => clearInterval(timer));
    this.taskTimers.clear();

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    agenticEventBus.emit({
      timestamp: new Date(),
      subsystem: 'AgenticScheduler',
      action: 'Autonomous Scheduler Suspended',
      status: 'SUCCESS',
      detail: 'All background operations halted by Proprietor command',
    });
  }

  private async runTask(task: SchedulerTask): Promise<void> {
    // Emit pending event
    agenticEventBus.emit({
      timestamp: new Date(),
      subsystem: task.name.split(' ')[0],
      action: `${task.name} initiated`,
      status: 'PENDING',
    });

    try {
      const result = await task.handler();

      task.lastRun = new Date();
      task.runCount++;

      // Emit success event
      agenticEventBus.emit({
        timestamp: new Date(),
        subsystem: result.subsystem,
        action: result.action,
        status: 'SUCCESS',
        detail: result.detail,
      });
    } catch (err) {
      // Emit error event
      agenticEventBus.emit({
        timestamp: new Date(),
        subsystem: task.name.split(' ')[0],
        action: task.name,
        status: 'ERROR',
        detail: (err as Error).message,
      });
    }
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  getTasks(): SchedulerTask[] {
    return this.config.tasks.map(t => ({
      ...t,
      lastRun: t.lastRun,
      runCount: t.runCount,
    }));
  }
}

// ── Singleton Instance ────────────────────────────────────────────────────

export const agenticScheduler = new AgenticScheduler();

// ── React Hook for Event Subscription ──────────────────────────────────────

import { useState, useEffect } from 'react';

export function useAgenticEvents(maxEvents: number = 50): AgenticEvent[] {
  const [events, setEvents] = useState<AgenticEvent[]>([]);

  useEffect(() => {
    const unsubscribe = agenticEventBus.subscribe((event) => {
      setEvents(prev => [...prev.slice(-(maxEvents - 1)), event]);
    });

    return unsubscribe;
  }, [maxEvents]);

  return events;
}
