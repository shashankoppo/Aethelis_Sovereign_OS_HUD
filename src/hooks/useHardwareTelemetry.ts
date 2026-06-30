/**
 * useHardwareTelemetry — Phase 7 Hardware Bridge
 *
 * Establishes a persistent, auto-reconnecting WebSocket link to the
 * Aethelis Telemetry Daemon (server.js). If the daemon is unavailable,
 * falls back to a rich simulation that produces realistic looking metrics
 * and exposes a `daemonConnected` flag so the UI can show the amber
 * [LOCAL DAEMON DISCONNECTED] badge.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Telemetry {
  cpu: {
    usage: number;
    cores: number;
    model: string;
    loadAvg: [number, number, number];
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  network: {
    connections: number;
    rxKbps: number;
    txKbps: number;
  };
  system: {
    platform: string;
    arch: string;
    hostname: string;
    uptime: number;
    uptimeFormatted: string;
  };
  timestamp: string;
}

export interface TelemetryState {
  data: Telemetry;
  daemonConnected: boolean;
  cpuHistory: number[];     // last 60 readings
  rxHistory: number[];      // last 60 RX kbps readings
  txHistory: number[];      // last 60 TX kbps readings
  sendCommand: (cmd: object) => void;
  hijackActive: boolean;
}

// ── Simulation helpers ────────────────────────────────────────────────────────

let _simCpu = 18;
let _simUptime = Math.floor(Date.now() / 1000 - 3600);

function simTelemetry(): Telemetry {
  _simCpu = Math.min(95, Math.max(5, _simCpu + (Math.random() - 0.48) * 6));
  _simUptime += 1;
  const usedGb = 4.2 + Math.random() * 0.3;
  const totalGb = 16;
  return {
    cpu: { usage: parseFloat(_simCpu.toFixed(1)), cores: 8, model: 'Sovereign', loadAvg: [0.42, 0.38, 0.35] },
    memory: {
      total: totalGb,
      used: parseFloat(usedGb.toFixed(2)),
      free: parseFloat((totalGb - usedGb).toFixed(2)),
      usagePercent: parseFloat(((usedGb / totalGb) * 100).toFixed(1)),
    },
    network: {
      connections: 2,
      rxKbps: parseFloat((Math.random() * 800 + 200).toFixed(1)),
      txKbps: parseFloat((Math.random() * 400 + 100).toFixed(1)),
    },
    system: {
      platform: 'simulation',
      arch: 'x64',
      hostname: 'aethelis-node',
      uptime: _simUptime,
      uptimeFormatted: `${Math.floor(_simUptime / 60)}m ${_simUptime % 60}s`,
    },
    timestamp: new Date().toISOString(),
  };
}

// ── Default state ─────────────────────────────────────────────────────────────

const DEFAULT_TELEMETRY: Telemetry = simTelemetry();
const SIM_SEED = Array.from({ length: 20 }, () => parseFloat((Math.random() * 20 + 10).toFixed(1)));
const NET_SEED = Array.from({ length: 20 }, () => parseFloat((Math.random() * 600 + 200).toFixed(1)));

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useHardwareTelemetry(wsUrl = 'ws://localhost:8080'): TelemetryState {
  const [data,          setData]          = useState<Telemetry>(DEFAULT_TELEMETRY);
  const [daemonConnected, setDaemonConnected] = useState(false);
  const [cpuHistory,    setCpuHistory]    = useState<number[]>(SIM_SEED);
  const [rxHistory,     setRxHistory]     = useState<number[]>(NET_SEED);
  const [txHistory,     setTxHistory]     = useState<number[]>(NET_SEED.map(v => v * 0.4));
  const [hijackActive,  setHijackActive]  = useState(false);

  const wsRef        = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const simRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef   = useRef(true);

  // ── Simulation mode ─────────────────────────────────────────────────────
  const startSim = useCallback(() => {
    if (simRef.current) return; // already running
    simRef.current = setInterval(() => {
      if (!mountedRef.current) return;
      const t = simTelemetry();
      setData(t);
      setCpuHistory(h => [...h.slice(-59), t.cpu.usage]);
      setRxHistory(h  => [...h.slice(-59), t.network.rxKbps]);
      setTxHistory(h  => [...h.slice(-59), t.network.txKbps]);
    }, 1000);
  }, []);

  const stopSim = useCallback(() => {
    if (simRef.current) { clearInterval(simRef.current); simRef.current = null; }
  }, []);

  // ── WebSocket connect ────────────────────────────────────────────────────
  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        setDaemonConnected(true);
        stopSim(); // real data coming in — stop simulation
        if (reconnectRef.current) { clearTimeout(reconnectRef.current); reconnectRef.current = null; }
      };

      ws.onmessage = (ev) => {
        if (!mountedRef.current) return;
        try {
          const msg = JSON.parse(ev.data as string);
          if (msg.type === 'telemetry' && msg.data) {
            const t: Telemetry = msg.data;
            setData(t);
            setCpuHistory(h => [...h.slice(-59), t.cpu.usage]);
            setRxHistory(h  => [...h.slice(-59), t.network.rxKbps]);
            setTxHistory(h  => [...h.slice(-59), t.network.txKbps]);
          }
          if (msg.type === 'worker_spawned') {
            setHijackActive(true);
            // Hijack lasts as long as the workers (duration + buffer)
            setTimeout(() => setHijackActive(false), (msg.duration ?? 5000) + 2000);
          }
        } catch { /* ignore parse errors */ }
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        setDaemonConnected(false);
        startSim(); // fall back to simulation
        // Reconnect after 4 s
        reconnectRef.current = setTimeout(connect, 4000);
      };

      ws.onerror = () => {
        // onclose will fire next — nothing to do here
      };
    } catch {
      // WebSocket constructor itself threw (non-browser env, etc.)
      setDaemonConnected(false);
      startSim();
    }
  }, [wsUrl, startSim, stopSim]);

  // ── Command sender ───────────────────────────────────────────────────────
  const sendCommand = useCallback((cmd: object) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(cmd));
    } else {
      // Simulate the command effect locally
      if ((cmd as { type?: string }).type === 'DEPLOY_WORKER') {
        setHijackActive(true);
        // Spike simulated CPU
        _simCpu = 85 + Math.random() * 10;
        setTimeout(() => { setHijackActive(false); _simCpu = 20; }, 6000);
      }
    }
  }, []);

  // ── Lifecycle ────────────────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    // Start simulation immediately so the UI has data from frame 0
    startSim();
    // Attempt real connection in parallel
    connect();

    return () => {
      mountedRef.current = false;
      stopSim();
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, daemonConnected, cpuHistory, rxHistory, txHistory, sendCommand, hijackActive };
}
