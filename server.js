/**
 * Aethelis OS — Hardware Telemetry Daemon v2.0
 *
 * Full-stack WebSocket bridge: harvests real system metrics every 1 s
 * and broadcasts them to all connected Aethelis OS clients.
 *
 * Supported client commands:
 *   { type: "request_telemetry" }      — immediate snapshot
 *   { type: "DEPLOY_WORKER", load: 3 } — spawn stress workers (CPU spike demo)
 */

const { WebSocketServer } = require('ws');
const http = require('http');
const os   = require('os');
const { Worker, isMainThread, workerData } = require('worker_threads');

const PORT = process.env.WS_PORT || 8080;

// ── HTTP health endpoint ──────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: 'Aethelis Telemetry Daemon Active',
    version: '2.0.0',
    uptime: process.uptime(),
  }));
});

const wss  = new WebSocketServer({ server });
const clients = new Set();
const daemonStart = Date.now();

// ── CPU delta tracking ────────────────────────────────────────────────────────
// We sample two points and compute usage from the diff (accurate).
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
// Node's os module doesn't expose per-second bytes, so we use /proc/net/dev
// on Linux or fall back to 0.
let prevNetStats = null;

function readNetStats() {
  try {
    const fs = require('fs');
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
  return {
    rxKbps: Math.max(0, rxKbps),
    txKbps: Math.max(0, txKbps),
  };
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

// ── Broadcast to all clients ───────────────────────────────────────────────
function broadcast(payload) {
  const msg = JSON.stringify(payload);
  clients.forEach(c => { if (c.readyState === 1) c.send(msg); });
}

// ── DEPLOY_WORKER: spin CPU-intensive worker threads ───────────────────────
const activeWorkers = new Set();

function spawnStressWorker(durationMs = 4000) {
  // Inline worker code as data URI
  const workerCode = `
    const { workerData } = require('worker_threads');
    const end = Date.now() + workerData.durationMs;
    // Busy-loop for the specified duration
    while (Date.now() < end) {
      Math.sqrt(Math.random() * 1e8);
    }
  `;
  const { Worker } = require('worker_threads');
  const w = new Worker(workerCode, { eval: true, workerData: { durationMs } });
  activeWorkers.add(w);
  w.on('exit', () => activeWorkers.delete(w));
  return w;
}

// ── WebSocket connection handler ───────────────────────────────────────────
wss.on('connection', ws => {
  clients.add(ws);
  console.log(`[WS] Client connected — total: ${clients.size}`);

  // Immediate snapshot on connect
  ws.send(JSON.stringify({ type: 'telemetry', data: getSystemTelemetry() }));

  ws.on('message', raw => {
    try {
      const msg = JSON.parse(raw.toString());

      if (msg.type === 'request_telemetry') {
        ws.send(JSON.stringify({ type: 'telemetry', data: getSystemTelemetry() }));
      }

      if (msg.type === 'DEPLOY_WORKER') {
        const count    = Math.min(msg.count ?? 2, os.cpus().length);
        const duration = Math.min(msg.duration ?? 5000, 15000);
        console.log(`[WS] DEPLOY_WORKER: spawning ${count} stress threads for ${duration}ms`);
        for (let i = 0; i < count; i++) spawnStressWorker(duration);
        broadcast({ type: 'worker_spawned', count, duration });
      }
    } catch (e) {
      console.error('[WS] Message parse error:', e.message);
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
// Pre-warm CPU sample before first broadcast
prevCpuSample = sampleCpuTimes();
prevNetStats  = readNetStats();

setInterval(() => {
  broadcast({ type: 'telemetry', data: getSystemTelemetry() });
}, 1000);

// ── Start ─────────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  const pad = s => s.toString().padEnd(40);
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║  AETHELIS TELEMETRY DAEMON v2.0              ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║  ${pad('WS: ws://localhost:' + PORT)}║`);
  console.log(`║  ${pad('Platform: ' + os.platform() + ' ' + os.arch())}║`);
  console.log(`║  ${pad('Hostname: ' + os.hostname())}║`);
  console.log(`║  ${pad('CPU Cores: ' + os.cpus().length + ' × ' + (os.cpus()[0]?.model||'').split(' ')[0])}║`);
  console.log(`║  ${pad('RAM: ' + (os.totalmem()/(1024**3)).toFixed(1) + ' GB')}║`);
  console.log('╚══════════════════════════════════════════════╝\n');
});

// ── Graceful shutdown ─────────────────────────────────────────────────────
process.on('SIGINT', () => {
  console.log('\n[Daemon] Shutting down gracefully…');
  activeWorkers.forEach(w => w.terminate());
  wss.clients.forEach(c => c.close());
  server.close(() => { console.log('[Daemon] Done.'); process.exit(0); });
});
