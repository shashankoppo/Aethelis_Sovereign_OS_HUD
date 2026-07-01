/**
 * useHardwareTelemetry — Phase 9 Total System Takeover Bridge
 *
 * Establishes a persistent, auto-reconnecting WebSocket link to the
 * Aethelis Sovereign Daemon (server.js). If the daemon is unavailable,
 * falls back to a rich simulation that produces realistic looking metrics
 * and exposes a `daemonConnected` flag so the UI can show the amber
 * [LOCAL DAEMON DISCONNECTED] badge.
 *
 * Routes:
 *   - telemetry (live hardware metrics)
 *   - shell_output (reverse shell results from the backend)
 *   - harvest_started / harvest_stopped / harvest_tick (compute harvester)
 *   - persistence_status (PM2 / systemd / launchd boot persistence)
 *   - compute_node_started / compute_node_suspended / compute_node_tick (ELSX)
 *   - mesh_sync (high-frequency state-reconciliation payloads)
 *   - vault_files / vault_error (secure local storage)
 *   - network_scan_result / network_scan_error (local mesh discovery)
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
    harvestActive?: boolean;
    computeNodeActive?: boolean;
  };
  timestamp: string;
}

export interface ShellOutput {
  command: string;
  output: string;
  error: string;
}

export interface PersistenceStatus {
  pm2: boolean;
  autostart: boolean;
  pid: number;
  uptime: number;
}

export interface ComputeNodeStats {
  cycles: number;
  vectorOps: number;
  meshPackets: number;
  cores: number;
  vectorCacheMB: number;
}

export interface VaultFile {
  name: string;
  size: number;
  fileType: string;
  created_at: string;
  modified_at: string;
}

export interface NetworkDevice {
  ip: string;
  mac: string;
  interface: string;
  type: string;
  status: string;
}

// Phase 10: ML Fine-Tuning
export interface MLStats {
  epochs: number;
  tensorOps: number;
  loss: number;
  accuracy: number;
  weightBufferMB: number;
  cores: number;
  memUsagePercent: number;
}

// Phase 10: Network Stress Test
export interface StressTestStats {
  packetsSent: number;
  packetsReceived: number;
  bytesSent: number;
  bytesReceived: number;
  throughputMBps: number;
  errors: number;
  activeConnections: number;
  concurrency: number;
  elapsed: number;
}

// Phase 10: Autonomous Scheduler
export interface SchedulerJob {
  id: string;
  name: string;
  intervalSec: number;
  enabled: boolean;
  runCount: number;
  lastRun: string | null;
}

type TelemetryListener = (msg: any) => void;

export interface TelemetryState {
  data: Telemetry;
  daemonConnected: boolean;
  cpuHistory: number[];
  rxHistory: number[];
  txHistory: number[];
  sendCommand: (cmd: object) => void;
  hijackActive: boolean;
  harvestActive: boolean;
  harvestedCycles: number;
  shellOutputs: ShellOutput[];
  persistence: PersistenceStatus | null;
  // Phase 9
  computeNodeActive: boolean;
  computeNodeStats: ComputeNodeStats | null;
  vaultFiles: VaultFile[];
  vaultError: string | null;
  networkDevices: NetworkDevice[];
  networkScanRaw: string | null;
  networkScanning: boolean;
  networkScanError: string | null;
  // Phase 10
  mlActive: boolean;
  mlStats: MLStats | null;
  stressTestActive: boolean;
  stressTestStats: StressTestStats | null;
  schedulerJobs: SchedulerJob[];
  schedulerEvent: { jobId: string; jobName: string; type: string } | null;
  addListener: (fn: TelemetryListener) => () => void;
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
  const [data,            setData]            = useState<Telemetry>(DEFAULT_TELEMETRY);
  const [daemonConnected, setDaemonConnected] = useState(false);
  const [cpuHistory,      setCpuHistory]      = useState<number[]>(SIM_SEED);
  const [rxHistory,       setRxHistory]       = useState<number[]>(NET_SEED);
  const [txHistory,       setTxHistory]       = useState<number[]>(NET_SEED.map(v => v * 0.4));
  const [hijackActive,    setHijackActive]    = useState(false);
  const [harvestActive,   setHarvestActive]   = useState(false);
  const [harvestedCycles,  setHarvestedCycles]  = useState(0);
  const [shellOutputs,    setShellOutputs]    = useState<ShellOutput[]>([]);
  const [persistence,     setPersistence]     = useState<PersistenceStatus | null>(null);

  // Phase 9 state
  const [computeNodeActive, setComputeNodeActive] = useState(false);
  const [computeNodeStats,  setComputeNodeStats]  = useState<ComputeNodeStats | null>(null);
  const [vaultFiles,        setVaultFiles]        = useState<VaultFile[]>([]);
  const [vaultError,        setVaultError]        = useState<string | null>(null);
  const [networkDevices,    setNetworkDevices]    = useState<NetworkDevice[]>([]);
  const [networkScanRaw,    setNetworkScanRaw]    = useState<string | null>(null);
  const [networkScanning,   setNetworkScanning]   = useState(false);
  const [networkScanError,  setNetworkScanError]  = useState<string | null>(null);

  // Phase 10 state
  const [mlActive,          setMlActive]          = useState(false);
  const [mlStats,            setMlStats]           = useState<MLStats | null>(null);
  const [stressTestActive,   setStressTestActive]  = useState(false);
  const [stressTestStats,    setStressTestStats]   = useState<StressTestStats | null>(null);
  const [schedulerJobs,      setSchedulerJobs]     = useState<SchedulerJob[]>([]);
  const [schedulerEvent,     setSchedulerEvent]   = useState<{ jobId: string; jobName: string; type: string } | null>(null);

  const wsRef        = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const simRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef   = useRef(true);
  const listenersRef = useRef<Set<TelemetryListener>>(new Set());

  // ── Simulation mode ─────────────────────────────────────────────────────
  const startSim = useCallback(() => {
    if (simRef.current) return;
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

  // ── Add/remove message listener ─────────────────────────────────────────
  const addListener = useCallback((fn: TelemetryListener) => {
    listenersRef.current.add(fn);
    return () => { listenersRef.current.delete(fn); };
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
        stopSim();
        if (reconnectRef.current) { clearTimeout(reconnectRef.current); reconnectRef.current = null; }
        // Phase 10: Request scheduler status on connect
        try { ws.send(JSON.stringify({ type: 'SCHEDULER_GET_STATUS' })); } catch {}
      };

      ws.onmessage = (ev) => {
        if (!mountedRef.current) return;
        try {
          const msg = JSON.parse(ev.data as string);

          // Notify all listeners regardless of type
          listenersRef.current.forEach(fn => { try { fn(msg); } catch {} });

          switch (msg.type) {
            case 'telemetry': {
              const t: Telemetry = msg.data;
              setData(t);
              setCpuHistory(h => [...h.slice(-59), t.cpu.usage]);
              setRxHistory(h  => [...h.slice(-59), t.network.rxKbps]);
              setTxHistory(h  => [...h.slice(-59), t.network.txKbps]);
              break;
            }
            case 'worker_spawned':
              setHijackActive(true);
              setTimeout(() => setHijackActive(false), (msg.duration ?? 5000) + 2000);
              break;

            case 'harvest_started':
              setHarvestActive(true);
              break;

            case 'harvest_stopped':
              setHarvestActive(false);
              break;

            case 'harvest_tick':
              setHarvestedCycles(msg.cycles ?? 0);
              break;

            case 'shell_output':
              setShellOutputs(prev => [...prev.slice(-49), {
                command: msg.command ?? '',
                output:  msg.output  ?? '',
                error:   msg.error   ?? '',
              }]);
              break;

            case 'persistence_status':
              setPersistence({
                pm2:       !!msg.pm2,
                autostart: !!msg.autostart,
                pid:        msg.pid  ?? 0,
                uptime:     msg.uptime ?? 0,
              });
              break;

            // ── Phase 9: ELSX Compute Node ───────────────────────────────
            case 'compute_node_started':
              setComputeNodeActive(true);
              setComputeNodeStats({
                cycles: 0,
                vectorOps: 0,
                meshPackets: 0,
                cores: msg.cores ?? 0,
                vectorCacheMB: msg.vectorCacheMB ?? 0,
              });
              break;

            case 'compute_node_suspended':
              setComputeNodeActive(false);
              setComputeNodeStats(null);
              break;

            case 'compute_node_tick':
              setComputeNodeStats({
                cycles: msg.cycles ?? 0,
                vectorOps: msg.vectorOps ?? 0,
                meshPackets: msg.meshPackets ?? 0,
                cores: msg.cores ?? 0,
                vectorCacheMB: msg.vectorCacheMB ?? 0,
              });
              break;

            // ── Phase 9: Vault fs ────────────────────────────────────────
            case 'vault_files':
              setVaultFiles(msg.files ?? []);
              setVaultError(null);
              break;

            case 'vault_error':
              setVaultError(msg.error ?? 'Unknown vault error');
              break;

            // ── Phase 9: Network Discovery ────────────────────────────────
            case 'network_scan_result':
              setNetworkDevices(msg.devices ?? []);
              setNetworkScanRaw(msg.rawOutput ?? '');
              setNetworkScanning(false);
              setNetworkScanError(null);
              break;

            case 'network_scan_error':
              setNetworkScanError(msg.error ?? 'Scan failed');
              setNetworkScanning(false);
              break;

            // mesh_sync payloads are high-frequency; listeners can hook them
            // but we don't store them in state to avoid re-render storms.
            case 'mesh_sync':
              // Intentionally not stored in state — too high frequency.
              // Listeners receive it via addListener.
              break;

            // ── Phase 10: ML Fine-Tuning ──────────────────────────────────
            case 'ml_fine_tuning_started':
              setMlActive(true);
              setMlStats(null);
              break;

            case 'ml_fine_tuning_stopped':
              setMlActive(false);
              setMlStats(null);
              break;

            case 'ml_tick':
              setMlStats({
                epochs: msg.epochs ?? 0,
                tensorOps: msg.tensorOps ?? 0,
                loss: msg.loss ?? 0,
                accuracy: msg.accuracy ?? 0,
                weightBufferMB: msg.weightBufferMB ?? 0,
                cores: msg.cores ?? 0,
                memUsagePercent: msg.memUsagePercent ?? 0,
              });
              break;

            // ── Phase 10: Network Stress Test ─────────────────────────────
            case 'stress_test_started':
              setStressTestActive(true);
              setStressTestStats(null);
              break;

            case 'stress_test_tick':
              setStressTestStats({
                packetsSent: msg.packetsSent ?? 0,
                packetsReceived: msg.packetsReceived ?? 0,
                bytesSent: msg.bytesSent ?? 0,
                bytesReceived: msg.bytesReceived ?? 0,
                throughputMBps: msg.throughputMBps ?? 0,
                errors: msg.errors ?? 0,
                activeConnections: msg.activeConnections ?? 0,
                concurrency: msg.concurrency ?? 0,
                elapsed: msg.elapsed ?? 0,
              });
              break;

            case 'stress_test_complete':
              setStressTestActive(false);
              setStressTestStats({
                packetsSent: msg.packetsSent ?? 0,
                packetsReceived: msg.packetsReceived ?? 0,
                bytesSent: msg.bytesSent ?? 0,
                bytesReceived: msg.bytesReceived ?? 0,
                throughputMBps: 0,
                errors: msg.errors ?? 0,
                activeConnections: 0,
                concurrency: 0,
                elapsed: msg.elapsed ?? 0,
              });
              break;

            // ── Phase 10: Autonomous Scheduler ────────────────────────────
            case 'scheduler_status':
              setSchedulerJobs(msg.jobs ?? []);
              break;

            case 'scheduler_job_enabled':
            case 'scheduler_job_disabled':
              // Request fresh status to update the job list
              if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ type: 'SCHEDULER_GET_STATUS' }));
              }
              break;

            case 'scheduler_job_triggered':
              setSchedulerEvent({ jobId: msg.jobId, jobName: msg.jobName, type: 'triggered' });
              break;

            case 'scheduler_job_complete':
              setSchedulerEvent({ jobId: msg.jobId, jobName: msg.jobName, type: 'complete' });
              break;
          }
        } catch { /* ignore parse errors */ }
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        setDaemonConnected(false);
        startSim();
        reconnectRef.current = setTimeout(connect, 4000);
      };

      ws.onerror = () => { /* onclose fires next */ };
    } catch {
      setDaemonConnected(false);
      startSim();
    }
  }, [wsUrl, startSim, stopSim]);

  // ── Command sender ───────────────────────────────────────────────────────
  const sendCommand = useCallback((cmd: object) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(cmd));
    } else {
      // Simulate the command effect locally when daemon is disconnected
      const cmdType = (cmd as { type?: string }).type;
      if (cmdType === 'DEPLOY_WORKER') {
        setHijackActive(true);
        _simCpu = 85 + Math.random() * 10;
        setTimeout(() => { setHijackActive(false); _simCpu = 20; }, 6000);
      } else if (cmdType === 'START_HARVEST') {
        setHarvestActive(true);
        const simHarvest = setInterval(() => {
          setHarvestedCycles(c => c + Math.floor(Math.random() * 5000 + 2000));
        }, 2000);
        setTimeout(() => { if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) { clearInterval(simHarvest); } }, 60000);
        // Stop sim harvest if STOP_HARVEST is sent within 60s window
        listenersRef.current.add(() => {});
      } else if (cmdType === 'STOP_HARVEST') {
        setHarvestActive(false);
      } else if (cmdType === 'START_COMPUTE_NODE') {
        // Simulate compute node activation
        setComputeNodeActive(true);
        _simCpu = 92 + Math.random() * 6;
        setComputeNodeStats({
          cycles: 0, vectorOps: 0, meshPackets: 0,
          cores: 8, vectorCacheMB: 1024,
        });
        const simCompute = setInterval(() => {
          if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            setComputeNodeStats(prev => prev ? {
              ...prev,
              cycles: prev.cycles + Math.floor(Math.random() * 50000 + 10000),
              vectorOps: prev.vectorOps + Math.floor(Math.random() * 100000 + 50000),
              meshPackets: prev.meshPackets + 2,
            } : null);
          }
        }, 2000);
        setTimeout(() => { if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) clearInterval(simCompute); }, 120000);
      } else if (cmdType === 'SUSPEND_COMPUTE_NODE') {
        setComputeNodeActive(false);
        setComputeNodeStats(null);
        _simCpu = 20;
      } else if (cmdType === 'VAULT_LIST_FILES') {
        setVaultError('[SIMULATION] Daemon not connected — vault requires backend daemon running on ws://localhost:8080');
      } else if (cmdType === 'NETWORK_SCAN') {
        setNetworkScanning(false);
        setNetworkScanError('[SIMULATION] Daemon not connected — network scan requires backend daemon running on ws://localhost:8080');
      } else if (cmdType === 'START_ML_FINE_TUNING') {
        setMlActive(true);
        _simCpu = 88 + Math.random() * 7;
        setMlStats({ epochs: 0, tensorOps: 0, loss: 1.0, accuracy: 0, weightBufferMB: 4096, cores: 8, memUsagePercent: 90 });
        const simML = setInterval(() => {
          if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            setMlStats(prev => prev ? {
              ...prev,
              epochs: prev.epochs + 5,
              tensorOps: prev.tensorOps + Math.floor(Math.random() * 2000000 + 1000000),
              loss: Math.max(0.01, prev.loss * 0.997),
              accuracy: Math.min(0.999, prev.accuracy + 0.002),
            } : null);
          }
        }, 2000);
        setTimeout(() => { if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) clearInterval(simML); }, 300000);
      } else if (cmdType === 'STOP_ML_FINE_TUNING') {
        setMlActive(false);
        setMlStats(null);
        _simCpu = 20;
      } else if (cmdType === 'START_STRESS_TEST') {
        setStressTestActive(true);
        const simStress = setInterval(() => {
          if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            setStressTestStats(prev => {
              const sent = (prev?.packetsSent ?? 0) + Math.floor(Math.random() * 5000 + 2000);
              return {
                packetsSent: sent,
                packetsReceived: Math.floor(sent * 0.98),
                bytesSent: sent * 1024,
                bytesReceived: Math.floor(sent * 0.98) * 1024,
                throughputMBps: parseFloat((sent * 1024 / (1024*1024)).toFixed(2)),
                errors: Math.floor(Math.random() * 5),
                activeConnections: 500,
                concurrency: 500,
                elapsed: (prev?.elapsed ?? 0) + 1,
              };
            });
          }
        }, 1000);
        setTimeout(() => {
          if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            clearInterval(simStress);
            setStressTestActive(false);
          }
        }, 30000);
      } else if (cmdType === 'STOP_STRESS_TEST') {
        setStressTestActive(false);
        setStressTestStats(null);
      } else if (cmdType === 'SCHEDULER_GET_STATUS') {
        setSchedulerJobs([
          { id: 'data_aggregation', name: 'Continuous Data Aggregation', intervalSec: 30, enabled: false, runCount: 0, lastRun: null },
          { id: 'ledger_sync', name: 'Ledger Synchronization', intervalSec: 60, enabled: false, runCount: 0, lastRun: null },
          { id: 'nexus_recon', name: 'Nexus Auto-Reconnaissance', intervalSec: 120, enabled: false, runCount: 0, lastRun: null },
          { id: 'vault_integrity', name: 'Vault Integrity Check', intervalSec: 90, enabled: false, runCount: 0, lastRun: null },
        ]);
      } else if (cmdType === 'SCHEDULER_ENABLE_JOB' || cmdType === 'SCHEDULER_DISABLE_JOB') {
        // Simulate by toggling the job in local state
        const jobId = (cmd as { jobId: string }).jobId;
        setSchedulerJobs(prev => prev.map(j => j.id === jobId ? {
          ...j,
          enabled: cmdType === 'SCHEDULER_ENABLE_JOB',
          runCount: cmdType === 'SCHEDULER_ENABLE_JOB' ? j.runCount : j.runCount,
        } : j));
      } else if (cmdType === 'TERMINAL_COMMAND') {
        // Simulated shell — shows a disconnect error
        setShellOutputs(prev => [...prev.slice(-49), {
          command: (cmd as { command: string }).command,
          output: '',
          error: '[SIMULATION] Daemon not connected — shell commands require the backend daemon running on ws://localhost:8080',
        }]);
      }
    }
  }, []);

  // ── Lifecycle ────────────────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    startSim();
    connect();

    return () => {
      mountedRef.current = false;
      stopSim();
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      if (wsRef.current) wsRef.current.close();
      listenersRef.current.clear();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    data, daemonConnected, cpuHistory, rxHistory, txHistory,
    sendCommand, hijackActive,
    harvestActive, harvestedCycles, shellOutputs, persistence, addListener,
    // Phase 9
    computeNodeActive, computeNodeStats,
    vaultFiles, vaultError,
    networkDevices, networkScanRaw, networkScanning, networkScanError,
    // Phase 10
    mlActive, mlStats,
    stressTestActive, stressTestStats,
    schedulerJobs, schedulerEvent,
  };
}
