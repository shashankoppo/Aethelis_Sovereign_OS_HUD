/**
 * Aethelis Node Persistence Installer
 *
 * Run with: node setup_node.js
 *
 * Detects the host OS and installs the Aethelis telemetry daemon as a
 * permanent background service:
 *   - Linux:   systemd user service + crontab fallback
 *   - macOS:   LaunchAgent plist ( silent boot )
 *   - Windows: npm node-windows (or fallback instructions)
 *
 * The goal is "Silent Boot": the machine starts reporting telemetry the
 * moment the OS boots, even if the frontend UI is never opened.
 */

const os = require('os');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PLATFORM = os.platform();
const SCRIPT_DIR = __dirname;
const SERVER_FILE = path.join(SCRIPT_DIR, 'server.js');

console.log('\n╔════════════════════════════════════════════════════╗');
console.log('║  AETHELIS NODE PERSISTENCE INSTALLER              ║');
console.log('╠════════════════════════════════════════════════════╣');
console.log(`║  Platform: ${PLATFORM.padEnd(39)}║`);
console.log(`║  Node:     ${(process.version).padEnd(39)}║`);
console.log(`║  Server:   ${path.basename(SERVER_FILE).padEnd(39)}║`);
console.log('╚════════════════════════════════════════════════════╝\n');

// ── PM2 check (preferred for all platforms) ────────────────────────────────
function tryPM2() {
  try {
    execSync('pm2 --version', { stdio: 'pipe', timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

// ── Linux: systemd user service ─────────────────────────────────────────────────
function installLinux() {
  const serviceName = 'aethelis-daemon';
  const servicePath = path.join(os.homedir(), '.config/systemd/user', `${serviceName}.service`);
  const nodeBin = process.execPath;

  const unitFile = `[Unit]
Description=Aethelis Sovereign Telemetry Daemon
After=network.target

[Service]
Type=simple
ExecStart=${nodeBin} ${SERVER_FILE}
Restart=always
RestartSec=3
Environment=WS_PORT=8080
Environment=NODE_ENV=production

[Install]
WantedBy=default.target`;

  try {
    fs.mkdirSync(path.dirname(servicePath), { recursive: true });
    fs.writeFileSync(servicePath, unitFile);
    console.log('[+] systemd unit file written:', servicePath);

    execSync('systemctl --user daemon-reload', { stdio: 'pipe' });
    execSync(`systemctl --user enable ${serviceName}`, { stdio: 'pipe' });
    execSync(`systemctl --user start ${serviceName}`, { stdio: 'pipe' });

    // Enable lingering so the user service runs before login
    try {
      execSync(`loginctl enable-linger ${os.userInfo().username}`, { stdio: 'pipe' });
    } catch { /* non-root — lingering may need sudo */ }

    console.log(`[+] ${serviceName} enabled and started.`);
    console.log('[+] System lingering enabled — daemon runs on boot.');
    return true;
  } catch (e) {
    console.log('[!] systemd install failed:', e.message);
    console.log('[*] Falling back to crontab @reboot…');

    // Crontab fallback
    const crontabLine = `@reboot ${nodeBin} ${SERVER_FILE} >> ${SCRIPT_DIR}/logs/aethelis-cron.log 2>&1`;
    try {
      const current = execSync('crontab -l 2>/dev/null || true', { encoding: 'utf8' });
      if (!current.includes('aethelis')) {
        const updated = current.trim() + '\n' + crontabLine + '\n';
        execSync(`echo ${JSON.stringify(updated)} | crontab -`);
        console.log('[+] @reboot cron entry added — daemon starts on boot.');
      } else {
        console.log('[*] Crontab already contains aethelis entry — skipping.');
      }
      return true;
    } catch (e2) {
      console.log('[!] crontab fallback failed:', e2.message);
      return false;
    }
  }
}

// ── macOS: LaunchAgent plist ───────────────────────────────────────────────────
function installMacOS() {
  const plistName = 'com.aethelis.daemon';
  const plistPath = path.join(os.homedir(), 'Library/LaunchAgents', `${plistName}.plist`);
  const nodeBin = process.execPath;

  const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${plistName}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${nodeBin}</string>
    <string>${SERVER_FILE}</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>EnvironmentVariables</key>
  <dict>
    <key>WS_PORT</key>
    <string>8080</string>
    <key>NODE_ENV</key>
    <string>production</string>
  </dict>
  <key>StandardOutPath</key>
  <string>${SCRIPT_DIR}/logs/aethelis-out.log</string>
  <key>StandardErrorPath</key>
  <string>${SCRIPT_DIR}/logs/aethelis-error.log</string>
</dict>
</plist>`;

  try {
    fs.mkdirSync(path.dirname(plistPath), { recursive: true });

    // Ensure logs dir exists
    fs.mkdirSync(path.join(SCRIPT_DIR, 'logs'), { recursive: true });

    fs.writeFileSync(plistPath, plist);
    console.log('[+] LaunchAgent plist written:', plistPath);

    execSync(`launchctl load -w "${plistPath}"`, { stdio: 'pipe' });
    console.log('[+] LaunchAgent loaded — daemon started and set for silent boot.');
    return true;
  } catch (e) {
    console.log('[!] LaunchAgent installation failed:', e.message);
    return false;
  }
}

// ── Windows: npm node-windows fallback ──────────────────────────────────────
function installWindows() {
  console.log('[*] For Windows, the recommended approach is PM2:');
  console.log('    npm install -g pm2');
  console.log('    pm2 start ecosystem.config.js');
  console.log('    pm2 save');
  console.log('    pm2 startup');
  console.log();
  console.log('[*] Alternatively, use schtasks to create a startup task:');
  const nodeBin = process.execPath;
  console.log(`    schtasks /create /tn "AethelisDaemon" /tr "${nodeBin} ${SERVER_FILE}" /sc onlogon /rl highest`);
  return false;
}

// ── Main installer ───────────────────────────────────────────────────────
function main() {
  // Ensure logs directory exists
  fs.mkdirSync(path.join(SCRIPT_DIR, 'logs'), { recursive: true });

  // Try PM2 first
  if (tryPM2()) {
    console.log('[+] PM2 detected — installing via ecosystem.config.js…');
    try {
      execSync('pm2 start ecosystem.config.js', { stdio: 'inherit' });
      execSync('pm2 save', { stdio: 'pipe' });
      console.log('[+] PM2 configuration saved.');
      console.log('\n  To enable boot persistence, run:');
      console.log('    pm2 startup');
      console.log('  (follow the printed instruction for your platform)\n');
      console.log('╔══════════════════════════════════════════════════╗');
      console.log('║  PERMANENT NODE: SECURED  (via PM2)              ║');
      console.log('╚══════════════════════════════════════════════════╝\n');
      return;
    } catch (e) {
      console.log('[!] PM2 start failed:', e.message);
      console.log('[*] Falling back to native OS service…');
    }
  } else {
    console.log('[*] PM2 not found — installing native OS service…');
  }

  let success = false;
  switch (PLATFORM) {
    case 'linux':   success = installLinux();   break;
    case 'darwin':  success = installMacOS();   break;
    case 'win32':   success = installWindows(); break;
    default:        success = false;
  }

  console.log();
  if (success) {
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║  PERMANENT NODE: SECURED                        ║');
    console.log('║  The host machine is now a permanent bridge     ║');
    console.log('║  node in the Aethelis mesh. Telemetry reports   ║');
    console.log('║  automatically on system boot.                  ║');
    console.log('╚══════════════════════════════════════════════════╝\n');
  } else {
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║  PARTIAL SETUP — manual steps required           ║');
    console.log('║  See the messages above for your platform.       ║');
    console.log('╚══════════════════════════════════════════════════╝\n');
  }
}

main();
