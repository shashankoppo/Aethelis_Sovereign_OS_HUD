import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, Wifi, Battery, Network, Terminal, ShoppingBag,
  ShieldAlert, X, Minus, Maximize2, Settings, Globe, Coins,
  Activity, Users, BarChart3, Database, CheckCircle,
  Fingerprint, Smartphone, Unlock, Eye, FileText,
  Server, Shield, LayoutGrid, Play, Cpu, HardDrive,
  Zap, TrendingUp, TrendingDown, Lock, Radio, ArrowUpRight,
  Plus, Trash2, RefreshCw, ChevronRight,
  ArrowUp, ArrowDown, Layers, Menu, Folder, FolderOpen, FolderPlus,
  Image, Music, Video, File, Download, Upload, Cloud,
  Bell, Pause, PlayCircle, StopCircle, Power, LogOut,
  Sun, Moon, Volume2, VolumeX, Monitor, Palette,
  Clock, Calendar, Mail, MessageSquare, AlertTriangle,
  BookOpen, Sparkles, Send, Compass, Target, Crosshair
} from 'lucide-react';
import { supabase } from './lib/supabase';
import type {
  LedgerTransaction, LogisticsOrder, MarketModule, SystemEvent
} from './lib/supabase';

// ─── Types ───────────────────────────────────────────────────────────────────

interface AppConfig {
  id: string; title: string; icon: React.ElementType;
  color: string; bg: string; gradient: string; desc: string;
}
interface WindowState extends AppConfig {
  x: number; y: number; width: number; height: number;
  isMaximized: boolean; zIndex: number;
}
interface TermLog { type: 'user' | 'sys' | 'info' | 'err'; text: string; }

// ─── App Registry ─────────────────────────────────────────────────────────────

const APPS: Record<string, AppConfig> = {
  DASHBOARD: { id: 'dashboard', title: 'Atmosphere Control', icon: Activity,    color: 'text-sky-400',    bg: 'bg-sky-500',    gradient: 'from-sky-500 to-blue-600', desc: 'Planetary network monitoring' },
  MANIFESTO: { id: 'manifesto', title: 'The Manifesto',      icon: BookOpen,    color: 'text-rose-400',   bg: 'bg-rose-500',   gradient: 'from-rose-500 to-pink-600', desc: 'Missions & Visions' },
  ENTERPRISE:{ id: 'enterprise',title: 'ELSX Enterprise',   icon: Network,     color: 'text-violet-400', bg: 'bg-violet-600', gradient: 'from-violet-500 to-purple-700', desc: 'Business operations suite' },
  MARKET:    { id: 'market',    title: 'Omni-Market',       icon: ShoppingBag, color: 'text-emerald-400',bg: 'bg-emerald-500',gradient: 'from-emerald-500 to-teal-600', desc: 'Module marketplace' },
  LEDGER:    { id: 'ledger',    title: 'Sovereign Ledger',  icon: Coins,       color: 'text-amber-400',  bg: 'bg-amber-500',  gradient: 'from-amber-400 to-orange-600', desc: 'Decentralized economy' },
  ORACLE:    { id: 'oracle',    title: 'Gemini Oracle',     icon: Sparkles,    color: 'text-purple-400', bg: 'bg-purple-600', gradient: 'from-purple-500 to-violet-700', desc: 'AI prophetic interface' },
  EMULATOR:  { id: 'emulator',  title: 'Omni-Emulator',    icon: Smartphone,  color: 'text-cyan-400',   bg: 'bg-cyan-500',   gradient: 'from-cyan-500 to-sky-600', desc: 'Virtual environment' },
  NEXUS:     { id: 'nexus',     title: 'Kali-Nexus',       icon: ShieldAlert, color: 'text-red-400',    bg: 'bg-red-600',    gradient: 'from-red-600 to-rose-700', desc: 'Security & pentest' },
  VAULT:     { id: 'vault',     title: 'Bio-Pulse Vault',  icon: Fingerprint, color: 'text-violet-400', bg: 'bg-violet-700', gradient: 'from-violet-600 to-fuchsia-700', desc: 'Biometric archives' },
  KERNEL:    { id: 'kernel',    title: 'System Terminal',  icon: Terminal,    color: 'text-slate-300',  bg: 'bg-slate-700',  gradient: 'from-slate-600 to-slate-800', desc: 'Command interface' },
  FILES:     { id: 'files',     title: 'Files',            icon: Folder,      color: 'text-blue-400',   bg: 'bg-blue-500',  gradient: 'from-blue-500 to-indigo-600',  desc: 'File manager' },
  SETTINGS:  { id: 'settings',  title: 'System Preferences',icon: Settings,    color: 'text-gray-400',   bg: 'bg-gray-600',  gradient: 'from-gray-500 to-gray-700',   desc: 'System settings' },
};

// ─── Mini Components ─────────────────────────────────────────────────────────

function Sparkline({ data, color, h = 36 }: { data: number[]; color: string; h?: number }) {
  const W = 120;
  const max = Math.max(...data, 1), min = Math.min(...data, 0), range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * W},${h - ((v - min) / range) * (h - 4) - 2}`).join(' ');
  const area = `${pts} ${W},${h} 0,${h}`;
  const id = `sg-${color.replace('#', '')}`;
  return (
    <svg width={W} height={h} viewBox={`0 0 ${W} ${h}`} className="overflow-visible">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${id})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={(data.length - 1) / (data.length - 1) * W} cy={h - ((data[data.length - 1] - min) / range) * (h - 4) - 2} r="2.5" fill={color} />
    </svg>
  );
}

function Gauge({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  const r = 22, circ = 2 * Math.PI * r;
  const dash = Math.min(value / max, 1) * circ * 0.75;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="60" height="60" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="5"
          strokeDasharray={`${circ * 0.75} ${circ * 0.25}`} strokeDashoffset={circ * 0.125} strokeLinecap="round" transform="rotate(135 30 30)" />
        <circle cx="30" cy="30" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={circ * 0.125} strokeLinecap="round" transform="rotate(135 30 30)" />
        <text x="30" y="34" textAnchor="middle" fill="white" fontSize="10" fontWeight="600" fontFamily="monospace">{value}</text>
      </svg>
      <span className="text-[9px] uppercase tracking-widest text-white/40">{label}</span>
    </div>
  );
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
  en_route: { label: 'En Route', cls: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
  pending:  { label: 'Pending',  cls: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  complete: { label: 'Complete', cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  failed:   { label: 'Failed',   cls: 'text-red-400 bg-red-500/10 border-red-500/20' },
};

// ─── Squircle Icon Container ───────────────────────────────────────────────────

function Squircle({ children, color, size = 'md', className = '' }: {
  children: React.ReactNode;
  color: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-10 h-10 rounded-xl',
    lg: 'w-12 h-12 rounded-2xl'
  };
  return (
    <div className={`${sizeClasses[size]} flex items-center justify-center border shadow-lg ${className}`}
      style={{
        backgroundColor: `${color}15`,
        borderColor: `${color}40`,
        boxShadow: `0 4px 15px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.15)`
      }}>
      {children}
    </div>
  );
}

// ─── Concentric Ring Chart for CPU/RAM ─────────────────────────────────────────

function ConcentricRing({ value, max, color, label, size = 80 }: {
  value: number; max: number; color: string; label: string; size?: number;
}) {
  const r = size / 2 - 8, circ = 2 * Math.PI * r;
  const dash = Math.min(value / max, 1) * circ * 0.75;
  const cx = size / 2, cy = size / 2;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <filter id={`glow-${color.replace('#','')}`}>
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={circ * 0.125}
          strokeLinecap="round" transform={`rotate(135 ${cx} ${cy})`}
          filter={`url(#glow-${color.replace('#','')})`} />
        <text x={cx} y={cy - 4} textAnchor="middle" fill="white" fontSize="14" fontWeight="600" fontFamily="monospace">
          {typeof value === 'number' ? value.toFixed(1) : value}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="8" fontFamily="monospace">
          {label}
        </text>
      </svg>
    </div>
  );
}

// ─── Main OS Component ────────────────────────────────────────────────────────

export default function AethelisOS() {
  // OS State
  const [windows,          setWindows]          = useState<WindowState[]>([]);
  const [activeWindowId,   setActiveWindowId]   = useState<string | null>(null);
  const [minimized,        setMinimized]        = useState<string[]>([]);
  const [launchpadOpen,    setLaunchpadOpen]    = useState(false);
  const [time,             setTime]             = useState(new Date());
  const [isMobile,         setIsMobile]         = useState(false);
  const [mobileMenuOpen,   setMobileMenuOpen]   = useState(false);
  const [_darkMode]        = useState(true);

  // Drag
  const [isDragging,  setIsDragging]  = useState<string | null>(null);
  const [dragOffset,  setDragOffset]  = useState({ x: 0, y: 0 });

  // Live system sim (enhanced for WebSocket)
  const [stats, setStats] = useState({
    cpu: 14,
    ram: 34.2,
    nodes: 1402,
    net: 8.4,
    cpuCores: 8,
    cpuModel: 'Unknown',
    totalMem: 16,
    freeMem: 10,
    uptime: 0,
    hostname: 'aethelis-node',
    wsConnected: false
  });
  const [cpuH,  setCpuH]  = useState<number[]>([10,14,11,18,14,12,16,14,13,15,14]);
  const [netH,  setNetH]  = useState<number[]>([6,8,5,9,7,8,6,9,8,7,8]);

  // DB State
  const [events,     setEvents]     = useState<SystemEvent[]>([]);
  const [ledger,     setLedger]     = useState<LedgerTransaction[]>([]);
  const [logistics,  setLogistics]  = useState<LogisticsOrder[]>([]);
  const [modules,    setModules]    = useState<MarketModule[]>([]);
  const [dbLoading,  setDbLoading]  = useState(true);

  // App-specific
  const [enterpriseTab,  setEnterpriseTab]  = useState<'Logistics'|'CRM'|'Wealth'|'System'>('Logistics');
  const [vaultUnlocked,  setVaultUnlocked]  = useState(false);
  const [scanProgress,   setScanProgress]   = useState(false);
  const [emulatorEnv,    setEmulatorEnv]    = useState('iOS');
  const [emulatorBooted, setEmulatorBooted] = useState(false);
  const [termInput,      setTermInput]      = useState('');
  const [termHistory,    setTermHistory]    = useState<TermLog[]>([
    { type: 'sys',  text: 'Aethelis Planetary Kernel [v10.0.0-Vision]' },
    { type: 'sys',  text: 'Proprietorship: Evolution Sphere Pvt Ltd.' },
    { type: 'info', text: 'Type "help" for available commands.' },
  ]);
  const [cmdIndex,      setCmdIndex]      = useState(-1);
  const [cmdHistory,    setCmdHistory]    = useState<string[]>([]);
  const [ledgerForm,    setLedgerForm]    = useState({ label: '', amount: '', direction: 'in', type: 'transfer' });
  const [showLedgerAdd, setShowLedgerAdd] = useState(false);
  const [logisticsForm, setLogisticsForm] = useState({ node_id: '', route: '', delta: '' });
  const [showLogAdd,    setShowLogAdd]    = useState(false);

  // Files App State
  const [currentPath,   setCurrentPath]   = useState('/home');
  const [selectedFile,  setSelectedFile]  = useState<string | null>(null);

  // Settings App State
  const [settingsTab,    setSettingsTab]   = useState<'General'|'Display'|'Sound'|'Network'|'Privacy'>('General');
  const [volume,         setVolume]        = useState(75);
  const [brightness,     setBrightness]    = useState(80);
  const [notifications,  setNotifications] = useState(true);
  const [darkMode,       setDarkMode]      = useState(true);

  // Oracle AI State
  const [oracleInput,    setOracleInput]   = useState('');
  const [oracleMessages, setOracleMessages] = useState<Array<{ role: 'user' | 'oracle'; text: string }>>([
    { role: 'oracle', text: 'I am the Oracle of Aethelis. Ask, and the prophetic circuits shall reveal.' }
  ]);
  const [oracleLoading,  setOracleLoading] = useState(false);

  const termEndRef = useRef<HTMLDivElement>(null);
  const oracleEndRef = useRef<HTMLDivElement>(null);

  // ─── Fetch DB ────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    setDbLoading(true);
    try {
      const [ev, led, log, mod] = await Promise.all([
        supabase.from('system_events').select('*').order('created_at', { ascending: false }).limit(20),
        supabase.from('ledger_transactions').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('logistics_orders').select('*').order('created_at', { ascending: false }),
        supabase.from('market_modules').select('*').order('module_name'),
      ]);
      if (ev.data)  setEvents(ev.data as SystemEvent[]);
      if (led.data) setLedger(led.data as LedgerTransaction[]);
      if (log.data) setLogistics(log.data as LogisticsOrder[]);
      if (mod.data) setModules(mod.data as MarketModule[]);
    } catch {
      // Network error — UI shows empty states gracefully
    } finally {
      setDbLoading(false);
    }
  }, []);

  // ─── Initialization ──────────────────────────────────────────────

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);

    const timer = setInterval(() => setTime(new Date()), 1000);

    // WebSocket connection for live telemetry
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connectWebSocket = () => {
      try {
        ws = new WebSocket('ws://localhost:8080');

        ws.onopen = () => {
          console.log('[WS] Connected to telemetry daemon');
          setStats(p => ({ ...p, wsConnected: true }));
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'telemetry' && msg.data) {
              const t = msg.data;
              setStats(p => ({
                ...p,
                cpu: parseFloat(t.cpu?.usage || p.cpu),
                ram: parseFloat(t.memory?.usagePercent || p.ram),
                totalMem: t.memory?.total || p.totalMem,
                freeMem: t.memory?.free || p.freeMem,
                cpuCores: t.cpu?.cores || p.cpuCores,
                cpuModel: t.cpu?.model?.split(' ')[0] || p.cpuModel,
                uptime: t.system?.uptime || p.uptime,
                hostname: t.system?.hostname || p.hostname,
                nodes: (t.network?.connections || 0) + 1400,
                net: parseFloat((Math.random() * 6 + 5).toFixed(1))
              }));
              setCpuH(h => [...h.slice(-15), parseFloat(t.cpu?.usage || 14)]);
              setNetH(h => [...h.slice(-15), parseFloat((Math.random() * 6 + 5).toFixed(1))]);
            }
          } catch (e) {
            console.error('[WS] Parse error:', e);
          }
        };

        ws.onclose = () => {
          console.log('[WS] Disconnected from telemetry daemon');
          setStats(p => ({ ...p, wsConnected: false }));
          // Reconnect after 3 seconds
          reconnectTimer = setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = () => {
          console.log('[WS] Connection failed - using simulated data');
          setStats(p => ({ ...p, wsConnected: false }));
        };
      } catch (e) {
        console.log('[WS] WebSocket not available - using simulated data');
      }
    };

    // Try WebSocket first, fallback to simulation
    connectWebSocket();

    // Fallback simulation timer (used when WS not available)
    const statTimer = setInterval(() => {
      setStats(p => {
        if (p.wsConnected) return p; // Don't simulate if connected
        const cpu = Math.floor(Math.random() * 22) + 8;
        const net = parseFloat((Math.random() * 6 + 5).toFixed(1));
        return {
          ...p,
          cpu, ram: parseFloat((Math.random() * 5 + 32).toFixed(1)),
          nodes: Math.floor(Math.random() * 8) + 1400,
          net,
          uptime: p.uptime + 2
        };
      });
      if (!stats.wsConnected) {
        setCpuH(h => [...h.slice(-15), Math.floor(Math.random() * 22) + 8]);
        setNetH(h => [...h.slice(-15), parseFloat((Math.random() * 6 + 5).toFixed(1))]);
      }
    }, 2500);

    fetchAll();
    openApp(APPS.DASHBOARD);

    return () => {
      window.removeEventListener('resize', checkMobile);
      clearInterval(timer);
      clearInterval(statTimer);
      if (ws) ws.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { termEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [termHistory]);
  useEffect(() => { oracleEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [oracleMessages]);

  // ─── Emulator boot simulation ────────────────────────────────────

  useEffect(() => {
    setEmulatorBooted(false);
    const t = setTimeout(() => setEmulatorBooted(true), 2800);
    return () => clearTimeout(t);
  }, [emulatorEnv]);

  // ─── Window Management ────────────────────────────────────────────

  const windowsRef = useRef<WindowState[]>([]);
  useEffect(() => { windowsRef.current = windows; }, [windows]);

  const openApp = (app: AppConfig) => {
    setLaunchpadOpen(false);
    setMobileMenuOpen(false);
    const currentWindows = windowsRef.current;
    const currentMinimized = minimized;

    if (currentMinimized.includes(app.id)) {
      setMinimized(p => p.filter(id => id !== app.id));
      bringToFront(app.id); return;
    }
    if (currentWindows.find(w => w.id === app.id)) {
      if (activeWindowId === app.id) toggleMinimize(app.id);
      else bringToFront(app.id);
      return;
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const shouldMaximize = vw < 1100;
    const idx = currentWindows.length;
    const winW = Math.min(900, vw - 20);
    const winH = Math.min(600, vh - 140);
    const spawnX = shouldMaximize ? 0 : Math.max(20, Math.min(60 + idx * 24, vw - winW - 20));
    const spawnY = shouldMaximize ? 0 : Math.max(40, Math.min(36 + idx * 24, vh - winH - 100));

    setWindows(p => [...p, {
      ...app,
      x: spawnX, y: spawnY,
      width: winW, height: winH,
      isMaximized: shouldMaximize,
      zIndex: p.length > 0 ? Math.min(Math.max(...p.map(w => w.zIndex)) + 1, 90) : 10,
    }]);
    setActiveWindowId(app.id);
  };

  const closeWindow = (id: string) => {
    setWindows(p => p.filter(w => w.id !== id));
    setMinimized(p => p.filter(m => m !== id));
    if (activeWindowId === id) setActiveWindowId(null);
    if (id === 'vault') setVaultUnlocked(false);
  };

  const toggleMaximize = (id: string) => {
    setWindows(p => p.map(w => w.id === id ? { ...w, isMaximized: !w.isMaximized } : w));
    bringToFront(id);
  };

  const toggleMinimize = (id: string) => {
    if (minimized.includes(id)) {
      setMinimized(p => p.filter(m => m !== id));
      bringToFront(id);
    } else {
      setMinimized(p => [...p, id]);
      if (activeWindowId === id) setActiveWindowId(null);
    }
  };

  const bringToFront = (id: string) => {
    setWindows(p => {
      const maxZ = p.length > 0 ? Math.max(...p.map(w => w.zIndex)) : 10;
      return p.map(w => w.id === id ? { ...w, zIndex: Math.min(maxZ + 1, 90) } : w);
    });
    setActiveWindowId(id);
  };

  // ─── Drag ────────────────────────────────────────────────────────

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    const win = windows.find(w => w.id === id);
    if (!win || win.isMaximized || isMobile) return;
    e.preventDefault();
    bringToFront(id);
    setIsDragging(id);
    setDragOffset({ x: e.clientX - win.x, y: e.clientY - win.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || isMobile) return;
    const nx = Math.max(0, Math.min(e.clientX - dragOffset.x, window.innerWidth - 120));
    const ny = Math.max(36, Math.min(e.clientY - dragOffset.y, window.innerHeight - 120));
    setWindows(p => p.map(w => w.id === isDragging ? { ...w, x: nx, y: ny } : w));
  };

  const handleMouseUp = () => setIsDragging(null);

  // ─── Terminal ────────────────────────────────────────────────────

  const handleTermKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(cmdIndex + 1, cmdHistory.length - 1);
      setCmdIndex(next);
      setTermInput(cmdHistory[next] ?? '');
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.max(cmdIndex - 1, -1);
      setCmdIndex(next);
      setTermInput(next === -1 ? '' : cmdHistory[next]);
      return;
    }
    if (e.key !== 'Enter' || !termInput.trim()) return;
    const cmd = termInput.trim().toLowerCase();
    setCmdHistory(h => [cmd, ...h]);
    setCmdIndex(-1);
    const next: TermLog[] = [...termHistory, { type: 'user', text: `root@aethelis:~$ ${termInput.trim()}` }];
    switch (cmd) {
      case 'help':
        next.push({ type: 'info', text: 'Available commands:' });
        next.push({ type: 'info', text: '  status    — planetary node summary' });
        next.push({ type: 'info', text: '  nodes     — active bridge device count' });
        next.push({ type: 'info', text: '  uptime    — kernel uptime & version' });
        next.push({ type: 'info', text: '  net       — network throughput' });
        next.push({ type: 'info', text: '  scan      — initiate subnet scan' });
        next.push({ type: 'info', text: '  ledger    — last 3 transactions' });
        next.push({ type: 'info', text: '  clear     — clear terminal' });
        break;
      case 'status':
        next.push({ type: 'sys', text: `NODES: ${stats.nodes} | CPU: ${stats.cpu}% | RAM: ${stats.ram}GB | BRIDGE: OPTIMAL` });
        break;
      case 'nodes':
        next.push({ type: 'sys', text: `Active devices: ${stats.nodes} | Synced: ${stats.nodes - 3} | Offline: 3` });
        break;
      case 'uptime':
        next.push({ type: 'sys', text: 'Kernel: v10.0.0-Vision | Uptime: 99.97% | Load: 0.42' });
        break;
      case 'net':
        next.push({ type: 'sys', text: `Throughput: ${stats.net} Gb/s | Latency: 2ms | Packet loss: 0.00%` });
        break;
      case 'scan':
        next.push({ type: 'info', text: 'Initiating subnet scan... routing through Nexus bridge.' });
        next.push({ type: 'sys', text: '12 nodes detected. 10 secured. 2 flagged.' });
        break;
      case 'ledger':
        ledger.slice(0, 3).forEach(tx => {
          next.push({ type: 'sys', text: `  ${tx.direction === 'in' ? '+' : '-'}${tx.amount} ${tx.asset}  ${tx.label}` });
        });
        break;
      case 'clear':
        setTermHistory([]);
        setTermInput('');
        return;
      default:
        next.push({ type: 'err', text: `bash: ${cmd}: command not found. Type "help" for commands.` });
    }
    setTermHistory(next);
    setTermInput('');
  };

  // ─── DB Actions ──────────────────────────────────────────────────

  const addLedgerTx = async () => {
    if (!ledgerForm.label || !ledgerForm.amount) return;
    const { data, error } = await supabase.from('ledger_transactions').insert({
      type: ledgerForm.type as LedgerTransaction['type'],
      asset: 'ATH',
      amount: parseFloat(ledgerForm.amount),
      direction: ledgerForm.direction as 'in' | 'out',
      label: ledgerForm.label,
    }).select().single();
    if (!error && data) {
      setLedger(p => [data as LedgerTransaction, ...p]);
      setLedgerForm({ label: '', amount: '', direction: 'in', type: 'transfer' });
      setShowLedgerAdd(false);
    }
  };

  const deleteLedgerTx = async (id: string) => {
    await supabase.from('ledger_transactions').delete().eq('id', id);
    setLedger(p => p.filter(t => t.id !== id));
  };

  const addLogisticsOrder = async () => {
    if (!logisticsForm.node_id || !logisticsForm.route || !logisticsForm.delta) return;
    const { data, error } = await supabase.from('logistics_orders').insert({
      node_id: logisticsForm.node_id,
      route: logisticsForm.route,
      delta: parseFloat(logisticsForm.delta),
      status: 'pending',
    }).select().single();
    if (!error && data) {
      setLogistics(p => [data as LogisticsOrder, ...p]);
      setLogisticsForm({ node_id: '', route: '', delta: '' });
      setShowLogAdd(false);
    }
  };

  const updateLogisticsStatus = async (id: string, status: LogisticsOrder['status']) => {
    await supabase.from('logistics_orders').update({ status }).eq('id', id);
    setLogistics(p => p.map(o => o.id === id ? { ...o, status } : o));
  };

  const toggleModule = async (mod: MarketModule) => {
    const installed = !mod.installed;
    await supabase.from('market_modules').update({ installed, installed_at: installed ? new Date().toISOString() : null }).eq('id', mod.id);
    setModules(p => p.map(m => m.id === mod.id ? { ...m, installed, installed_at: installed ? new Date().toISOString() : null } : m));
  };

  const addSystemEvent = async (msg: string, cat: SystemEvent['category']) => {
    const { data } = await supabase.from('system_events').insert({ category: cat, message: msg, severity: 'info' }).select().single();
    if (data) setEvents(p => [data as SystemEvent, ...p]);
  };

  // ─── Oracle AI Handler ─────────────────────────────────────────────────

  const handleOracleSubmit = async () => {
    if (!oracleInput.trim() || oracleLoading) return;
    const userMsg = oracleInput.trim();
    setOracleInput('');
    setOracleMessages(p => [...p, { role: 'user', text: userMsg }]);
    setOracleLoading(true);

    // Simulated AI responses (replace with real Gemini API if configured)
    const responses = [
      "The circuits foresee a convergence of sovereign protocols. Your query echoes through the planetary mesh.",
      "In the shadow of obsolete giants, a new architecture rises. The answer you seek lies in decentralization.",
      "The void-protocols have analyzed your request. Execute with precision, and the network shall reward.",
      "Through the bio-pulse resonance, I divine: Your path aligns with the zero-staff paradigm.",
      "The ledger trembles with anticipation. Your vision shall manifest through automated workflows.",
    ];

    await new Promise(r => setTimeout(r, 1500 + Math.random() * 1000));
    setOracleMessages(p => [...p, { role: 'oracle', text: responses[Math.floor(Math.random() * responses.length)] }]);
    setOracleLoading(false);
    addSystemEvent('Oracle query processed', 'system');
  };

  // ─── App Content ─────────────────────────────────────────────────

  const renderApp = (id: string) => {
    switch (id) {

      // ── Dashboard ──────────────────────────────────────────────────
      case 'dashboard': return (
        <div className="p-3 sm:p-5 h-full flex flex-col gap-3 sm:gap-4 bg-slate-950/92 text-white overflow-y-auto">
          {/* Header with connection status */}
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 shrink-0">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-[9px] uppercase tracking-[0.22em] text-sky-400/70">{stats.hostname}</p>
                {stats.wsConnected ? (
                  <span className="flex items-center gap-1 text-[8px] text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    LIVE
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[8px] text-amber-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    SIM
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extralight">Atmosphere <span className="font-semibold text-sky-400">Control</span></h1>
              <p className="text-white/35 text-[10px] mt-0.5">{stats.nodes.toLocaleString()} nodes · Uptime: {Math.floor(stats.uptime / 60)}m</p>
            </div>
            <div className="flex gap-3 sm:gap-5 shrink-0 overflow-x-auto pb-2 lg:pb-0">
              <Gauge value={parseFloat(stats.cpu.toFixed(1))} max={100} color="#38bdf8" label="CPU%" />
              <Gauge value={Math.round(stats.ram)} max={100} color="#a78bfa" label="RAM%" />
              <Gauge value={Math.round(stats.net * 10)} max={150} color="#34d399" label="NET" />
            </div>
          </div>

          {/* Primary stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 shrink-0">
            {[
              { label: 'CPU Cores', value: stats.cpuCores, icon: Cpu, color: '#38bdf8' },
              { label: 'Total RAM', value: `${stats.totalMem} GB`, icon: HardDrive, color: '#a78bfa' },
              { label: 'Free RAM', value: `${stats.freeMem} GB`, icon: Server, color: '#34d399' },
              { label: 'Integrity', value: '99.97%', icon: Shield, color: '#fb923c' },
            ].map(c => { const CI = c.icon; return (
              <div key={c.label} className="card-glass rounded-xl sm:rounded-2xl p-3 sm:p-4 min-h-[80px] sm:min-h-[90px]">
                <div className="flex items-center justify-between mb-2">
                  <CI size={14} style={{ color: c.color }} />
                  <TrendingUp size={10} className="text-emerald-400" />
                </div>
                <div className="text-lg sm:text-xl font-light" style={{ color: c.color }}>{c.value}</div>
                <div className="text-[8px] sm:text-[9px] uppercase tracking-widest text-white/35 mt-1">{c.label}</div>
              </div>
            );})}
          </div>

          {/* Charts section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3 shrink-0">
            <div className="card-glass rounded-xl sm:rounded-2xl p-3 sm:p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[9px] uppercase tracking-widest text-white/40">CPU Load</span>
                <span className="text-[9px] font-mono text-sky-400">{stats.cpu.toFixed(1)}%</span>
              </div>
              <Sparkline data={cpuH} color="#38bdf8" h={40} />
            </div>
            <div className="card-glass rounded-xl sm:rounded-2xl p-3 sm:p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[9px] uppercase tracking-widest text-white/40">Network I/O</span>
                <span className="text-[9px] font-mono text-emerald-400">{stats.net} Gb/s</span>
              </div>
              <Sparkline data={netH} color="#34d399" h={40} />
            </div>
          </div>

          {/* Event stream */}
          <div className="flex-1 card-glass rounded-xl sm:rounded-2xl p-3 sm:p-4 flex flex-col min-h-[120px] sm:min-h-[130px]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[9px] uppercase tracking-widest text-white/40">Live Event Stream</span>
              </div>
              <button onClick={fetchAll} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-white/30 hover:text-white/60 active:scale-95 transition-all">
                <RefreshCw size={14} />
              </button>
            </div>
            <div className="space-y-1.5 flex-1 overflow-y-auto">
              {dbLoading ? (
                <p className="text-white/20 text-[9px] font-mono">Fetching events…</p>
              ) : events.slice(0, 10).map(ev => (
                <div key={ev.id} className="flex items-start gap-2 sm:gap-3 py-1.5 border-b border-white/[0.04] last:border-0">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${ev.severity === 'critical' ? 'bg-red-400' : ev.severity === 'warn' ? 'bg-amber-400' : 'bg-emerald-400'}`}></div>
                  <span className="text-white/25 font-mono text-[8px] w-12 sm:w-14 shrink-0 pt-0.5">{new Date(ev.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>
                  <span className="text-white/55 text-[9px] sm:text-[10px] leading-relaxed flex-1">{ev.message}</span>
                  <span className={`text-[8px] uppercase shrink-0 hidden sm:inline ${ev.category === 'security' ? 'text-red-400' : ev.category === 'ledger' ? 'text-amber-400' : 'text-sky-400'}`}>{ev.category}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

      // ── Manifesto ──────────────────────────────────────────────────
      case 'manifesto': return (
        <div className="h-full bg-slate-950/95 text-white overflow-y-auto">
          <div className="relative">
            {/* Hero Section - Mobile responsive */}
            <div className="relative overflow-hidden px-4 sm:px-8 py-8 sm:py-12 text-center"
              style={{ background: 'linear-gradient(180deg, rgba(244,63,94,0.15) 0%, transparent 100%)' }}>
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-20 -left-20 w-64 sm:w-96 h-64 sm:h-96 bg-rose-500/10 rounded-full blur-3xl"></div>
                <div className="absolute -top-10 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
              </div>
              <div className="relative z-10">
                <BookOpen size={36} className="mx-auto mb-4 sm:mb-6 text-rose-400/80" />
                <h1 className="text-2xl sm:text-4xl font-extralight tracking-widest mb-2 sm:mb-3">
                  <span className="text-rose-400">AETHELIS</span> MANIFESTO
                </h1>
                <p className="text-white/40 text-xs sm:text-sm tracking-wide max-w-md mx-auto px-4">
                  The founding principles of a sovereign digital civilization
                </p>
              </div>
            </div>

            {/* Content - Mobile responsive */}
            <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-4xl mx-auto">
              {/* Mission */}
              <div className="card-glass rounded-xl sm:rounded-2xl p-5 sm:p-8 mb-4 sm:mb-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <Target size={18} className="text-rose-400" />
                  <h2 className="text-[11px] sm:text-xs font-bold tracking-widest uppercase text-rose-400">Mission</h2>
                </div>
                <blockquote className="text-base sm:text-xl font-light leading-relaxed text-white/85 border-l-2 border-rose-500/50 pl-4 sm:pl-6">
                  "Absolute Displacement. Rendering global giants obsolete through decentralized, solo-driven architecture."
                </blockquote>
              </div>

              {/* Vision */}
              <div className="card-glass rounded-xl sm:rounded-2xl p-5 sm:p-8 mb-4 sm:mb-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <Compass size={18} className="text-purple-400" />
                  <h2 className="text-[11px] sm:text-xs font-bold tracking-widest uppercase text-purple-400">Vision</h2>
                </div>
                <blockquote className="text-base sm:text-xl font-light leading-relaxed text-white/85 border-l-2 border-purple-500/50 pl-4 sm:pl-6">
                  "The Zero-Staff Paradigm. Operating a planetary-scale empire using automated agentic workflows and dynamic hardware allocation."
                </blockquote>
              </div>

              {/* Core Tenets - Stack on mobile */}
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                {[
                  { title: 'Resource Hijacking', desc: 'Commandeer existing infrastructure without permission.', icon: Zap, color: 'text-amber-400' },
                  { title: 'Economic Autonomy', desc: 'Build self-sustaining revenue loops that require no external validation.', icon: Coins, color: 'text-emerald-400' },
                  { title: 'Void-Protocols', desc: 'Operate in the shadows. No staff, no office, no trace.', icon: Crosshair, color: 'text-red-400' },
                ].map(tenet => {
                  const TI = tenet.icon;
                  return (
                    <div key={tenet.title} className="card-glass rounded-lg sm:rounded-xl p-4 sm:p-5 active:border-white/20 transition-all">
                      <div className="flex items-start gap-3">
                        <TI size={20} className={`mt-0.5 ${tenet.color}`} />
                        <div>
                          <h3 className="text-sm font-semibold text-white/90 mb-1">{tenet.title}</h3>
                          <p className="text-[10px] sm:text-[11px] text-white/50 leading-relaxed">{tenet.desc}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Signature */}
              <div className="mt-6 sm:mt-8 text-center">
                <p className="text-[8px] sm:text-[9px] text-white/30 tracking-widest uppercase">
                  Proprietorship: Evolution Sphere Pvt Ltd
                </p>
              </div>
            </div>
          </div>
        </div>
      );

      // ── Oracle (Gemini AI) ──────────────────────────────────────────────────
      case 'oracle': return (
        <div className="h-full flex flex-col bg-gradient-to-b from-purple-950/30 to-slate-950/95 text-white">
          {/* Header - Mobile responsive */}
          <div className="shrink-0 p-3 sm:p-4 border-b border-white/[0.07]">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
                  <Sparkles size={18} className="text-white sm:text-[20px]" />
                </div>
                <div className="absolute -inset-1 rounded-lg sm:rounded-xl bg-purple-500/20 blur-md -z-10"></div>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold">Gemini Oracle</h2>
                <p className="text-[9px] text-white/40 truncate">Prophetic AI Interface</p>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[9px] text-emerald-400 hidden sm:inline">Connected</span>
              </div>
            </div>
          </div>

          {/* Messages - Better mobile spacing */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
            {oracleMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] sm:max-w-[80%] rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 ${
                  msg.role === 'user'
                    ? 'bg-purple-600/30 border border-purple-500/20'
                    : 'bg-white/[0.04] border border-white/[0.07]'
                }`}>
                  {msg.role === 'oracle' && (
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                      <Sparkles size={11} className="text-purple-400" />
                      <span className="text-[8px] sm:text-[9px] font-semibold text-purple-400 uppercase tracking-wider">Oracle</span>
                    </div>
                  )}
                  <p className="text-[11px] sm:text-[11px] leading-relaxed text-white/85">{msg.text}</p>
                </div>
              </div>
            ))}
            {oracleLoading && (
              <div className="flex justify-start">
                <div className="bg-white/[0.04] border border-white/[0.07] rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                    <span className="text-[9px] text-white/40">Divining...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={oracleEndRef} />
          </div>

          {/* Input - Touch friendly */}
          <div className="shrink-0 p-3 sm:p-4 border-t border-white/[0.07]">
            <div className="flex gap-2">
              <input
                type="text"
                value={oracleInput}
                onChange={e => setOracleInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleOracleSubmit()}
                placeholder="Ask the Oracle..."
                className="flex-1 input-glass rounded-lg sm:rounded-xl px-3 sm:px-4 py-3 text-sm sm:text-[11px] text-white/85 placeholder-white/30 outline-none min-h-[44px]"
                disabled={oracleLoading}
              />
              <button
                onClick={handleOracleSubmit}
                disabled={oracleLoading || !oracleInput.trim()}
                className="btn-glass bg-purple-600/30 active:bg-purple-500/50 disabled:opacity-40 rounded-lg sm:rounded-xl px-4 py-3 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <Send size={18} className="text-purple-300" />
              </button>
            </div>
          </div>
        </div>
      );

      // ── Enterprise ─────────────────────────────────────────────────
      case 'enterprise': {
        const tabs: Array<'Logistics'|'CRM'|'Wealth'|'System'> = ['Logistics','CRM','Wealth','System'];
        const tabIcons = { Logistics: Globe, CRM: Users, Wealth: BarChart3, System: Database };
        return (
          <div className="h-full flex flex-col bg-slate-950/92 text-white">
            {/* Mobile: Horizontal scrollable tabs */}
            <div className="shrink-0 bg-white/[0.025] border-b border-white/[0.07] p-2 sm:p-3 md:p-4 pb-2 md:pb-4">
              <div className="flex gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar">
                {tabs.map(t => {
                  const TI = tabIcons[t];
                  const active = enterpriseTab === t;
                  return (
                    <button key={t} onClick={() => setEnterpriseTab(t)}
                      className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-[10px] font-medium transition-all shrink-0 min-h-[44px] ${
                        active ? 'bg-violet-500/15 text-violet-300 border border-violet-500/30' : 'text-white/50 border border-transparent active:bg-white/[0.05]'
                      }`}>
                      <TI size={14} className={active ? 'text-violet-400' : 'text-white/30'} />
                      <span>{t}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-3 sm:p-5 md:p-6 flex flex-col overflow-y-auto gap-4">
              <div className="flex justify-between items-center shrink-0">
                <h2 className="text-lg sm:text-xl font-light text-white/85">{enterpriseTab}</h2>
                {enterpriseTab === 'Logistics' && (
                  <button onClick={() => setShowLogAdd(p => !p)}
                    className="flex items-center gap-1.5 bg-violet-600 active:bg-violet-500 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-[10px] font-semibold transition-all min-h-[44px]">
                    <Plus size={14} className="sm:hidden"/><Plus size={11} className="hidden sm:inline"/>
                    <span className="hidden sm:inline">Add Order</span>
                    <span className="sm:hidden">Add</span>
                  </button>
                )}
              </div>

              {enterpriseTab === 'Logistics' && (
                <>
                  {showLogAdd && (
                    <div className="card-glass rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {(['node_id','route','delta'] as const).map(f => (
                        <input key={f} placeholder={f === 'delta' ? 'Delta (₹)' : f === 'node_id' ? 'Node ID (e.g. TRX-0050)' : 'Route description'}
                          value={logisticsForm[f]}
                          onChange={e => setLogisticsForm(p => ({...p, [f]: e.target.value}))}
                          className="input-glass rounded-lg px-3 py-2 text-[10px] text-white/80 placeholder-white/25 outline-none" />
                      ))}
                      <button onClick={addLogisticsOrder} className="sm:col-span-3 btn-glass bg-violet-600/80 hover:bg-violet-500/90 text-white py-2 rounded-lg text-[10px] font-semibold transition-all">Create Order</button>
                    </div>
                  )}
                  <div className="card-glass rounded-2xl overflow-hidden flex-1">
                    <div className="overflow-x-auto">
                      <table className="w-full text-[10px] text-left">
                        <thead className="bg-white/[0.03] border-b border-white/[0.06] text-white/35">
                          <tr>{['Node ID','Route','Delta','Status','Actions'].map(h=><th key={h} className="p-3.5 font-medium uppercase tracking-wider">{h}</th>)}</tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                          {logistics.map(o => (
                            <tr key={o.id} className="hover:bg-white/[0.025] transition-colors">
                              <td className="p-3.5 font-mono text-violet-400">{o.node_id}</td>
                              <td className="p-3.5 text-white/60">{o.route}</td>
                              <td className={`p-3.5 font-mono ${o.delta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{o.delta >= 0 ? '+' : ''}{o.currency}{Math.abs(o.delta).toLocaleString()}</td>
                              <td className="p-3.5">
                                <select value={o.status} onChange={e => updateLogisticsStatus(o.id, e.target.value as LogisticsOrder['status'])}
                                  className={`text-[9px] font-bold px-2 py-1 rounded-lg border bg-transparent cursor-pointer outline-none ${STATUS_META[o.status].cls}`}>
                                  {Object.keys(STATUS_META).map(s=><option key={s} value={s} className="bg-slate-900 text-white">{STATUS_META[s].label}</option>)}
                                </select>
                              </td>
                              <td className="p-3.5">
                                <button onClick={() => setLogistics(p=>p.filter(x=>x.id!==o.id))} className="text-white/20 hover:text-red-400 transition-colors"><Trash2 size={11}/></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {logistics.length === 0 && <p className="text-center text-white/20 text-[10px] py-8">No orders. Add one above.</p>}
                    </div>
                  </div>
                </>
              )}

              {enterpriseTab === 'CRM' && (
                <div className="space-y-3">
                  {[
                    { name: 'Arjun Mehra',    role: 'Enterprise Client', status: 'Active',   revenue: '₹4.2L', avatar: 'AM' },
                    { name: 'Sneha Kapoor',   role: 'Logistics Partner', status: 'Pending',  revenue: '₹1.8L', avatar: 'SK' },
                    { name: 'Ravi Shankar',   role: 'NFT Collector',     status: 'Inactive', revenue: '₹9.1L', avatar: 'RS' },
                    { name: 'Priya Nair',     role: 'Media Client',      status: 'Active',   revenue: '₹3.4L', avatar: 'PN' },
                  ].map(c => (
                    <div key={c.name} className="card-glass rounded-2xl p-4 flex items-center gap-4 cursor-pointer">
                      <div className="w-9 h-9 rounded-full bg-violet-500/15 flex items-center justify-center text-violet-400 text-[10px] font-bold shrink-0">{c.avatar}</div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-white/80">{c.name}</p>
                        <p className="text-[9px] text-white/35">{c.role}</p>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${c.status === 'Active' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : c.status === 'Pending' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-white/25 bg-white/[0.03] border-white/[0.06]'}`}>{c.status}</span>
                      <span className="text-[10px] font-mono text-emerald-400">{c.revenue}</span>
                      <ChevronRight size={12} className="text-white/20" />
                    </div>
                  ))}
                </div>
              )}

              {enterpriseTab === 'Wealth' && (
                <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Liquid Assets',   value: '1,24,500', unit: 'ATH', color: 'text-amber-400' },
                    { label: 'Locked Holdings', value: '89,200',   unit: 'ATH', color: 'text-violet-400' },
                    { label: 'NFT Portfolio',   value: '42',       unit: 'items', color: 'text-sky-400' },
                    { label: 'Monthly Yield',   value: '+18.4',    unit: '%',   color: 'text-emerald-400' },
                  ].map(w => (
                    <div key={w.label} className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-5">
                      <p className="text-[9px] uppercase tracking-widest text-white/35 mb-2">{w.label}</p>
                      <p className={`text-2xl font-light ${w.color}`}>{w.value} <span className="text-xs opacity-50">{w.unit}</span></p>
                    </div>
                  ))}
                  <div className="col-span-2 bg-white/[0.04] border border-white/[0.07] rounded-2xl p-5">
                    <p className="text-[9px] uppercase tracking-widest text-white/35 mb-3">Allocation</p>
                    <div className="flex gap-1 h-3 rounded-full overflow-hidden">
                      <div className="bg-amber-400 rounded-l-full" style={{width:'45%'}}></div>
                      <div className="bg-violet-400" style={{width:'32%'}}></div>
                      <div className="bg-sky-400" style={{width:'15%'}}></div>
                      <div className="bg-emerald-400 rounded-r-full" style={{width:'8%'}}></div>
                    </div>
                    <div className="flex gap-4 mt-2.5 flex-wrap">
                      {[{c:'bg-amber-400',l:'Liquid 45%'},{c:'bg-violet-400',l:'Locked 32%'},{c:'bg-sky-400',l:'NFT 15%'},{c:'bg-emerald-400',l:'Yield 8%'}].map(d=>(
                        <div key={d.l} className="flex items-center gap-1.5"><div className={`w-2 h-2 rounded-sm ${d.c}`}></div><span className="text-[9px] text-white/40">{d.l}</span></div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {enterpriseTab === 'System' && (
                <div className="space-y-3">
                  {[
                    { name: 'elsx-crm-daemon',   cpu: 2.1, mem: 148, status: 'running' },
                    { name: 'bridge-monitor',    cpu: 0.8, mem: 64,  status: 'running' },
                    { name: 'nexus-scanner',     cpu: 4.2, mem: 312, status: 'running' },
                    { name: 'ledger-sync',       cpu: 0.3, mem: 42,  status: 'idle'    },
                    { name: 'market-scraper',    cpu: 1.7, mem: 98,  status: 'running' },
                  ].map(proc => (
                    <div key={proc.name} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 flex items-center gap-4">
                      <div className={`w-1.5 h-1.5 rounded-full ${proc.status === 'running' ? 'bg-emerald-400 animate-pulse' : 'bg-white/20'}`}></div>
                      <span className="font-mono text-[10px] text-white/70 flex-1">{proc.name}</span>
                      <span className="text-[9px] text-white/35 w-16 text-right">{proc.cpu}% CPU</span>
                      <span className="text-[9px] text-white/35 w-16 text-right">{proc.mem} MB</span>
                      <span className={`text-[8px] font-bold px-2 py-0.5 rounded ${proc.status === 'running' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/[0.04] text-white/25'}`}>{proc.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      }

      // ── Market ─────────────────────────────────────────────────────
      case 'market': {
        const META: Record<string, { desc: string; icon: React.ElementType; c: string; bg: string }> = {
          'WP Backbone':     { desc: 'Sovereign CMS Engine',          icon: Globe,      c: 'text-sky-400',    bg: 'bg-sky-500/10' },
          'Food Proxy':      { desc: 'Delivery Overlay Network',      icon: ShoppingBag,c: 'text-orange-400', bg: 'bg-orange-500/10' },
          'Media Stream':    { desc: 'Decentralized OTT Platform',    icon: Play,       c: 'text-red-400',    bg: 'bg-red-500/10' },
          'Auto-Legal':      { desc: 'Document Arbiter AI',           icon: FileText,   c: 'text-amber-400',  bg: 'bg-amber-500/10' },
          'Nexus Bridge':    { desc: 'Encrypted Subnet Router',       icon: Radio,      c: 'text-violet-400', bg: 'bg-violet-500/10' },
          'Sovereign Vault': { desc: 'Bio-linked Asset Storage',      icon: Lock,       c: 'text-emerald-400',bg: 'bg-emerald-500/10' },
        };
        return (
          <div className="p-5 md:p-7 h-full bg-slate-950/92 text-white overflow-y-auto">
            <div className="mb-5">
              <p className="text-[9px] uppercase tracking-[0.22em] text-emerald-400/70 mb-0.5">Module Marketplace</p>
              <h2 className="text-2xl font-light">Omni-Market</h2>
              <p className="text-white/30 text-[10px] mt-0.5">Deploy sovereign functionalities into your planetary OS.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {dbLoading ? <p className="text-white/20 text-[10px] col-span-2">Loading modules…</p> : modules.map(mod => {
                const meta = META[mod.module_name] ?? { desc: '', icon: Server, c: 'text-white/40', bg: 'bg-white/[0.05]' };
                const MI = meta.icon;
                return (
                  <div key={mod.id} className="bg-white/[0.04] border border-white/[0.07] p-4 rounded-2xl flex items-center gap-4 hover:border-white/15 transition-all">
                    <div className={`w-11 h-11 rounded-xl ${meta.bg} flex items-center justify-center ${meta.c} shrink-0`}><MI size={20}/></div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-xs text-white/85">{mod.module_name}</h4>
                      <p className="text-[9px] text-white/30 mt-0.5 mb-2">{meta.desc}</p>
                      <button onClick={() => toggleModule(mod)}
                        className={`px-3 py-1 rounded-lg text-[9px] font-bold flex items-center gap-1.5 transition-all border
                          ${mod.installed ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20' : 'bg-white/[0.06] hover:bg-white/[0.12] text-white/55 border-white/[0.06]'}`}>
                        {mod.installed ? <><CheckCircle size={9}/> Installed</> : <><ArrowUpRight size={9}/> Deploy</>}
                      </button>
                    </div>
                    {mod.installed_at && <span className="text-[8px] text-white/20 shrink-0">{new Date(mod.installed_at).toLocaleDateString()}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      // ── Ledger ─────────────────────────────────────────────────────
      case 'ledger': {
        const totalIn  = ledger.filter(t=>t.direction==='in').reduce((a,b)=>a+Number(b.amount),0);
        const totalOut = ledger.filter(t=>t.direction==='out').reduce((a,b)=>a+Number(b.amount),0);
        const chartData = ledger.slice(0, 12).reverse().map((_, i) => Math.floor(Math.random() * 500) + 100);
        return (
          <div className="h-full flex flex-col bg-slate-950/95 text-white overflow-hidden">
            {/* Hero Stats - Mobile responsive */}
            <div className="relative px-4 sm:px-6 py-5 sm:py-6 overflow-hidden shrink-0"
              style={{ background: 'linear-gradient(180deg, rgba(245,158,11,0.1) 0%, transparent 100%)' }}>
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-20 -right-20 w-48 sm:w-64 h-48 sm:h-64 bg-amber-500/10 rounded-full blur-3xl"></div>
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                  <Coins size={16} className="text-amber-400 sm:text-[18px]" />
                  <span className="text-[8px] sm:text-[9px] uppercase tracking-widest text-amber-400/70">Sovereign Treasury</span>
                </div>
                <div className="flex items-end gap-2 sm:gap-3">
                  <span className="text-3xl sm:text-5xl font-extralight font-mono text-white">
                    {(totalIn - totalOut).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-base sm:text-xl font-light text-amber-400/80 mb-0.5 sm:mb-2">ATH</span>
                </div>
                <p className="text-[9px] sm:text-[10px] text-white/35 mt-1 flex items-center gap-1">
                  <TrendingUp size={11} className="text-emerald-400" /> +23.4% from last epoch
                </p>
              </div>
            </div>

            {/* Quick Stats Row - 2x2 on mobile, 4 columns on desktop */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 px-4 sm:px-6 pb-4 sm:pb-5 shrink-0">
              {[
                { label: '24h Volume', value: '+4,892', color: 'text-emerald-400' },
                { label: 'Gas Fee', value: '0.0032', color: 'text-white/70' },
                { label: 'Block', value: '#19,847', color: 'text-white/70' },
                { label: 'Validators', value: '1,402', color: 'text-sky-400' },
              ].map(s => (
                <div key={s.label} className="card-glass rounded-lg sm:rounded-xl p-2.5 sm:p-3 text-center">
                  <p className="text-[7px] sm:text-[8px] uppercase text-white/40 mb-0.5 sm:mb-1">{s.label}</p>
                  <p className={`text-sm sm:text-lg font-mono ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Chart Area - Hide on very small screens or simplify */}
            <div className="px-4 sm:px-6 pb-4 sm:pb-5 shrink-0 hidden sm:block">
              <div className="card-glass rounded-lg sm:rounded-2xl p-3 sm:p-4 h-28 sm:h-32">
                <div className="flex justify-between items-center mb-1.5 sm:mb-2">
                  <span className="text-[8px] sm:text-[9px] uppercase tracking-widest text-white/40">Portfolio Performance</span>
                  <div className="flex gap-1 sm:gap-2">
                    {['1H','1D','1W'].map(p => (
                      <button key={p} className="text-[7px] sm:text-[8px] text-white/40 active:text-white px-1.5 sm:px-2 py-0.5 rounded bg-white/5">{p}</button>
                    ))}
                  </div>
                </div>
                <Sparkline data={chartData.length > 0 ? chartData : [100,150,120,180,160,200,180,220,250,280]} color="#f59e0b" h={40} />
              </div>
            </div>

            {/* Actions */}
            <div className="px-4 sm:px-6 pb-3 sm:pb-4 flex justify-between items-center shrink-0">
              <h3 className="text-[11px] sm:text-xs font-semibold text-white/70">Transactions</h3>
              <button onClick={() => setShowLedgerAdd(p => !p)}
                className="btn-glass bg-amber-600/50 active:bg-amber-500/60 text-white px-3 py-2 sm:py-1.5 rounded-lg text-[10px] sm:text-[11px] font-semibold flex items-center gap-1.5 min-h-[44px] sm:min-h-0">
                <Plus size={14} className="sm:hidden"/><Plus size={12} className="hidden sm:inline"/>
                <span className="hidden xs:inline">New</span>
              </button>
            </div>

            {/* Transaction Form */}
            {showLedgerAdd && (
              <div className="px-4 sm:px-6 pb-4 shrink-0">
                <div className="card-glass rounded-lg sm:rounded-2xl p-3 sm:p-4 border border-amber-500/30 grid grid-cols-2 gap-2 sm:gap-3">
                  <input placeholder="Label" value={ledgerForm.label} onChange={e=>setLedgerForm(p=>({...p,label:e.target.value}))}
                    className="input-glass rounded-lg px-3 py-2.5 sm:py-2 text-[10px] sm:text-[11px] text-white/80 placeholder-white/25 outline-none"
                  />
                  <input placeholder="Amount" value={ledgerForm.amount} onChange={e=>setLedgerForm(p=>({...p,amount:e.target.value}))} type="number"
                    className="input-glass rounded-lg px-3 py-2.5 sm:py-2 text-[10px] sm:text-[11px] text-white/80 placeholder-white/25 outline-none"
                  />
                  <select value={ledgerForm.direction} onChange={e=>setLedgerForm(p=>({...p,direction:e.target.value}))}
                    className="input-glass rounded-lg px-3 py-2.5 sm:py-2 text-[10px] sm:text-[11px] text-white/80 outline-none">
                    <option value="in">Inflow</option>
                    <option value="out">Outflow</option>
                  </select>
                  <button onClick={addLedgerTx} className="btn-glass bg-amber-500/80 active:bg-amber-400/90 text-white py-2.5 sm:py-2 rounded-lg text-[10px] sm:text-[11px] font-bold sm:col-span-1">
                    Execute
                  </button>
                </div>
              </div>
            )}

            {/* Transactions List */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4 sm:pb-6">
              <div className="space-y-2">
                {ledger.slice(0, 10).map(tx => (
                  <div key={tx.id} className="card-glass rounded-lg sm:rounded-xl p-3 sm:p-3 flex items-center gap-3 sm:gap-4 active:border-white/15 transition-all">
                    <div className={`w-9 h-9 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 ${tx.direction === 'in' ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                      {tx.direction === 'in' ? <ArrowDown size={16} className="text-emerald-400 sm:text-[14px]" /> : <ArrowUp size={16} className="text-red-400 sm:text-[14px]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] sm:text-[11px] text-white/80 truncate">{tx.label}</p>
                      <p className="text-[9px] text-white/35">{new Date(tx.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-sm sm:text-sm font-mono font-medium ${tx.direction === 'in' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {tx.direction === 'in' ? '+' : '-'}{Number(tx.amount).toLocaleString()}
                    </span>
                    <button onClick={() => deleteLedgerTx(tx.id)} className="text-white/25 active:text-red-400 transition-colors p-2 sm:p-1 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center">
                      <Trash2 size={14} className="sm:text-[12px]"/>
                    </button>
                  </div>
                ))}
                {ledger.length === 0 && !dbLoading && (
                  <div className="flex flex-col items-center justify-center py-12 text-white/30">
                    <Coins size={28} className="mb-2 sm:mb-3 opacity-30 sm:text-[32px]" />
                    <p className="text-[10px] sm:text-[11px]">No transactions</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      }

      // ── Emulator ───────────────────────────────────────────────────
      case 'emulator': return (
        <div className="h-full flex flex-col bg-slate-950/92 text-white p-5 gap-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 shrink-0">
            <div>
              <p className="text-[9px] uppercase tracking-[0.22em] text-cyan-400/70 mb-0.5">Virtual Environment</p>
              <h2 className="text-xl font-light flex items-center gap-2.5"><Smartphone className="text-cyan-400" size={17}/> Omni-Emulator</h2>
            </div>
            <div className="flex bg-white/[0.05] rounded-xl p-1 border border-white/[0.07] w-fit gap-1">
              {['iOS','Android','Arch Linux'].map(env => (
                <button key={env} onClick={() => setEmulatorEnv(env)}
                  className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${emulatorEnv === env ? 'bg-cyan-500 text-white shadow' : 'text-white/35 hover:text-white/70'}`}>
                  {env}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 bg-black rounded-2xl relative overflow-hidden border border-white/[0.06] flex items-center justify-center">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="w-full h-px bg-cyan-500/15 absolute animate-scan"></div>
              <div className="absolute inset-0" style={{backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,240,255,0.012) 3px,transparent 3px)',backgroundSize:'100% 4px'}}/>
            </div>

            {!emulatorBooted ? (
              <div className="text-center relative z-10 p-6">
                <div className="w-12 h-12 rounded-full border border-cyan-500/20 border-t-cyan-400 animate-spin mx-auto mb-4"></div>
                <p className="text-xs font-mono text-cyan-400 mb-1">Booting {emulatorEnv}…</p>
                <p className="text-white/20 text-[9px] font-mono">Isolating kernel — unrestricted access mode</p>
              </div>
            ) : (
              <div className="relative z-10 w-full h-full p-4 flex flex-col">
                <div className="text-[9px] font-mono text-cyan-400/60 flex items-center justify-between mb-3">
                  <span>{emulatorEnv} — Aethelis Bridge Active</span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> LIVE</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 flex-1 content-start">
                  {['Browser','Terminal','Camera','Maps','Files','Music','Settings','Network'].map(app => (
                    <button key={app} onClick={() => addSystemEvent(`Emulator: ${app} launched on ${emulatorEnv}`, 'system')}
                      className="bg-white/[0.06] border border-white/[0.08] rounded-xl p-3 flex flex-col items-center gap-2 hover:bg-white/[0.1] hover:border-cyan-500/20 transition-all group cursor-pointer">
                      <Layers size={18} className="text-cyan-400/50 group-hover:text-cyan-400 transition-colors"/>
                      <span className="text-[8px] text-white/35 group-hover:text-white/60 transition-colors">{app}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      );

      // ── Nexus ──────────────────────────────────────────────────────
      case 'nexus': return (
        <div className="h-full bg-[#030304] text-red-400 font-mono text-[10px] p-5 flex flex-col border-t-2 border-red-900/30">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-red-900/20 shrink-0">
            <h2 className="font-bold tracking-[0.2em] uppercase flex items-center gap-2">
              <ShieldAlert size={13}/> KALI-NEXUS
            </h2>
            <div className="flex items-center gap-3">
              <button onClick={() => { setScanProgress(true); setTimeout(()=>setScanProgress(false),3000); addSystemEvent('Kali-Nexus: Manual subnet scan initiated.','security'); }}
                className="flex items-center gap-1.5 border border-red-800/40 px-2.5 py-1 rounded-lg text-[9px] hover:bg-red-900/20 transition-colors">
                <RefreshCw size={9} className={scanProgress ? 'animate-spin' : ''}/> {scanProgress ? 'Scanning…' : 'Rescan'}
              </button>
              <span className="flex items-center gap-1.5 bg-red-500/8 border border-red-900/30 px-2 py-0.5 rounded text-[9px] font-bold">
                <span className="w-1 h-1 bg-red-500 rounded-full animate-pulse"></span>VOID-PROTOCOL
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 mb-4 pr-1">
            {[
              { c: 'text-white/30', t: '> Initializing planetary subnet scan…' },
              { c: 'text-emerald-400', t: '> Bridge routing established — 12 subnets enumerated.' },
              { c: 'text-amber-400/80', t: '> WARNING: 4 nodes flagged for active vulnerability exposure.' },
              { c: 'text-red-400', t: '> CVE-2024-0001 confirmed on 192.168.1.44 — remote code execution.' },
              { c: 'text-emerald-400', t: '> Auth token extraction: SUCCESS.' },
              { c: 'text-white/30', t: `> Scan complete at ${time.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}` },
            ].map((l,i) => <p key={i} className={l.c}>{l.t}</p>)}
          </div>

          <div className="grid grid-cols-2 gap-3 shrink-0">
            {[
              { ip: '192.168.1.44',  os: 'Windows 11',    vuln: 'CVE-2024-0001',   s: 'EXPOSED',  sc: 'text-red-400    border-red-900/30    bg-red-950/15' },
              { ip: '192.168.1.102', os: 'iOS 17.4',      vuln: null,              s: 'SECURE',   sc: 'text-emerald-400 border-emerald-900/30 bg-emerald-950/10' },
              { ip: '192.168.1.78',  os: 'Android 14',    vuln: 'ADB open',        s: 'AT RISK',  sc: 'text-amber-400  border-amber-900/30  bg-amber-950/10' },
              { ip: '10.0.0.1',      os: 'RouterOS 7.1',  vuln: 'Default creds',   s: 'EXPOSED',  sc: 'text-red-400    border-red-900/30    bg-red-950/15' },
            ].map(n => (
              <div key={n.ip} className={`border rounded-xl p-3 cursor-pointer hover:brightness-125 transition-all ${n.sc}`}>
                <div className="flex justify-between mb-1"><span className="text-white/55">{n.ip}</span><span className="font-bold text-[9px]">{n.s}</span></div>
                <div className="text-white/25 text-[9px]">{n.os}</div>
                {n.vuln && <div className="text-[8px] mt-1 opacity-60">{n.vuln}</div>}
              </div>
            ))}
          </div>
        </div>
      );

      // ── Vault ──────────────────────────────────────────────────────
      case 'vault':
        if (!vaultUnlocked) return (
          <div className="h-full flex flex-col items-center justify-center bg-slate-950/95 p-4 sm:p-6 relative overflow-hidden">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] rounded-full bg-violet-600/5 blur-3xl"></div>
              <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(139,92,246,0.03) 2px,transparent 4px)', backgroundSize: '100% 4px' }}></div>
            </div>
            <div className="relative mb-6 sm:mb-10">
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full border-2 border-violet-500/30 flex items-center justify-center">
                <div className="absolute inset-2 rounded-full border border-violet-400/20"></div>
                <div className="absolute inset-4 rounded-full border border-violet-400/10"></div>
                <Fingerprint size={42} className="text-violet-500/60 relative z-10 sm:text-[56px]"/>
                <div className="absolute inset-0 rounded-full animate-spin" style={{ borderTop: '2px solid rgba(139,92,246,0.4)', animationDuration: '3s' }}></div>
                <div className="absolute -inset-4 rounded-full border border-violet-400/5 animate-ping"></div>
              </div>
              <div className="absolute inset-0 rounded-full" style={{ boxShadow: 'inset 0 0 60px rgba(139,92,246,0.2)' }}></div>
            </div>
            <h2 className="text-xl sm:text-2xl font-extralight text-white/85 mb-2 tracking-wide">Bio-Pulse Vault</h2>
            <p className="text-[10px] sm:text-[11px] text-white/35 mb-6 sm:mb-10 text-center max-w-[260px] sm:max-w-[280px] leading-relaxed px-4">
              Biometric synchronization required. Retinal scan initiated.
            </p>
            <button onClick={() => setVaultUnlocked(true)}
              className="relative group min-h-[48px] sm:min-h-0 px-6 sm:px-8">
              <div className="absolute -inset-1 rounded-xl sm:rounded-2xl bg-violet-600/30 blur transition-all group-active:bg-violet-500/40"></div>
              <div className="relative btn-glass bg-violet-600/80 active:bg-violet-500/90 text-white px-6 sm:px-8 py-3 sm:py-3 rounded-xl text-[11px] sm:text-[11px] font-semibold transition-all flex items-center gap-2 border border-violet-400/30 min-h-[48px] sm:min-h-0 justify-center">
                <Eye size={16} className="sm:text-[14px]"/> <span>Retinal Sync</span>
              </div>
            </button>
            <p className="text-[8px] sm:text-[9px] text-white/20 mt-4 sm:mt-6 font-mono">PROTOCOL: VP-7749</p>
          </div>
        );
        return (
          <div className="h-full bg-slate-950/95 text-white p-3 sm:p-5 md:p-6 flex flex-col gap-3 sm:gap-4">
            <div className="flex justify-between items-center pb-2 sm:pb-3 border-b border-white/[0.07] shrink-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="relative">
                  <Unlock className="text-violet-400" size={18} />
                  <div className="absolute -inset-2 rounded-full bg-violet-400/10 blur"></div>
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-light text-white/85">Archives</h2>
                  <p className="text-[8px] sm:text-[9px] text-white/35">12 documents</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-[8px] sm:text-[9px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 sm:px-2.5 py-1 rounded flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>OPEN
                </span>
                <button onClick={() => setVaultUnlocked(false)} className="text-white/30 active:text-white/60 transition-colors p-2 sm:p-1 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center">
                  <Lock size={14}/>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 flex-1 overflow-y-auto content-start">
              {[
                { name: 'GENESIS-001', type: 'Key', locked: false },
                { name: 'ALPHA-7B', type: 'Contract', locked: false },
                { name: 'NEXUS-KEY', type: 'Key', locked: false },
                { name: 'BIO-SYN', type: 'Genetic', locked: true },
                { name: 'CORE-X9', type: 'Protocol', locked: false },
                { name: 'VAULT-0', type: 'Genesis', locked: false },
                { name: 'REALM-1', type: 'Domain', locked: false },
                { name: 'DARK-ARC', type: 'Archive', locked: true },
                { name: 'PULSE-3', type: 'Bio', locked: false },
                { name: 'NODE-99', type: 'Node', locked: false },
                { name: 'CRYPT-42', type: 'Cipher', locked: false },
                { name: 'OMEGA-K', type: 'Master', locked: true },
              ].map(doc => (
                <div key={doc.name} className={`card-glass rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer group ${doc.locked ? 'opacity-60' : ''}`}>
                  <div className="relative">
                    <FileText size={24} className="text-white/30 group-hover:text-violet-400 transition-colors" />
                    {doc.locked && <Lock size={10} className="absolute -bottom-1 -right-1 text-amber-400" />}
                  </div>
                  <span className="text-[8px] font-mono text-white/40 group-hover:text-violet-400/70 transition-colors text-center">{doc.name}</span>
                  <span className="text-[7px] uppercase text-white/25">{doc.type}</span>
                </div>
              ))}
            </div>
          </div>
        );

      // ── Kernel ─────────────────────────────────────────────────────
      case 'kernel': return (
        <div className="h-full bg-[#050505] text-[#d0d0d0] font-mono text-[10px] p-4 flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-0.5 mb-3 pr-1">
            {termHistory.map((log, i) => (
              <div key={i} className={`leading-relaxed ${log.type==='err'?'text-red-400':log.type==='info'?'text-sky-400':log.type==='sys'?'text-emerald-400':'text-white/60'}`}>
                {log.text}
              </div>
            ))}
            <div ref={termEndRef}/>
          </div>
          <div className="flex items-center gap-1.5 pt-3 border-t border-white/[0.05] shrink-0">
            <span className="text-sky-500">root</span><span className="text-white/20">@</span>
            <span className="text-violet-400">aethelis</span><span className="text-white/20">:~$</span>
            <input type="text" value={termInput} onChange={e=>setTermInput(e.target.value)} onKeyDown={handleTermKey}
              className="flex-1 bg-transparent border-none outline-none text-white/75 focus:ring-0 p-0 caret-sky-400"
              autoFocus={!isMobile} spellCheck={false} autoCapitalize="none" autoComplete="off"/>
            <span className="w-1.5 h-3.5 bg-sky-400/60 animate-pulse ml-0.5"></span>
          </div>
        </div>
      );

      // ── Files ─────────────────────────────────────────────────────
      case 'files': {
        const fileSystem: Record<string, Array<{ name: string; type: 'folder' | 'file'; size?: string; icon: React.ElementType }>> = {
          '/home': [
            { name: 'Documents', type: 'folder', icon: Folder },
            { name: 'Downloads', type: 'folder', icon: Download },
            { name: 'Pictures', type: 'folder', icon: Image },
            { name: 'Music', type: 'folder', icon: Music },
            { name: 'Videos', type: 'folder', icon: Video },
            { name: 'Projects', type: 'folder', icon: Folder },
            { name: '.config', type: 'folder', icon: Settings },
            { name: 'readme.txt', type: 'file', size: '2KB', icon: File },
          ],
          '/home/Documents': [
            { name: 'Reports', type: 'folder', icon: Folder },
            { name: 'Contracts', type: 'folder', icon: Folder },
            { name: 'Notes', type: 'folder', icon: Folder },
            { name: 'quarterly_analysis.pdf', type: 'file', size: '1.4MB', icon: FileText },
            { name: 'meeting_notes.md', type: 'file', size: '8KB', icon: File },
          ],
          '/home/Downloads': [
            { name: 'installer_v2.pkg', type: 'file', size: '45MB', icon: Download },
            { name: 'assets.zip', type: 'file', size: '128MB', icon: File },
            { name: 'screenshot.png', type: 'file', size: '2.3MB', icon: Image },
          ],
          '/home/Pictures': [
            { name: 'Screenshots', type: 'folder', icon: Folder },
            { name: 'Wallpapers', type: 'folder', icon: Folder },
            { name: 'vacation.jpg', type: 'file', size: '4.2MB', icon: Image },
          ],
          '/home/Music': [
            { name: 'Playlists', type: 'folder', icon: Folder },
            { name: 'ambient_mix.mp3', type: 'file', size: '12MB', icon: Music },
          ],
          '/home/Videos': [
            { name: 'Recordings', type: 'folder', icon: Folder },
            { name: 'demo_clip.mp4', type: 'file', size: '89MB', icon: Video },
          ],
        };
        const currentFiles = fileSystem[currentPath] || [];
        const pathParts = currentPath.split('/').filter(Boolean);
        return (
          <div className="h-full flex flex-col bg-slate-950/92 text-white">
            <div className="flex items-center justify-between p-3 border-b border-white/[0.07] shrink-0">
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentPath('/home')} className="text-white/40 hover:text-white transition-colors">
                  <Folder size={16} />
                </button>
                <div className="flex items-center text-[10px] text-white/50">
                  {pathParts.map((part, i) => (
                    <span key={i} className="flex items-center">
                      <span className="hover:text-white cursor-pointer" onClick={() => setCurrentPath('/' + pathParts.slice(0, i + 1).join('/'))}>{part}</span>
                      {i < pathParts.length - 1 && <span className="mx-1 text-white/20">/</span>}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/10 text-white/50 hover:text-white transition-all">
                  <Upload size={14} />
                </button>
                <button className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/10 text-white/50 hover:text-white transition-all">
                  <FolderPlus size={14} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {currentFiles.map(file => {
                  const FI = file.icon;
                  const isFolder = file.type === 'folder';
                  return (
                    <div
                      key={file.name}
                      className={`card-glass rounded-xl p-3 flex flex-col items-center gap-2 cursor-pointer transition-all ${selectedFile === file.name ? 'border-sky-500/30' : ''}`}
                      onClick={() => setSelectedFile(file.name)}
                      onDoubleClick={() => isFolder && setCurrentPath(`${currentPath}/${file.name}`)}
                    >
                      <FI size={28} className={isFolder ? 'text-amber-400' : 'text-white/50'} />
                      <span className="text-[9px] text-white/70 text-center truncate w-full">{file.name}</span>
                      {file.size && <span className="text-[8px] text-white/30">{file.size}</span>}
                    </div>
                  );
                })}
              </div>
              {currentFiles.length === 0 && (
                <div className="flex flex-col items-center justify-center h-48 text-white/30">
                  <FolderOpen size={32} className="mb-2 opacity-30" />
                  <span className="text-[10px]">Empty folder</span>
                </div>
              )}
            </div>
          </div>
        );
      }

      // ── Settings ─────────────────────────────────────────────────────
      case 'settings': {
        const tabs: Array<'General'|'Display'|'Sound'|'Network'|'Privacy'> = ['General','Display','Sound','Network','Privacy'];
        const tabIcons = { General: Settings, Display: Monitor, Sound: Volume2, Network: Wifi, Privacy: Shield };
        return (
          <div className="h-full flex flex-col md:flex-row bg-slate-950/92 text-white">
            <div className="w-full md:w-52 bg-white/[0.025] border-b md:border-b-0 md:border-r border-white/[0.07] p-3 md:p-4 flex flex-row md:flex-col gap-1.5 overflow-x-auto shrink-0">
              <div className="hidden md:flex items-center gap-2 mb-5 px-1">
                <div className="w-7 h-7 rounded-lg bg-gray-500/15 flex items-center justify-center">
                  <Settings size={13} className="text-gray-400"/>
                </div>
                <span className="text-xs font-semibold text-white/70">Preferences</span>
              </div>
              {tabs.map(t => {
                const TI = tabIcons[t];
                const active = settingsTab === t;
                return (
                  <button key={t} onClick={() => setSettingsTab(t)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-medium transition-all text-left shrink-0 w-full border
                      ${active ? 'bg-gray-500/15 text-gray-300 border-gray-500/20' : 'hover:bg-white/[0.04] text-white/40 border-transparent'}`}>
                    <TI size={12} className={active ? 'text-gray-400' : 'text-white/25'} />
                    {t}
                  </button>
                );
              })}
            </div>
            <div className="flex-1 p-5 md:p-7 overflow-y-auto">
              {settingsTab === 'General' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-light text-white/85 mb-4">General</h3>
                  <div className="card-glass rounded-2xl p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-white/80">Dark Mode</p>
                        <p className="text-[9px] text-white/40">Use dark appearance</p>
                      </div>
                      <button onClick={() => setDarkMode(!darkMode)}
                        className={`w-11 h-6 rounded-full transition-all relative ${darkMode ? 'bg-sky-500' : 'bg-white/10'}`}>
                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${darkMode ? 'left-6' : 'left-1'}`}></span>
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-white/80">Notifications</p>
                        <p className="text-[9px] text-white/40">Show system alerts</p>
                      </div>
                      <button onClick={() => setNotifications(!notifications)}
                        className={`w-11 h-6 rounded-full transition-all relative ${notifications ? 'bg-sky-500' : 'bg-white/10'}`}>
                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${notifications ? 'left-6' : 'left-1'}`}></span>
                      </button>
                    </div>
                  </div>
                  <div className="card-glass rounded-2xl p-4">
                    <p className="text-xs text-white/80 mb-3">About</p>
                    <div className="space-y-2 text-[10px]">
                      <div className="flex justify-between"><span className="text-white/40">OS Version</span><span className="text-white/70">Aethelis 10.0.0 Vision</span></div>
                      <div className="flex justify-between"><span className="text-white/40">Kernel</span><span className="text-white/70">Planetary Bridge v3.2</span></div>
                      <div className="flex justify-between"><span className="text-white/40">Build</span><span className="text-white/70">2026.06.29</span></div>
                    </div>
                  </div>
                </div>
              )}
              {settingsTab === 'Display' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-light text-white/85 mb-4">Display</h3>
                  <div className="card-glass rounded-2xl p-4 space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <p className="text-xs text-white/80">Brightness</p>
                        <span className="text-xs text-white/50">{brightness}%</span>
                      </div>
                      <input type="range" min="20" max="100" value={brightness} onChange={e => setBrightness(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-sky-400" />
                    </div>
                  </div>
                  <div className="card-glass rounded-2xl p-4">
                    <p className="text-xs text-white/80 mb-3">Resolution</p>
                    <div className="grid grid-cols-3 gap-2">
                      {['1920x1080','2560x1440','3840x2160'].map(res => (
                        <button key={res} className="btn-glass rounded-lg py-2 text-[9px] text-white/70 hover:text-white">
                          {res}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {settingsTab === 'Sound' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-light text-white/85 mb-4">Sound</h3>
                  <div className="card-glass rounded-2xl p-4 space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-white/80">Master Volume</p>
                        <div className="flex items-center gap-2">
                          <Volume2 size={14} className="text-white/50" />
                          <span className="text-xs text-white/50">{volume}%</span>
                        </div>
                      </div>
                      <input type="range" min="0" max="100" value={volume} onChange={e => setVolume(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-400" />
                    </div>
                    <div className="flex items-center justify-between border-t border-white/10 pt-4">
                      <p className="text-xs text-white/80">Mute</p>
                      <button className={`w-11 h-6 rounded-full transition-all relative ${volume === 0 ? 'bg-red-500' : 'bg-white/10'}`}>
                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${volume === 0 ? 'left-6' : 'left-1'}`}></span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {settingsTab === 'Network' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-light text-white/85 mb-4">Network</h3>
                  <div className="card-glass rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Wifi size={20} className="text-emerald-400" />
                        <div>
                          <p className="text-xs text-white/80">Aethelis-Bridge</p>
                          <p className="text-[9px] text-white/40">Connected</p>
                        </div>
                      </div>
                      <span className="text-xs text-emerald-400 font-medium">Active</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
                      <div>
                        <p className="text-[9px] text-white/40">IP Address</p>
                        <p className="text-[10px] text-white/70 font-mono">192.168.1.100</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-white/40">MAC Address</p>
                        <p className="text-[10px] text-white/70 font-mono">a4:83:e7:xx:xx:xx</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-white/40">Download</p>
                        <p className="text-[10px] text-white/70">125 Mbps</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-white/40">Upload</p>
                        <p className="text-[10px] text-white/70">45 Mbps</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {settingsTab === 'Privacy' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-light text-white/85 mb-4">Privacy & Security</h3>
                  <div className="card-glass rounded-2xl p-4 space-y-4">
                    {[
                      { label: 'Location Services', desc: 'Allow apps to request location', on: true },
                      { label: 'Camera Access', desc: 'Allow apps to use camera', on: true },
                      { label: 'Microphone Access', desc: 'Allow apps to use microphone', on: true },
                      { label: 'Analytics', desc: 'Share anonymous usage data', on: false },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-white/80">{item.label}</p>
                          <p className="text-[9px] text-white/40">{item.desc}</p>
                        </div>
                        <button className={`w-11 h-6 rounded-full transition-all relative ${item.on ? 'bg-sky-500' : 'bg-white/10'}`}>
                          <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${item.on ? 'left-6' : 'left-1'}`}></span>
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="card-glass rounded-2xl p-4">
                    <div className="flex items-center gap-3 text-red-400">
                      <Shield size={20} />
                      <div>
                        <p className="text-xs">Security Status</p>
                        <p className="text-[9px] text-white/40">All systems protected</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      }

      default: return null;
    }
  };

  // ─── Layout ───────────────────────────────────────────────────────────────

  const dockApps = [APPS.DASHBOARD, APPS.MANIFESTO, APPS.ENTERPRISE, APPS.LEDGER, APPS.ORACLE, APPS.VAULT, APPS.NEXUS, APPS.KERNEL];

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col select-none"
      onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>

      {/* Wallpaper */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.fineartamerica.com/images/artworkimages/mediumlarge/3/beautiful-orange-and-pastel-flowers-seamless-pattern-julien.jpg"
          alt=""
          className="w-full h-full object-cover"
          draggable={false}
          style={{ animation: 'moveBackground 60s linear infinite', backgroundSize: '500px' }}
        />
        <div className="absolute inset-0 bg-black/10"></div>
      </div>

      {/* SVG Filter for Liquid Glass */}
      <svg style={{ display: 'none' }}>
        <filter id="glass-distortion" x="0%" y="0%" width="100%" height="100%" filterUnits="objectBoundingBox">
          <feTurbulence type="fractalNoise" baseFrequency="0.01 0.01" numOctaves="1" seed="5" result="turbulence" />
          <feComponentTransfer in="turbulence" result="mapped">
            <feFuncR type="gamma" amplitude="1" exponent="10" offset="0.5" />
            <feFuncG type="gamma" amplitude="0" exponent="1" offset="0" />
            <feFuncB type="gamma" amplitude="0" exponent="1" offset="0.5" />
          </feComponentTransfer>
          <feGaussianBlur in="turbulence" stdDeviation="3" result="softMap" />
          <feSpecularLighting in="softMap" surfaceScale="5" specularConstant="1" specularExponent="100" lightingColor="white" result="specLight">
            <fePointLight x="-200" y="-200" z="300" />
          </feSpecularLighting>
          <feComposite in="specLight" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="litImage" />
          <feDisplacementMap in="SourceGraphic" in2="softMap" scale="150" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      {/* Menu Bar — Liquid Glass — Mobile Responsive */}
      <div className="relative z-[100] h-11 sm:h-10 flex items-center justify-between px-2 sm:px-3 md:px-5 shrink-0 glass-dark liquid-edge">
        {/* Left Section */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-5 text-[11px] md:text-[12px] font-medium text-white/85">
          {/* Logo */}
          <div className="flex items-center gap-1.5 sm:gap-2 font-bold cursor-pointer active:opacity-70 transition-opacity min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center">
            <div className="w-6 h-6 sm:w-5 sm:h-5 rounded-md bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center">
              <Activity size={12} strokeWidth={2.5} className="text-white"/>
            </div>
            <span className="hidden sm:inline tracking-wide">AETHELIS OS</span>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(p => !p)}
            className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center text-white/60 active:text-white active:scale-95 transition-all rounded-lg"
          >
            <Menu size={20} />
          </button>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex gap-5 text-white/40">
            {['System','Modules','Network'].map(m => (
              <span key={m} className="cursor-pointer hover:text-white/80 transition-colors relative group">
                {m}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-sky-400/60 group-hover:w-full transition-all duration-200"></span>
              </span>
            ))}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 text-white/50 text-[10px] md:text-[11px]">
          {/* Desktop Status Icons */}
          <div className="hidden sm:flex items-center gap-2 md:gap-3">
            <span className="font-mono text-sky-400/80 text-[9px] bg-sky-400/10 px-1.5 py-0.5 rounded">{stats.cpu.toFixed(0)}%</span>
            <Cpu size={12} className="hover:text-white cursor-pointer transition-colors"/>
            <Wifi size={12} className="hover:text-white cursor-pointer transition-colors"/>
            <Battery size={12} className="hover:text-white cursor-pointer transition-colors"/>
          </div>
          <span className="font-semibold text-white/85 tabular-nums text-base sm:text-[11px]">{time.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="absolute top-11 left-0 right-0 z-[95] md:hidden glass-dark border-b border-white/10">
          <div className="px-4 py-2 space-y-1">
            {['System','Modules','Network','Settings'].map(m => (
              <div key={m} className="text-white/70 text-sm py-3 px-2 cursor-pointer active:bg-white/10 rounded-lg transition-colors">{m}</div>
            ))}
            <div className="border-t border-white/10 pt-3 mt-2">
              <div className="flex items-center justify-between text-white/50 text-sm py-2">
                <span>CPU Usage</span>
                <span className="font-mono text-sky-400">{stats.cpu.toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between text-white/50 text-sm py-2">
                <span>Memory</span>
                <span className="font-mono text-violet-400">{stats.ram.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Launchpad */}
      {launchpadOpen && (
        <div className="fixed inset-0 z-[90] flex flex-col items-center justify-center p-4 sm:p-8 glass-dark" onClick={() => setLaunchpadOpen(false)}>
          {/* Search */}
          <div className="relative mb-6 w-full max-w-xs sm:max-w-sm" onClick={e=>e.stopPropagation()}>
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"/>
            <input
              placeholder="Search apps…"
              className="w-full rounded-xl pl-9 pr-4 py-3 sm:py-2.5 text-sm sm:text-[11px] text-white/80 placeholder-white/40 outline-none focus:border-white/40"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
            />
          </div>

          {/* App Grid - Mobile: 4 columns, Desktop: 4-5 columns */}
          <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-5 gap-4 sm:gap-6 md:gap-8 max-w-lg w-full px-2" onClick={e=>e.stopPropagation()}>
            {Object.values(APPS).map(app => {
              const AI = app.icon;
              return (
                <div key={app.id} onClick={()=>openApp(app)} className="flex flex-col items-center gap-2 cursor-pointer group active:scale-95 transition-transform">
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-150 group-active:scale-95 bg-gradient-to-br ${app.gradient} text-white border border-white/15`}>
                    <AI size={24}/>
                  </div>
                  <span className="text-[9px] sm:text-[10px] font-medium text-white/80 drop-shadow-sm text-center leading-tight">{app.title}</span>
                </div>
              );
            })}
          </div>

          {/* Close hint */}
          <p className="mt-6 sm:mt-10 text-white/30 text-[10px] sm:text-[11px]">Tap anywhere to close</p>
        </div>
      )}

      {/* Desktop / Window Container */}
      <div className={`flex-1 relative overflow-hidden z-10 ${isMobile ? 'pb-16' : ''}`}>
        {windows.map(win => {
          if (minimized.includes(win.id)) return null;
          const WI = win.icon;
          const active = activeWindowId === win.id;

          // Mobile: Full screen windows
          // Desktop: Positioned windows with drag
          const windowStyle = isMobile ? {
            zIndex: win.zIndex,
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
          } : {
            zIndex: win.zIndex,
            left: win.isMaximized ? 0 : win.x,
            top: win.isMaximized ? 36 : win.y,
            width: win.isMaximized ? '100%' : win.width,
            height: win.isMaximized ? 'calc(100% - 80px)' : win.height,
            transition: isDragging === win.id ? 'none' : 'left 0.22s cubic-bezier(0.2,0.8,0.2,1),top 0.22s cubic-bezier(0.2,0.8,0.2,1),width 0.22s,height 0.22s',
          };

          return (
            <div key={win.id} onMouseDown={() => bringToFront(win.id)} style={windowStyle}
              className={`absolute flex flex-col overflow-hidden
                ${active ? 'window-glass' : 'window-glass-inactive'}
                ${isMobile || win.isMaximized ? '!rounded-none border-none' : 'rounded-2xl'}
              `}>
              {/* Titlebar */}
              <div
                onMouseDown={isMobile ? undefined : e=>handleMouseDown(e,win.id)}
                onDoubleClick={isMobile ? undefined : ()=>toggleMaximize(win.id)}
                onTouchStart={isMobile ? undefined : e=>handleMouseDown(e,win.id)}
                className={`h-12 sm:h-10 flex items-center px-2 sm:px-3 cursor-default shrink-0 ${active ? 'titlebar-glass' : 'bg-transparent'}`}
              >
                {/* Traffic lights - Hidden on mobile */}
                <div className={`flex items-center gap-1.5 ${isMobile ? 'gap-2' : 'w-[60px]'}`}>
                  {[
                    { col: '#ff5f56', border: '#e0443e', action: () => closeWindow(win.id), icon: X },
                    { col: '#ffbd2e', border: '#dea123', action: () => toggleMinimize(win.id), icon: Minus },
                    { col: '#27c93f', border: '#1aab29', action: () => toggleMaximize(win.id), icon: Maximize2 },
                  ].map(btn => {
                    const BI = btn.icon;
                    return (
                      <button key={btn.col} onClick={e=>{e.stopPropagation();btn.action();}}
                        style={{ backgroundColor: btn.col, borderColor: btn.border }}
                        className={`rounded-full border flex items-center justify-center group hover:brightness-110 active:scale-90 transition-transform ${isMobile ? 'w-5 h-5' : 'w-3 h-3'}`}
                      >
                        <BI size={isMobile ? 10 : 7} className="text-black/60 opacity-0 group-hover:opacity-100"/>
                      </button>
                    );
                  })}
                </div>

                {/* Title */}
                <div className="flex-1 flex justify-center items-center gap-1.5 pointer-events-none text-sm sm:text-[10px] font-semibold text-white/70">
                  <WI size={isMobile ? 16 : 11} className={win.color}/> {win.title}
                </div>

                <div className={isMobile ? 'w-16' : 'w-[60px]'}></div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-hidden relative">
                {!active && !isMobile && <div className="absolute inset-0 z-50 cursor-default"/>}
                {renderApp(win.id)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Dock - macOS Magnification Physics */}
      {isMobile ? (
        // Mobile Dock - Fixed bottom scrollable
        <div className="fixed bottom-0 left-0 right-0 z-[200] p-2 glass-dark border-t border-white/10">
          <div className="flex gap-2 overflow-x-auto no-scrollbar px-1 py-1" style={{ scrollSnapType: 'x mandatory' }}>
            {/* Launchpad */}
            <div className="shrink-0" style={{ scrollSnapAlign: 'center' }}>
              <button onClick={()=>setLaunchpadOpen(p=>!p)} className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-95 ${launchpadOpen ? 'bg-white/25' : 'bg-white/10'}`}>
                <LayoutGrid size={22} className="text-white/80" />
              </button>
            </div>

            <div className="w-px h-10 bg-white/10 shrink-0 self-center rounded-full"></div>

            {dockApps.map(app => {
              const isOpen = !!windows.find(w => w.id === app.id && !minimized.includes(w.id));
              const AI = app.icon;
              return (
                <div key={app.id} className="shrink-0" style={{ scrollSnapAlign: 'center' }}>
                  <button onClick={() => openApp(app)} className="relative w-12 h-12 rounded-xl flex items-center justify-center active:scale-95 transition-all bg-gradient-to-br opacity-90" style={{ background: `linear-gradient(to top right, ${app.gradient.replace('from-', '').split(' ')[0].replace('to-', '')})` }}>
                    <AI size={20} className="text-white drop-shadow-lg" />
                    {isOpen && <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white"></span>}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        // Desktop Dock
        <div className="dock-container" style={{ zIndex: 200 }}>
          {/* Launchpad */}
          <div className="dock-icon" onClick={()=>setLaunchpadOpen(p=>!p)}>
            <div className={`dock-icon-inner ${launchpadOpen ? 'bg-white/30' : 'bg-white/15'}`}>
              <LayoutGrid size={20} className={launchpadOpen ? 'text-white' : 'text-white/80'} />
            </div>
            <span className="dock-text">Launchpad</span>
          </div>

          <div className="dock-separator"></div>

          {dockApps.map(app => {
            const isOpen = !!windows.find(w => w.id === app.id && !minimized.includes(w.id));
            const isMin  = minimized.includes(app.id);
            const AI     = app.icon;
            return (
              <div key={app.id} className="dock-icon" onClick={() => openApp(app)}>
                <div className={`dock-icon-inner bg-gradient-to-br ${app.gradient} ${isMin ? 'opacity-50 saturate-50' : ''}`}>
                  <AI size={20} className="text-white drop-shadow-lg" />
                </div>
                {isOpen && <span className="app-indicator"></span>}
                <span className="dock-text">{app.title}</span>
              </div>
            );
          })}

          <div className="dock-separator"></div>

          <div className="dock-icon" onClick={() => addSystemEvent('Settings panel accessed', 'system')}>
            <div className="dock-icon-inner bg-white/15">
              <Settings size={20} className="text-white/80" />
            </div>
            <span className="dock-text">Settings</span>
          </div>
        </div>
      )}

    </div>
  );
}
