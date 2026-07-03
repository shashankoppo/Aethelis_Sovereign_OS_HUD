import React, { createContext, useContext, ReactNode } from 'react';
import { useHardwareTelemetry } from '../hooks/useHardwareTelemetry';

// ── Types ─────────────────────────────────────────────────────────

export interface TelemetryData {
  cpu: number;
  cpuTemp: number;
  ram: number;
  ramUsed: number;
  ramTotal: number;
  disk: number;
  diskRead: number;
  diskWrite: number;
  networkRx: number;
  networkTx: number;
  networkSpeed: string;
  uptime: number;
  processCount: number;
  loadAvg: [number, number, number];
  gpu: number;
  gpuTemp: number;
  gpuMem: number;
  fanRpm: number;
  powerDraw: number;
  voltage: number;
  throttling: boolean;
  swapUsed: number;
  swapTotal: number;
  connections: number;
  packetsRx: number;
  packetsTx: number;
  errorsRx: number;
  errorsTx: number;
  dropsRx: number;
  dropsTx: number;
}

interface TelemetryContextValue {
  data: TelemetryData;
  isConnected: boolean;
  isSimulation: boolean;
  lastUpdate: number;
}

const TelemetryContext = createContext<TelemetryContextValue | null>(null);

// ── Provider ─────────────────────────────────────────────────────────

export function TelemetryProvider({ children }: { children: ReactNode }) {
  const { data, isConnected, isSimulation, lastUpdate } = useHardwareTelemetry();

  const value: TelemetryContextValue = {
    data,
    isConnected,
    isSimulation,
    lastUpdate,
  };

  return (
    <TelemetryContext.Provider value={value}>
      {children}
    </TelemetryContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────────

export function useTelemetry() {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error('useTelemetry must be used within a TelemetryProvider');
  }
  return context;
}

// ── Selectors for Optimized Re-renders ─────────────────────────────────

export function useCpu() {
  const { data } = useTelemetry();
  return { cpu: data.cpu, cpuTemp: data.cpuTemp };
}

export function useMemory() {
  const { data } = useTelemetry();
  return { ram: data.ram, ramUsed: data.ramUsed, ramTotal: data.ramTotal };
}

export function useNetwork() {
  const { data } = useTelemetry();
  return {
    rx: data.networkRx,
    tx: data.networkTx,
    speed: data.networkSpeed,
    connections: data.connections,
  };
}

export function useDisk() {
  const { data } = useTelemetry();
  return { disk: data.disk, read: data.diskRead, write: data.diskWrite };
}

export function useSystemInfo() {
  const { data } = useTelemetry();
  return {
    uptime: data.uptime,
    processCount: data.processCount,
    loadAvg: data.loadAvg,
  };
}

export { TelemetryContext };
