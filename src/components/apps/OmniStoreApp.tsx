import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search, Filter, Grid3X3, List, Download, CheckCircle, RefreshCw,
  Globe, ShoppingBag, Play, FileText, Radio, Lock, Server, Cpu,
  Database, Users, DollarSign, Package, Receipt, Headphones, Factory,
  ShoppingCart, Monitor, Settings, Sparkles, Zap, Shield, Brain,
  Layers, Box, ChevronRight, Star, ExternalLink, Info, X, ArrowUpRight
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

type CategoryId = 'all' | 'erp' | 'finance' | 'social' | 'ai' | 'logistics' | 'security' | 'productivity';

interface StoreModule {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  version: string;
  category: CategoryId;
  icon: React.ElementType;
  color: string;
  bg: string;
  rating: number;
  downloads: string;
  installed: boolean;
  installing?: boolean;
  installProgress?: number;
  installLogs?: string[];
  features: string[];
  dependencies: string[];
  author: string;
  price: 'free' | 'premium' | 'enterprise';
  screenshots?: string[];
}

interface Props {
  installedApps: string[];
  onInstallApp: (appId: string) => void;
  onUninstallApp: (appId: string) => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// STORE MODULES CATALOG
// ═══════════════════════════════════════════════════════════════════════════════

const STORE_CATEGORIES: Array<{ id: CategoryId; label: string; icon: React.ElementType; count: number }> = [
  { id: 'all', label: 'All Apps', icon: Grid3X3, count: 18 },
  { id: 'erp', label: 'ERP Core', icon: Database, count: 5 },
  { id: 'finance', label: 'Finance', icon: DollarSign, count: 3 },
  { id: 'social', label: 'Social', icon: Users, count: 2 },
  { id: 'ai', label: 'AI Agents', icon: Brain, count: 4 },
  { id: 'logistics', label: 'Logistics', icon: Package, count: 2 },
  { id: 'security', label: 'Security', icon: Shield, count: 2 },
];

const MODULES_CATALOG: StoreModule[] = [
  // ERP Core
  {
    id: 'elsx-enterprise',
    name: 'ELSX Enterprise',
    description: 'Full-featured ERP suite with CRM, Sales, Inventory',
    longDescription: 'Complete enterprise resource planning suite including Customer Relationship Management, Sales Order Processing, Inventory Management, Accounting, HR, and Project Management modules.',
    version: '3.2.1',
    category: 'erp',
    icon: Database,
    color: 'text-violet-400',
    bg: 'bg-violet-500/15',
    rating: 4.9,
    downloads: '12.4K',
    installed: false,
    features: ['CRM Pipeline', 'Sales Orders', 'Inventory Tracking', 'Invoicing', 'HR Management', 'Project Boards'],
    dependencies: [],
    author: 'Aethelis Labs',
    price: 'free',
  },
  {
    id: 'sovereign-crm',
    name: 'Sovereign CRM',
    description: 'Advanced customer relationship management',
    longDescription: 'Next-generation CRM with AI-powered lead scoring, automated follow-ups, and comprehensive customer 360 views.',
    version: '2.8.0',
    category: 'erp',
    icon: Users,
    color: 'text-sky-400',
    bg: 'bg-sky-500/15',
    rating: 4.7,
    downloads: '8.2K',
    installed: false,
    features: ['Lead Scoring', 'Pipeline Kanban', 'Email Integration', 'Activity Timeline', 'Custom Fields'],
    dependencies: [],
    author: 'Aethelis Labs',
    price: 'free',
  },
  {
    id: 'inventory-pro',
    name: 'Inventory Pro',
    description: 'Real-time stock management and warehousing',
    longDescription: 'Advanced inventory management with multi-warehouse support, barcode scanning, reorder automation, and real-time stock tracking.',
    version: '2.1.4',
    category: 'erp',
    icon: Package,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
    rating: 4.6,
    downloads: '6.7K',
    installed: false,
    features: ['Multi-Warehouse', 'Barcode Support', 'Stock Alerts', 'Batch Tracking', 'Serial Numbers'],
    dependencies: [],
    author: 'Aethelis Labs',
    price: 'free',
  },
  {
    id: 'hr-nexus',
    name: 'HR Nexus',
    description: 'Human resources and payroll management',
    longDescription: 'Complete HR solution with employee management, leave tracking, expense claims, and payroll integration.',
    version: '1.9.2',
    category: 'erp',
    icon: Users,
    color: 'text-rose-400',
    bg: 'bg-rose-500/15',
    rating: 4.5,
    downloads: '5.1K',
    installed: false,
    features: ['Employee Directory', 'Leave Management', 'Expense Claims', 'Recruitment', 'Onboarding'],
    dependencies: [],
    author: 'Aethelis Labs',
    price: 'enterprise',
  },
  {
    id: 'project-flow',
    name: 'Project Flow',
    description: 'Task and project management with Gantt charts',
    longDescription: 'Comprehensive project management with task dependencies, Gantt charts, time tracking, and resource allocation.',
    version: '2.3.0',
    category: 'erp',
    icon: Layers,
    color: 'text-teal-400',
    bg: 'bg-teal-500/15',
    rating: 4.8,
    downloads: '9.3K',
    installed: false,
    features: ['Gantt Charts', 'Task Dependencies', 'Time Tracking', 'Resource Planning', 'Milestones'],
    dependencies: [],
    author: 'Aethelis Labs',
    price: 'free',
  },

  // Finance
  {
    id: 'sovereign-ledger',
    name: 'Sovereign Ledger',
    description: 'Decentralized treasury and asset management',
    longDescription: 'Blockchain-backed ledger system for tracking digital assets, treasury operations, and decentralized financial workflows.',
    version: '4.0.0',
    category: 'finance',
    icon: DollarSign,
    color: 'text-amber-400',
    bg: 'bg-amber-500/15',
    rating: 4.9,
    downloads: '15.7K',
    installed: true,
    features: ['Asset Tracking', 'Live Pricing', 'NFT Minting', 'Transaction History', 'Wallet Integration'],
    dependencies: [],
    author: 'Aethelis Labs',
    price: 'free',
  },
  {
    id: 'ghost-accounting',
    name: 'Ghost Accounting',
    description: 'Automated double-entry accounting engine',
    longDescription: 'AI-powered accounting with automatic reconciliation, invoice generation, and multi-currency support.',
    version: '2.5.1',
    category: 'finance',
    icon: Receipt,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/15',
    rating: 4.6,
    downloads: '7.8K',
    installed: false,
    features: ['Double-Entry', 'Auto Reconciliation', 'Multi-Currency', 'Tax Reports', 'Audit Trail'],
    dependencies: ['sovereign-ledger'],
    author: 'Aethelis Labs',
    price: 'premium',
  },
  {
    id: 'payment-gateway',
    name: 'Payment Gateway',
    description: 'Multi-provider payment processing',
    longDescription: 'Unified payment processing supporting crypto, cards, and bank transfers with automatic settlement.',
    version: '1.8.3',
    category: 'finance',
    icon: DollarSign,
    color: 'text-green-400',
    bg: 'bg-green-500/15',
    rating: 4.4,
    downloads: '4.2K',
    installed: false,
    features: ['Crypto Payments', 'Card Processing', 'Bank Transfers', 'Auto Settlement', 'Recurring Billing'],
    dependencies: ['sovereign-ledger'],
    author: 'Aethelis Labs',
    price: 'premium',
  },

  // Social
  {
    id: 'aether-life',
    name: 'Aether-Life',
    description: 'Encrypted social network and messaging',
    longDescription: 'End-to-end encrypted social platform with secure messaging, group chats, and decentralized identity verification.',
    version: '2.0.0',
    category: 'social',
    icon: Users,
    color: 'text-pink-400',
    bg: 'bg-pink-500/15',
    rating: 4.7,
    downloads: '11.2K',
    installed: false,
    features: ['E2E Encryption', 'Group Chats', 'Voice/Video', 'Identity Verification', 'Content Feeds'],
    dependencies: [],
    author: 'Aethelis Labs',
    price: 'free',
  },
  {
    id: 'community-hub',
    name: 'Community Hub',
    description: 'Forum and community management',
    longDescription: 'Build and manage communities with forums, events, member directories, and moderation tools.',
    version: '1.5.0',
    category: 'social',
    icon: Users,
    color: 'text-orange-400',
    bg: 'bg-orange-500/15',
    rating: 4.3,
    downloads: '3.8K',
    installed: false,
    features: ['Forums', 'Events', 'Member Directory', 'Moderation', 'Analytics'],
    dependencies: ['aether-life'],
    author: 'Aethelis Labs',
    price: 'free',
  },

  // AI Agents
  {
    id: 'qbit-oracle',
    name: 'Q-Bit Oracle',
    description: 'Prophetic AI assistant interface',
    longDescription: 'Advanced AI oracle powered by Anthropic Claude with tool calling, memory, and multi-modal capabilities.',
    version: '5.0.0',
    category: 'ai',
    icon: Sparkles,
    color: 'text-purple-400',
    bg: 'bg-purple-500/15',
    rating: 4.9,
    downloads: '18.3K',
    installed: true,
    features: ['Prophetic AI', 'Tool Calling', 'Memory', 'Multi-Modal', 'Code Generation'],
    dependencies: [],
    author: 'Aethelis Labs',
    price: 'free',
  },
  {
    id: 'auto-agent',
    name: 'Auto-Agent Framework',
    description: 'Autonomous agent orchestration',
    longDescription: 'Build and deploy autonomous AI agents that can execute tasks, schedule workflows, and interact with external APIs.',
    version: '2.2.1',
    category: 'ai',
    icon: Brain,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/15',
    rating: 4.6,
    downloads: '6.5K',
    installed: false,
    features: ['Agent Builder', 'Workflow Scheduling', 'API Integration', 'Memory Systems', 'Tool Plugins'],
    dependencies: ['qbit-oracle'],
    author: 'Aethelis Labs',
    price: 'enterprise',
  },
  {
    id: 'neural-search',
    name: 'Neural Search',
    description: 'Semantic search engine for all data',
    longDescription: 'AI-powered semantic search across all your data with natural language queries and auto-categorization.',
    version: '1.4.0',
    category: 'ai',
    icon: Search,
    color: 'text-teal-400',
    bg: 'bg-teal-500/15',
    rating: 4.5,
    downloads: '5.2K',
    installed: false,
    features: ['Semantic Search', 'Natural Language', 'Auto-Categorization', 'Fuzzy Matching', 'Embeddings'],
    dependencies: ['qbit-oracle'],
    author: 'Aethelis Labs',
    price: 'premium',
  },
  {
    id: 'doc-intelligence',
    name: 'Document Intelligence',
    description: 'AI document analysis and generation',
    longDescription: 'Extract, analyze, and generate documents with AI. Supports PDFs, contracts, and structured forms.',
    version: '1.9.0',
    category: 'ai',
    icon: FileText,
    color: 'text-amber-400',
    bg: 'bg-amber-500/15',
    rating: 4.7,
    downloads: '8.9K',
    installed: false,
    features: ['OCR', 'Extraction', 'Generation', 'Templates', 'Contracts'],
    dependencies: ['qbit-oracle'],
    author: 'Aethelis Labs',
    price: 'premium',
  },

  // Logistics
  {
    id: 'wp-backbone',
    name: 'WP Backbone',
    description: 'Sovereign CMS and WordPress bridge',
    longDescription: 'Secure WordPress integration with proxy nodes, content sync, and decentralized media delivery.',
    version: '3.1.0',
    category: 'logistics',
    icon: Globe,
    color: 'text-sky-400',
    bg: 'bg-sky-500/15',
    rating: 4.8,
    downloads: '14.1K',
    installed: true,
    features: ['WP Integration', 'Proxy Nodes', 'Content Sync', 'Media CDN', 'Auto-Updates'],
    dependencies: [],
    author: 'Aethelis Labs',
    price: 'free',
  },
  {
    id: 'food-proxy',
    name: 'Food Proxy Network',
    description: 'Delivery overlay network for food services',
    longDescription: 'Restaurant and delivery management with order routing, driver tracking, and automated dispatch.',
    version: '2.0.5',
    category: 'logistics',
    icon: ShoppingBag,
    color: 'text-orange-400',
    bg: 'bg-orange-500/15',
    rating: 4.4,
    downloads: '3.2K',
    installed: false,
    features: ['Order Routing', 'Driver Tracking', 'Menu Sync', 'Analytics', 'POS Integration'],
    dependencies: ['wp-backbone'],
    author: 'Aethelis Labs',
    price: 'premium',
  },

  // Security
  {
    id: 'bio-vault',
    name: 'Bio-Pulse Vault',
    description: 'Biometric-secured secure storage',
    longDescription: 'Ultra-secure vault with biometric authentication, encrypted notes, and secure file storage.',
    version: '2.5.0',
    category: 'security',
    icon: Lock,
    color: 'text-violet-400',
    bg: 'bg-violet-500/15',
    rating: 4.9,
    downloads: '16.8K',
    installed: true,
    features: ['Biometric Auth', 'AES-256', 'Secure Notes', 'File Encryption', 'Password Generator'],
    dependencies: [],
    author: 'Aethelis Labs',
    price: 'free',
  },
  {
    id: 'kali-nexus',
    name: 'Kali-Nexus',
    description: 'Security audit and penetration toolkit',
    longDescription: 'Professional security toolkit with network scanning, vulnerability assessment, and exploit frameworks.',
    version: '4.2.0',
    category: 'security',
    icon: Shield,
    color: 'text-red-400',
    bg: 'bg-red-500/15',
    rating: 4.7,
    downloads: '7.4K',
    installed: false,
    features: ['Network Scan', 'Vuln Assessment', 'Exploit DB', 'Reporting', 'Auto-Fix'],
    dependencies: ['bio-vault'],
    author: 'Aethelis Labs',
    price: 'enterprise',
  },

  // Productivity
  {
    id: 'pos-terminal',
    name: 'POS Terminal',
    description: 'Point of sale for retail operations',
    longDescription: 'Modern point-of-sale system with barcode scanning, inventory sync, and multi-payment support.',
    version: '2.1.0',
    category: 'erp',
    icon: Monitor,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/15',
    rating: 4.5,
    downloads: '4.6K',
    installed: false,
    features: ['Barcode Scanner', 'Tap-to-Pay', 'Receipt Print', 'Inventory Sync', 'Shift Management'],
    dependencies: ['inventory-pro'],
    author: 'Aethelis Labs',
    price: 'premium',
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// INSTALLATION SEQUENCES
// ═══════════════════════════════════════════════════════════════════════════════

const INSTALL_STEPS = [
  'Validating dependencies...',
  'Resolving package manifest...',
  'Allocating secure volume...',
  'Mounting encrypted container...',
  'Verifying checksums...',
  'Extracting modules...',
  'Configuring permissions...',
  'Initializing database schemas...',
  'Running migrations...',
  'Setting up hooks...',
  'Optimizing indexes...',
  'Finalizing installation...',
  'Module installed successfully!',
];

const UNINSTALL_STEPS = [
  'Stopping services...',
  'Backing up data...',
  'Removing modules...',
  'Cleaning registry...',
  'Releasing resources...',
  'Uninstalled successfully!',
];

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={10}
          className={`${i <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-white/20'}`}
        />
      ))}
      <span className="text-[9px] text-white/50 ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

function PriceBadge({ price }: { price: StoreModule['price'] }) {
  const styles = {
    free: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
    premium: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
    enterprise: 'text-violet-400 bg-violet-500/15 border-violet-500/30',
  };
  return (
    <span className={`text-[7px] font-bold px-2 py-0.5 rounded-full border ${styles[price]}`}>
      {price.toUpperCase()}
    </span>
  );
}

function ModuleCard({
  module,
  viewMode,
  onInstall,
  onUninstall,
  onViewDetails
}: {
  module: StoreModule;
  viewMode: 'grid' | 'list';
  onInstall: () => void;
  onUninstall: () => void;
  onViewDetails: () => void;
}) {
  const Icon = module.icon;
  const isInstalling = module.installing;

  return viewMode === 'grid' ? (
    // Bento Grid Card
    <div
      onClick={onViewDetails}
      className={`group relative bg-white/[0.04] border border-white/[0.07] rounded-2xl p-5 cursor-pointer
        transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06]
        ${module.installed ? 'ring-1 ring-emerald-500/20' : ''}`}
    >
      {/* Install Progress Overlay */}
      {isInstalling && (
        <div className="absolute inset-0 z-20 bg-slate-950/90 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-4">
          <RefreshCw size={24} className="text-emerald-400 animate-spin mb-3" />
          <div className="w-full max-w-[120px] h-1.5 bg-white/10 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all"
              style={{ width: `${module.installProgress || 0}%` }}
            />
          </div>
          <p className="text-[8px] text-white/50 font-mono text-center">
            {module.installLogs?.[module.installLogs.length - 1] || 'Initializing...'}
          </p>
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl ${module.bg} flex items-center justify-center`}>
          <Icon size={24} className={module.color} />
        </div>
        <div className="flex flex-col items-end gap-1">
          <PriceBadge price={module.price} />
          {module.installed && (
            <span className="text-[7px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle size={8} /> Installed
            </span>
          )}
        </div>
      </div>

      <h3 className="text-sm font-semibold text-white/90 mb-1">{module.name}</h3>
      <p className="text-[10px] text-white/40 mb-3 line-clamp-2">{module.description}</p>

      <div className="flex items-center justify-between">
        <RatingStars rating={module.rating} />
        <span className="text-[8px] text-white/30">{module.downloads} downloads</span>
      </div>

      {/* Quick Install Button */}
      {!module.installed && !isInstalling && (
        <button
          onClick={(e) => { e.stopPropagation(); onInstall(); }}
          className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity
            p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
        >
          <Download size={14} />
        </button>
      )}
    </div>
  ) : (
    // List View
    <div
      onClick={onViewDetails}
      className={`group flex items-center gap-4 bg-white/[0.04] border border-white/[0.07] rounded-xl p-4 cursor-pointer
        transition-all duration-300 hover:border-white/15 hover:bg-white/[0.06]
        ${module.installed ? 'ring-1 ring-emerald-500/20' : ''}`}
    >
      {isInstalling && (
        <div className="absolute inset-0 z-20 bg-slate-950/90 backdrop-blur-sm rounded-xl flex items-center gap-3 px-4">
          <RefreshCw size={16} className="text-emerald-400 animate-spin" />
          <div className="flex-1">
            <p className="text-[9px] text-white/70 mb-1">
              {module.installLogs?.[module.installLogs.length - 1] || 'Initializing...'}
            </p>
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{ width: `${module.installProgress || 0}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <div className={`w-10 h-10 rounded-lg ${module.bg} flex items-center justify-center shrink-0`}>
        <Icon size={20} className={module.color} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="text-sm font-semibold text-white/90">{module.name}</h3>
          <PriceBadge price={module.price} />
          {module.installed && (
            <span className="text-[7px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle size={8} /> Installed
            </span>
          )}
        </div>
        <p className="text-[9px] text-white/40 truncate">{module.description}</p>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <RatingStars rating={module.rating} />
        <span className="text-[8px] text-white/30 w-20 text-right">{module.downloads}</span>

        {!module.installed && !isInstalling && (
          <button
            onClick={(e) => { e.stopPropagation(); onInstall(); }}
            className="p-2 rounded-lg bg-white/5 text-white/50 hover:bg-emerald-500/20 hover:text-emerald-400 transition-all"
          >
            <Download size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

function ModuleDetailModal({
  module,
  onClose,
  onInstall,
  onUninstall
}: {
  module: StoreModule;
  onClose: () => void;
  onInstall: () => void;
  onUninstall: () => void;
}) {
  const Icon = module.icon;
  const isInstalling = module.installing;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-gradient-to-br from-slate-900 to-slate-950 border border-white/10 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-6 py-5 border-b border-white/10 bg-gradient-to-r from-white/[0.04] to-transparent">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/10 transition-all"
          >
            <X size={16} />
          </button>

          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-xl ${module.bg} flex items-center justify-center`}>
              <Icon size={28} className={module.color} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-semibold text-white">{module.name}</h2>
                <PriceBadge price={module.price} />
              </div>
              <p className="text-[10px] text-white/40 mb-2">{module.description}</p>
              <div className="flex items-center gap-4">
                <RatingStars rating={module.rating} />
                <span className="text-[9px] text-white/30">{module.downloads} downloads</span>
                <span className="text-[9px] text-white/30">v{module.version}</span>
                <span className="text-[9px] text-white/30">by {module.author}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Installing Progress */}
        {isInstalling && (
          <div className="px-6 py-4 border-b border-white/10 bg-emerald-500/5">
            <div className="flex items-center gap-3 mb-3">
              <RefreshCw size={16} className="text-emerald-400 animate-spin" />
              <span className="text-[10px] font-medium text-emerald-400 uppercase tracking-wider">Installing...</span>
              <span className="ml-auto text-[9px] text-white/50 font-mono">{module.installProgress}%</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all"
                style={{ width: `${module.installProgress}%` }}
              />
            </div>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {module.installLogs?.map((log, i) => (
                <p key={i} className="text-[8px] font-mono text-white/40">{log}</p>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          <div className="mb-6">
            <h3 className="text-[9px] uppercase tracking-widest text-white/40 mb-2">About</h3>
            <p className="text-[11px] text-white/70 leading-relaxed">{module.longDescription}</p>
          </div>

          <div className="mb-6">
            <h3 className="text-[9px] uppercase tracking-widest text-white/40 mb-3">Features</h3>
            <div className="grid grid-cols-2 gap-2">
              {module.features.map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-[10px] text-white/60">
                  <CheckCircle size={10} className="text-emerald-400" />
                  {feature}
                </div>
              ))}
            </div>
          </div>

          {module.dependencies.length > 0 && (
            <div>
              <h3 className="text-[9px] uppercase tracking-widest text-white/40 mb-2">Dependencies</h3>
              <div className="flex flex-wrap gap-2">
                {module.dependencies.map((dep, i) => (
                  <span key={i} className="text-[9px] px-2 py-1 rounded bg-white/5 text-white/50">
                    {dep}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between bg-white/[0.02]">
          <span className="text-[9px] text-white/30">
            {module.installed ? 'Installed on ' + new Date().toLocaleDateString() : 'Ready to install'}
          </span>
          <div className="flex items-center gap-2">
            {module.installed ? (
              <button
                onClick={onUninstall}
                disabled={isInstalling}
                className="px-4 py-2 rounded-lg text-[10px] font-semibold border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
              >
                Uninstall
              </button>
            ) : (
              <button
                onClick={onInstall}
                disabled={isInstalling}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all disabled:opacity-50"
              >
                {isInstalling ? <RefreshCw size={12} className="animate-spin" /> : <Download size={12} />}
                {isInstalling ? 'Installing...' : 'Install'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function OmniStoreApp({ installedApps, onInstallApp, onUninstallApp }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryId>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [modules, setModules] = useState<StoreModule[]>(MODULES_CATALOG);
  const [selectedModule, setSelectedModule] = useState<StoreModule | null>(null);

  // Sync installed state
  useEffect(() => {
    setModules(prev => prev.map(m => ({
      ...m,
      installed: installedApps.includes(m.id)
    })));
  }, [installedApps]);

  // Filter modules
  const filteredModules = useMemo(() => {
    return modules.filter(m => {
      const matchesCategory = activeCategory === 'all' || m.category === activeCategory;
      const matchesSearch = !searchQuery ||
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [modules, activeCategory, searchQuery]);

  // Install handler with progress animation
  const handleInstall = useCallback((moduleId: string) => {
    setModules(prev => prev.map(m => {
      if (m.id !== moduleId) return m;
      return {
        ...m,
        installing: true,
        installProgress: 0,
        installLogs: ['Starting installation...']
      };
    }));

    // Animate through install steps
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setModules(prev => prev.map(m => {
        if (m.id !== moduleId) return m;
        const progress = Math.min((step / INSTALL_STEPS.length) * 100, 100);
        const logs = [...(m.installLogs || []), INSTALL_STEPS[Math.min(step - 1, INSTALL_STEPS.length - 1)]];
        return {
          ...m,
          installProgress: progress,
          installLogs: logs.slice(-6)
        };
      }));

      if (step >= INSTALL_STEPS.length) {
        clearInterval(interval);
        setTimeout(() => {
          setModules(prev => prev.map(m => {
            if (m.id !== moduleId) return m;
            return { ...m, installing: false, installed: true, installProgress: 100 };
          }));
          onInstallApp(moduleId);
        }, 300);
      }
    }, 250);
  }, [onInstallApp]);

  // Uninstall handler
  const handleUninstall = useCallback((moduleId: string) => {
    setModules(prev => prev.map(m => {
      if (m.id !== moduleId) return m;
      return {
        ...m,
        installing: true,
        installProgress: 0,
        installLogs: ['Starting uninstall...']
      };
    }));

    let step = 0;
    const interval = setInterval(() => {
      step++;
      setModules(prev => prev.map(m => {
        if (m.id !== moduleId) return m;
        const progress = Math.min((step / UNINSTALL_STEPS.length) * 100, 100);
        const logs = [...(m.installLogs || []), UNINSTALL_STEPS[Math.min(step - 1, UNINSTALL_STEPS.length - 1)]];
        return {
          ...m,
          installProgress: progress,
          installLogs: logs.slice(-4)
        };
      }));

      if (step >= UNINSTALL_STEPS.length) {
        clearInterval(interval);
        setTimeout(() => {
          setModules(prev => prev.map(m => {
            if (m.id !== moduleId) return m;
            return { ...m, installing: false, installed: false, installProgress: 0 };
          }));
          onUninstallApp(moduleId);
        }, 300);
      }
    }, 200);
  }, [onUninstallApp]);

  const CategoryIcon = STORE_CATEGORIES.find(c => c.id === activeCategory)?.icon || Grid3X3;

  return (
    <div className="h-full flex flex-col bg-slate-950/92 text-white overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-5 py-4 border-b border-white/[0.06] bg-gradient-to-r from-emerald-500/5 to-transparent">
        <div className="flex items-center gap-2 mb-1">
          <ShoppingBag size={14} className="text-emerald-400" />
          <span className="text-[8px] uppercase tracking-[0.2em] text-emerald-400/70">Planetary App Store</span>
        </div>
        <h1 className="text-xl font-light text-white mb-1">Omni-Store</h1>
        <p className="text-[10px] text-white/40">Deploy sovereign functionalities into your planetary OS.</p>
      </div>

      {/* Search & Controls */}
      <div className="shrink-0 px-5 py-3 flex items-center gap-3 border-b border-white/[0.04]">
        <div className="relative flex-1">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            placeholder="Search apps..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg text-[10px] text-white/80 bg-white/[0.04] border border-white/[0.07] placeholder-white/30 outline-none focus:border-emerald-500/30 transition-colors"
          />
        </div>
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-white/[0.04] border border-white/[0.07]">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-emerald-500/20 text-emerald-400' : 'text-white/40 hover:text-white/70'}`}
          >
            <Grid3X3 size={14} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-emerald-500/20 text-emerald-400' : 'text-white/40 hover:text-white/70'}`}
          >
            <List size={14} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Categories Sidebar */}
        <div className="shrink-0 w-40 border-r border-white/[0.04] overflow-y-auto p-2 hidden sm:block">
          {STORE_CATEGORIES.map(cat => {
            const CatIcon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-[10px] text-left mb-1 transition-all
                  ${isActive
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : 'text-white/50 hover:bg-white/[0.04] hover:text-white/70'}`}
              >
                <CatIcon size={14} className={isActive ? 'text-emerald-400' : ''} />
                <span className="flex-1">{cat.label}</span>
                <span className={`text-[8px] ${isActive ? 'text-emerald-400/50' : 'text-white/25'}`}>{cat.count}</span>
              </button>
            );
          })}
        </div>

        {/* Modules Grid/List */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Category Header (Mobile) */}
          <div className="sm:hidden flex items-center gap-2 mb-3 overflow-x-auto pb-2 no-scrollbar">
            {STORE_CATEGORIES.map(cat => {
              const CatIcon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-[9px] transition-all min-h-[44px]
                    ${isActive
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'bg-white/[0.03] text-white/50'}`}
                >
                  <CatIcon size={14} />
                  {cat.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 mb-3">
            <CategoryIcon size={12} className="text-white/40" />
            <span className="text-[9px] uppercase tracking-widest text-white/40">
              {STORE_CATEGORIES.find(c => c.id === activeCategory)?.label || 'All Apps'}
            </span>
            <span className="text-[8px] text-white/25">• {filteredModules.length} apps</span>
          </div>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredModules.map(m => (
                <ModuleCard
                  key={m.id}
                  module={m}
                  viewMode="grid"
                  onInstall={() => handleInstall(m.id)}
                  onUninstall={() => handleUninstall(m.id)}
                  onViewDetails={() => setSelectedModule(m)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredModules.map(m => (
                <ModuleCard
                  key={m.id}
                  module={m}
                  viewMode="list"
                  onInstall={() => handleInstall(m.id)}
                  onUninstall={() => handleUninstall(m.id)}
                  onViewDetails={() => setSelectedModule(m)}
                />
              ))}
            </div>
          )}

          {filteredModules.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-white/30">
              <Search size={32} className="mb-3 opacity-40" />
              <p className="text-[10px]">No apps found matching your search.</p>
            </div>
          )}
        </div>
      </div>

      {/* Module Detail Modal */}
      {selectedModule && (
        <ModuleDetailModal
          module={selectedModule}
          onClose={() => setSelectedModule(null)}
          onInstall={() => { handleInstall(selectedModule.id); setSelectedModule(null); }}
          onUninstall={() => { handleUninstall(selectedModule.id); setSelectedModule(null); }}
        />
      )}
    </div>
  );
}
