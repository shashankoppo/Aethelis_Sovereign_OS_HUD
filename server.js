/**
 * Aethelis OS - Hardware Telemetry Daemon
 * WebSocket server streaming real system metrics
 */

const { WebSocketServer } = require('ws');
const http = require('http');
const os = require('os');

const PORT = process.env.WS_PORT || 8080;

// Create HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'Aethelis Telemetry Daemon Active' }));
});

// Create WebSocket server
const wss = new WebSocketServer({ server });

// Connected clients
const clients = new Set();

// System uptime start
const startTime = Date.now();

/**
 * Harvest real system telemetry
 */
function getSystemTelemetry() {
  const cpus = os.cpus();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const loadAvg = os.loadavg();

  // Calculate CPU usage (approximate)
  let totalIdle = 0;
  let totalTick = 0;
  cpus.forEach(cpu => {
    for (const type in cpu.times) {
      totalTick += cpu.times[type];
    }
    totalIdle += cpu.times.idle;
  });

  const usage = totalTick > 0 ? ((totalTick - totalIdle) / totalTick) * 100 : 0;
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

  return {
    timestamp: new Date().toISOString(),
    cpu: {
      usage: Math.min(100, Math.max(0, usage)).toFixed(1),
      cores: cpus.length,
      model: cpus[0]?.model || 'Unknown',
      loadAvg: loadAvg.map(l => l.toFixed(2))
    },
    memory: {
      total: Math.round(totalMem / (1024 * 1024 * 1024)), // GB
      used: Math.round(usedMem / (1024 * 1024 * 1024)), // GB
      free: Math.round(freeMem / (1024 * 1024 * 1024)), // GB
      usagePercent: ((usedMem / totalMem) * 100).toFixed(1)
    },
    system: {
      platform: os.platform(),
      arch: os.arch(),
      hostname: os.hostname(),
      uptime: uptimeSeconds,
      uptimeFormatted: formatUptime(uptimeSeconds)
    },
    network: {
      connections: clients.size
    }
  };
}

/**
 * Format uptime to human readable
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

/**
 * Broadcast telemetry to all connected clients
 */
function broadcastTelemetry() {
  const data = getSystemTelemetry();
  const message = JSON.stringify({
    type: 'telemetry',
    data
  });

  clients.forEach(client => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(message);
    }
  });
}

// WebSocket connection handler
wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`[WS] Client connected. Total: ${clients.size}`);

  // Send immediate telemetry on connect
  ws.send(JSON.stringify({
    type: 'telemetry',
    data: getSystemTelemetry()
  }));

  // Handle messages from client
  ws.on('message', (message) => {
    try {
      const msg = JSON.parse(message.toString());
      if (msg.type === 'request_telemetry') {
        ws.send(JSON.stringify({
          type: 'telemetry',
          data: getSystemTelemetry()
        }));
      }
    } catch (e) {
      console.error('[WS] Message parse error:', e.message);
    }
  });

  // Handle disconnect
  ws.on('close', () => {
    clients.delete(ws);
    console.log(`[WS] Client disconnected. Total: ${clients.size}`);
  });

  ws.on('error', (error) => {
    console.error('[WS] Error:', error.message);
    clients.delete(ws);
  });
});

// Start telemetry broadcast interval
setInterval(broadcastTelemetry, 2000);

// Start server
server.listen(PORT, () => {
  console.log(`\n╔══════════════════════════════════════════╗`);
  console.log(`║  AETHELIS TELEMETRY DAEMON v1.0         ║`);
  console.log(`╠══════════════════════════════════════════╣`);
  console.log(`║  WebSocket: ws://localhost:${PORT}         ║`);
  console.log(`║  Platform:  ${os.platform()} ${os.arch()}          `.padEnd(42) + '║');
  console.log(`║  Hostname:   ${os.hostname()}          `.slice(0, 42).padEnd(42) + '║');
  console.log(`║  CPU Cores:  ${os.cpus().length}                           `.padEnd(42) + '║');
  console.log(`╚══════════════════════════════════════════╝\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[Daemon] Shutting down...');
  wss.clients.forEach(client => client.close());
  server.close(() => {
    console.log('[Daemon] Shutdown complete');
    process.exit(0);
  });
});
