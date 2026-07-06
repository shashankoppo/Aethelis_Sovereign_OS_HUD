import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  // Navigation & Layout
  LayoutDashboard, Menu, X, ChevronRight, ChevronDown, ChevronLeft, ArrowLeft,
  Search, Plus, Edit, Trash2, Eye, MoreHorizontal, ExternalLink, Maximize2,
  RefreshCw, Download, Upload, Filter, SortAsc, SortDesc, Columns, Rows,
  Calendar, List, Kanban, PieChart, BarChart3, LineChart, TrendingUp,
  // Actions
  CheckCircle, XCircle, AlertTriangle, Info, HelpCircle, Settings, Bell,
  Activity, Zap, Brain, Cpu, Star, Award, Flag, Bookmark, Pin, Tag,
  // CRM & Sales
  Users, UserPlus, Target, DollarSign, Phone, Mail, MapPin, Building,
  Briefcase, Handshake, FileText, Send, Copy, Printer, Share2,
  // Inventory
  Package, Warehouse, Truck, Boxes, Barcode, Scale, Archive, Layers,
  // Accounting
  Receipt, CreditCard, Wallet, PiggyBank, Calculator, FileCheck, Banknote,
  // HR
  UserCheck, Clock, CalendarDays, FileBadge2, GraduationCap, IdCard,
  // Project
  ListTodo, GanttChart, Milestone, CheckSquare, Timer, Dependency,
  // Purchasing
  ShoppingCart, ClipboardList, FilePlus, ShoppingBag,
  // Manufacturing
  Factory, Cog, Wrench, Play, Pause, Settings2,
  // POS
  Monitor, Grid3X3, Receipt as ReceiptIcon, Cash, CreditCard as CardIcon,
  // Helpdesk
  Headphones, MessageCircle, Ticket, LifeBuoy, Inbox,
  // Status colors
  Moon, Sun, Globe, Lock, Unlock, Shield, Sparkles,
} from 'lucide-react';
import type { ElsxLead, ElsxShipment } from '../../lib/api';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface Props {
  leads: ElsxLead[];
  shipments: ElsxShipment[];
  syncing: boolean;
  onSync: () => void;
}

type ModuleId = 'dashboard' | 'crm' | 'sales' | 'inventory' | 'accounting' | 'hr' | 'project' | 'purchasing' | 'manufacturing' | 'pos' | 'helpdesk' | 'website' | 'reports' | 'settings';

type ViewMode = 'list' | 'kanban' | 'calendar' | 'gantt' | 'pivot' | 'graph' | 'map' | 'activity';

// ═══════════════════════════════════════════════════════════════════════════════
// COMPREHENSIVE DATA MODELS
// ═══════════════════════════════════════════════════════════════════════════════

// CRM Data
const CRM_LEADS = [
  { id:'L001', name:'Marcus Chen', company:'Apex Dynamics Inc', email:'marcus@apexdyn.com', phone:'+1 415-555-0101', stage:'qualified', value:125000, probability:65, source:'Trade Show', assignedTo:'Sarah Johnson', created:'2026-06-15', tags:['Enterprise','Priority'], lastActivity:'2026-07-01', nextAction:'Follow-up call', notes:'Interested in enterprise package. Spoke with IT director about requirements.' },
  { id:'L002', name:'Elena Rodriguez', company:'Nova Ventures LLC', email:'elena@novav.co', phone:'+1 512-555-0202', stage:'proposal', value:340000, probability:80, source:'Website', assignedTo:'Mike Peters', created:'2026-06-10', tags:['Mid-Market'], lastActivity:'2026-06-28', nextAction:'Send revised quote', notes:'Ready for proposal. Decision maker confirmed budget approval.' },
  { id:'L003', name:'James Okonkwo', company:'Horizon Tech', email:'james@horizontech.io', phone:'+44 20 7946 0958', stage:'negotiation', value:520000, probability:90, source:'Referral', assignedTo:'Sarah Johnson', created:'2026-05-20', tags:['Enterprise','International'], lastActivity:'2026-06-30', nextAction:'Contract review', notes:'Final stage - negotiating SLA terms and implementation timeline.' },
  { id:'L004', name:'Yuki Tanaka', company:'Stellar Mesh Corp', email:'yuki@stellarmesh.jp', phone:'+81 3-1234-5678', stage:'new', value:78000, probability:20, source:'Cold Outreach', assignedTo:'Alex Kumar', created:'2026-07-01', tags:['SMB'], lastActivity:'2026-07-02', nextAction:'Initial discovery call', notes:'Initial contact made through LinkedIn. Need to schedule demo.' },
  { id:'L005', name:'Viktor Petrov', company:'Quantum Gate Ltd', email:'viktor@quantumgate.ru', phone:'+7 495 123 4567', stage:'won', value:450000, probability:100, source:'Partner', assignedTo:'Mike Peters', created:'2026-04-05', tags:['Enterprise'], lastActivity:'2026-06-15', nextAction:'Onboarding', notes:'Contract signed. 3-year enterprise license. Implementation starts Q3.' },
  { id:'L006', name:'Sophie Bernard', company:'Void Systems SA', email:'sophie@voidsystems.fr', phone:'+33 1 23 45 67 89', stage:'proposal', value:215000, probability:70, source:'Trade Show', assignedTo:'Emma Wilson', created:'2026-06-22', tags:['Mid-Market','EU'], lastActivity:'2026-07-02', nextAction:'Demo presentation', notes:'Requested technical deep-dive on API integration capabilities.' },
  { id:'L007', name:'Carlos Mendez', company:'Ether Prime GmbH', email:'carlos@etherprime.de', phone:'+49 30 12345678', stage:'lost', value:180000, probability:0, source:'Website', assignedTo:'Alex Kumar', created:'2026-05-01', tags:['SMB'], lastActivity:'2026-05-30', nextAction:'None', notes:'Lost to competitor - better pricing offered. Add to nurture campaign.' },
  { id:'L008', name:'Amira Hassan', company:'Nexus Solutions', email:'amira@nexussol.ae', phone:'+971 4 123 4567', stage:'qualified', value:285000, probability:55, source:'Referral', assignedTo:'Sarah Johnson', created:'2026-06-28', tags:['Enterprise','MEA'], lastActivity:'2026-07-01', nextAction:'Technical assessment', notes:'Large Dubai-based consulting firm. Expanding operations to Asia.' },
];

const ACTIVITIES = [
  { id: 'A1', type: 'meeting', subject: 'Product Demo - Apex Dynamics', date: '2026-07-03', time: '10:00 AM', duration: 60, status: 'planned', relatedTo: 'L001', assignedTo: 'Sarah Johnson', priority: 'high', description: 'Full product demonstration for IT team and CTO.', location: 'Virtual - Zoom' },
  { id: 'A2', type: 'call', subject: 'Follow-up - Nova Ventures', date: '2026-07-03', time: '2:00 PM', duration: 30, status: 'planned', relatedTo: 'L002', assignedTo: 'Mike Peters', priority: 'medium', description: 'Discuss pricing options and contract terms.', location: 'Phone' },
  { id: 'A3', type: 'email', subject: 'Proposal - Horizon Tech Migration', date: '2026-07-02', time: '4:30 PM', duration: 15, status: 'done', relatedTo: 'L003', assignedTo: 'Emma Wilson', priority: 'high', description: 'Sent final proposal with revised SLA terms.', location: '' },
  { id: 'A4', type: 'task', subject: 'Update CRM records', date: '2026-07-02', time: '', duration: 45, status: 'done', relatedTo: '', assignedTo: 'Alex Kumar', priority: 'low', description: 'Weekly data cleanup and lead scoring update.', location: '' },
  { id: 'A5', type: 'meeting', subject: 'Contract Signing - Quantum Gate', date: '2026-06-15', time: '3:00 PM', duration: 120, status: 'done', relatedTo: 'L005', assignedTo: 'Mike Peters', priority: 'critical', description: 'Final contract review and signature.', location: 'Client Office - Moscow' },
  { id: 'A6', type: 'call', subject: 'Discovery Call - Nexus Solutions', date: '2026-07-01', time: '11:00 AM', duration: 45, status: 'done', relatedTo: 'L008', assignedTo: 'Sarah Johnson', priority: 'high', description: 'Initial discovery meeting with CEO and CTO.', location: 'Phone' },
];

const CUSTOMERS = [
  { id:'C001', name:'Apex Dynamics Inc', company:'Apex Dynamics Inc', email:'billing@apexdyn.com', phone:'+1 415-555-0100', address:'500 Market Street, Suite 1200', city:'San Francisco', country:'USA', postalCode:'94105', type:'customer', creditLimit:500000, paymentTerms:'Net 30', tags:['Enterprise','Priority'], totalRevenue:1250000, ordersCount:12, lastOrder:'2026-06-30', contactPerson:'Marcus Chen', isCompany:true, parentCompany:'', industry:'Technology' },
  { id:'C002', name:'Nova Ventures LLC', company:'Nova Ventures LLC', email:'finance@novav.co', phone:'+1 512-555-0200', address:'2100 Congress Ave, Floor 15', city:'Austin', country:'USA', postalCode:'78701', type:'customer', creditLimit:250000, paymentTerms:'Net 45', tags:['Mid-Market'], totalRevenue:340000, ordersCount:4, lastOrder:'2026-06-15', contactPerson:'Elena Rodriguez', isCompany:true, parentCompany:'', industry:'Consulting' },
  { id:'C003', name:'Horizon Tech', company:'Horizon Technologies Ltd', email:'ap@horizontech.io', phone:'+44 20 7946 0900', address:'25 Old Broad Street', city:'London', country:'UK', postalCode:'EC2N 1HN', type:'customer', creditLimit:750000, paymentTerms:'Net 30', tags:['Enterprise','International'], totalRevenue:2800000, ordersCount:28, lastOrder:'2026-06-28', contactPerson:'James Okonkwo', isCompany:true, parentCompany:'', industry:'Finance' },
];

// Sales Data
const QUOTATIONS = [
  { id:'Q001', number:'QT-2026-0042', customer:'Apex Dynamics Inc', customerId:'C001', date:'2026-06-28', validUntil:'2026-07-28', lines:[
    { id:'QL1', product:'ATH-0042', name:'Sovereign Core Module', description:'Enterprise-grade core module with 24/7 support', quantity:5, unitPrice:42000, discount:0, subtotal:210000, taxRate:18 },
    { id:'QL2', product:'ATH-0215', name:'Quantum Lattice Node', description:'High-performance quantum processing node', quantity:2, unitPrice:7100, discount:5, subtotal:13490, taxRate:18 },
  ], subtotal:223490, tax:40228, total:263718, status:'sent', salesperson:'Sarah Johnson', paymentTerms:'Net 30', termsConditions:'Standard enterprise terms. 30-day money-back guarantee.', tags:['Enterprise'], created:'2026-06-28' },
  { id:'Q002', number:'QT-2026-0043', customer:'Horizon Tech', customerId:'C003', date:'2026-07-01', validUntil:'2026-08-01', lines:[
    { id:'QL3', product:'ATH-0108', name:'Neural Bridge Array', description:'AI-accelerated neural network processor', quantity:10, unitPrice:8200, discount:10, subtotal:73800, taxRate:18 },
  ], subtotal:73800, tax:13284, total:87084, status:'draft', salesperson:'Mike Peters', paymentTerms:'Net 30', termsConditions:'UK VAT applicable. Delivery within 5 business days.', tags:['UK'], created:'2026-07-01' },
  { id:'Q003', number:'QT-2026-0044', customer:'Nova Ventures LLC', customerId:'C002', date:'2026-06-15', validUntil:'2026-07-15', lines:[
    { id:'QL4', product:'ATH-0671', name:'Agentic Relay Stack', description:'Autonomous agent orchestration platform', quantity:3, unitPrice:18200, discount:0, subtotal:54600, taxRate:18 },
    { id:'QL5', product:'ATH-0442', name:'Ether-Sync Protocol v2', description:'Secure synchronization protocol license', quantity:2, unitPrice:29000, discount:5, subtotal:55100, taxRate:18 },
  ], subtotal:109700, tax:19746, total:129446, status:'confirmed', salesperson:'Emma Wilson', paymentTerms:'Net 45', termsConditions:'Implementation services included.', tags:['Confirmed'], created:'2026-06-15' },
];

const SALES_ORDERS = [
  { id:'SO001', number:'SO-2026-0087', quotationId:'Q001', customer:'Apex Dynamics Inc', customerId:'C001', date:'2026-06-30', deliveryDate:'2026-07-15', lines:QUOTATIONS[0].lines, subtotal:223490, tax:40228, total:263718, status:'confirmed', salesperson:'Sarah Johnson', warehouse:'WH-MAIN', deliveryAddress:'500 Market Street, Suite 1200, San Francisco, CA 94105', trackingNumber:'', notes:'Gift wrapping requested', priority:'normal' },
  { id:'SO002', number:'SO-2026-0088', quotationId:'Q003', customer:'Nova Ventures LLC', customerId:'C002', date:'2026-06-20', deliveryDate:'2026-07-05', lines:QUOTATIONS[2].lines, subtotal:109700, tax:19746, total:129446, status:'delivered', salesperson:'Emma Wilson', warehouse:'WH-MAIN', deliveryAddress:'2100 Congress Ave, Floor 15, Austin, TX 78701', trackingNumber:'TRACK-789456', notes:'', priority:'high' },
  { id:'SO003', number:'SO-2026-0089', quotationId:'', customer:'Quantum Gate Ltd', customerId:'', date:'2026-05-15', deliveryDate:'2026-05-30', lines:[], subtotal:380000, tax:68400, total:448400, status:'invoiced', salesperson:'Mike Peters', warehouse:'WH-EU', deliveryAddress:'Tverskaya 12, Moscow 125009', trackingNumber:'TRACK-123456', notes:'Rush order', priority:'critical' },
];

const PRODUCTS = [
  { id:'P001', sku:'ATH-0042', name:'Sovereign Core Module', category:'Hardware', type:'stockable', price:42000, cost:28000, margin:33.3, stock:2847, reserved:340, available:2507, uom:'Units', weight:2.4, volume:0.012, barcode:'8901234567890', active:true, description:'Enterprise-grade computing core with advanced quantum processing capabilities. Includes 24/7 technical support and warranty.', categoryPath:'Hardware > Core Components', minStock:100, maxStock:5000, leadTime:14 },
  { id:'P002', sku:'ATH-0108', name:'Neural Bridge Array', category:'Hardware', type:'stockable', price:8200, cost:5800, margin:29.3, stock:182, reserved:92, available:90, uom:'Units', weight:0.8, volume:0.004, barcode:'8901234567891', active:true, description:'High-performance neural network processor for AI workloads. 10GB GPU memory equivalent.', categoryPath:'Hardware > AI Components', minStock:50, maxStock:500, leadTime:10 },
  { id:'P003', sku:'ATH-0215', name:'Quantum Lattice Node', category:'Hardware', type:'stockable', price:7100, cost:4200, margin:40.8, stock:4010, reserved:0, available:4010, uom:'Units', weight:1.2, volume:0.006, barcode:'8901234567892', active:true, description:'Quantum computing node with 50 qubit equivalent processing power.', categoryPath:'Hardware > Core Components', minStock:200, maxStock:8000, leadTime:21 },
  { id:'P004', sku:'ATH-0319', name:'Plasma Routing Capsule', category:'Hardware', type:'stockable', price:2600, cost:1800, margin:30.8, stock:33, reserved:200, available:-167, uom:'Units', weight:0.5, volume:0.002, barcode:'8901234567893', active:true, description:'High-speed data routing capsule with plasma-based switching.', categoryPath:'Hardware > Networking', minStock:100, maxStock:1000, leadTime:7 },
  { id:'P005', sku:'ATH-0442', name:'Ether-Sync Protocol v2', category:'Software', type:'service', price:29000, cost:5000, margin:82.8, stock:999, reserved:50, available:949, uom:'License', weight:0, volume:0, barcode:'', active:true, description:'Secure distributed synchronization protocol with zero-knowledge encryption. Per-server license.', categoryPath:'Software > Protocols', minStock:0, maxStock:0, leadTime:0 },
  { id:'P006', sku:'ATH-0671', name:'Agentic Relay Stack', category:'Software', type:'stockable', price:18200, cost:10500, margin:42.3, stock:5200, reserved:120, available:5080, uom:'Units', weight:1.8, volume:0.008, barcode:'8901234567895', active:true, description:'Autonomous agent orchestration platform with 500+ pre-built integrations.', categoryPath:'Software > Platforms', minStock:100, maxStock:10000, leadTime:5 },
  { id:'P007', sku:'ATH-SVC-01', name:'Implementation Services', category:'Services', type:'service', price:1500, cost:800, margin:46.7, stock:0, reserved:0, available:0, uom:'Hours', weight:0, volume:0, barcode:'', active:true, description:'Professional services for implementation, training, and customization. Hourly rate.', categoryPath:'Services > Professional', minStock:0, maxStock:0, leadTime:0 },
  { id:'P008', sku:'ATH-SVC-02', name:'Annual Support Plan', category:'Services', type:'service', price:12000, cost:2000, margin:83.3, stock:0, reserved:0, available:0, uom:'Year', weight:0, volume:0, barcode:'', active:true, description:'Comprehensive annual support plan with 24/7 coverage and dedicated account manager.', categoryPath:'Services > Support', minStock:0, maxStock:0, leadTime:0 },
];

// Inventory Data
const WAREHOUSES = [
  { id:'WH001', name:'Main Distribution Center', code:'WH-MAIN', address:'1200 Industrial Blvd', city:'San Francisco', country:'USA', type:'internal', capacity:50000, utilized:32400, status:'active', default:true, supervisor:'John Smith', phone:'+1 555-0200', operatingHours:'24/7', zones:['A','B','C','D'] },
  { id:'WH002', name:'West Coast Hub', code:'WH-WEST', address:'800 Pacific Highway', city:'Los Angeles', country:'USA', type:'internal', capacity:25000, utilized:18200, status:'active', default:false, supervisor:'Lisa Wong', phone:'+1 555-0300', operatingHours:'6AM-10PM', zones:['A','B'] },
  { id:'WH003', name:'European Fulfillment', code:'WH-EU', address:'25 Rue de Commerce', city:'Paris', country:'France', type:'internal', capacity:18000, utilized:9800, status:'active', default:false, supervisor:'Pierre DuPont', phone:'+33 1 23 45 67 00', operatingHours:'8AM-8PM CET', zones:['A','B','C'] },
  { id:'WH004', name:'Dropship Partner Network', code:'WH-DROP', address:'Virtual', city:'', country:'Global', type:'virtual', capacity:0, utilized:0, status:'active', default:false, supervisor:'', phone:'', operatingHours:'Varies', zones:[] },
];

const STOCK_QUANTS = [
  { id:'SQ001', productId:'P001', product:'ATH-0042', warehouseId:'WH001', warehouse:'WH-MAIN', location:'Zone A - Shelf 12', quantity:1847, reserved:240, inDate:'2026-05-15', lotNumber:'LOT-2026-05-001', status:'available' },
  { id:'SQ002', productId:'P001', product:'ATH-0042', warehouseId:'WH002', warehouse:'WH-WEST', location:'Zone B - Shelf 03', quantity:1000, reserved:100, inDate:'2026-06-01', lotNumber:'LOT-2026-06-002', status:'available' },
  { id:'SQ003', productId:'P002', product:'ATH-0108', warehouseId:'WH001', warehouse:'WH-MAIN', location:'Zone A - Shelf 15', quantity:90, reserved:92, inDate:'2026-04-20', lotNumber:'LOT-2026-04-005', status:'partial' },
];

const STOCK_MOVES = [
  { id:'SM001', productId:'P001', productName:'ATH-0042 - Sovereign Core Module', fromWarehouse:'WH-MAIN', toWarehouse:'WH-WEST', quantity:50, uom:'Units', status:'done', scheduled:'2026-07-01', executed:'2026-07-01', reference:'Transfer Request TR-2026-0042', priority:'normal', notes:'Regular inventory rebalancing' },
  { id:'SM002', productId:'P002', productName:'ATH-0108 - Neural Bridge Array', fromWarehouse:'WH-EU', toWarehouse:'WH-MAIN', quantity:100, uom:'Units', status:'confirmed', scheduled:'2026-07-05', executed:'', reference:'Transfer Request TR-2026-0043', priority:'high', notes:'Stock replenishment for upcoming orders' },
  { id:'SM003', productId:'P003', productName:'ATH-0215 - Quantum Lattice Node', fromWarehouse:'WH-MAIN', toWarehouse:'WH-DROP', quantity:25, uom:'Units', status:'draft', scheduled:'2026-07-10', executed:'', reference:'Dropship Order DO-2026-0015', priority:'normal', notes:'Direct fulfillment for customer' },
];

// Accounting Data
const JOURNAL_ENTRIES = [
  { id:'JE001', number:'JE-2026-0842', date:'2026-07-01', journal:'Miscellaneous Operations', reference:'INV-2026-0442', status:'posted', lines:[
    { account:'1200 - Accounts Receivable', debit:247800, credit:0 },
    { account:'4000 - Sales Revenue', debit:0, credit:210000 },
    { account:'2500 - Sales Tax Payable', debit:0, credit:37800 },
  ], created:'2026-07-01', postedBy:'System', partner:'Apex Dynamics Inc' },
  { id:'JE002', number:'JE-2026-0843', date:'2026-07-01', journal:'Bank', reference:'PAY-2026-0442', status:'posted', lines:[
    { account:'1100 - Bank Account', debit:50000, credit:0 },
    { account:'1200 - Accounts Receivable', debit:0, credit:50000 },
  ], created:'2026-07-01', postedBy:'Sarah Johnson', partner:'Apex Dynamics Inc' },
];

const INVOICES = [
  { id:'INV001', number:'INV-2026-0442', type:'out_invoice', partner:'Apex Dynamics Inc', partnerId:'C001', date:'2026-07-01', dueDate:'2026-07-31', lines:[
    { product:'ATH-0042', name:'Sovereign Core Module', quantity:5, price:42000, subtotal:210000 },
  ], subtotal:210000, tax:37800, total:247800, paid:50000, residual:197800, status:'posted', paymentReference:'', deliveryRef:'SO-2026-0087' },
  { id:'INV002', number:'INV-2026-0443', type:'out_invoice', partner:'Quantum Gate Ltd', partnerId:'', date:'2026-05-20', dueDate:'2026-06-05', lines:[
    { product:'ATH-0671', name:'Agentic Relay Stack', quantity:3, price:18200, subtotal:54600 },
  ], subtotal:54600, tax:9828, total:64428, paid:64428, residual:0, status:'paid', paymentReference:'PAY-2026-0288', deliveryRef:'SO-2026-0089' },
  { id:'INV003', number:'BILL-2026-0188', type:'in_invoice', partner:'TechSupply Co', partnerId:'', date:'2026-06-30', dueDate:'2026-07-30', lines:[
    { product:'ATH-0042', name:'Sovereign Core Module', quantity:25, price:26500, subtotal:662500 },
  ], subtotal:662500, tax:119250, total:781750, paid:0, residual:781750, status:'posted', paymentReference:'', deliveryRef:'PO-2026-0156' },
];

const PAYMENTS = [
  { id:'PAY001', number:'PAY-2026-0442', type:'inbound', partner:'Apex Dynamics Inc', amount:50000, date:'2026-07-01', method:'bank_transfer', state:'posted', invoiceRef:'INV-2026-0442', journal:'Bank', memo:'Partial payment for INV-2026-0442' },
  { id:'PAY002', number:'PAY-2026-0288', type:'inbound', partner:'Quantum Gate Ltd', amount:64428, date:'2026-06-05', method:'wire', state:'posted', invoiceRef:'INV-2026-0443', journal:'Bank', memo:'Full payment' },
];

const CHART_OF_ACCOUNTS = [
  { code:'1000', name:'Assets', type:'view', parent:'', balance:1270000 },
  { code:'1100', name:'Bank Accounts', type:'liquidity', parent:'1000', balance:428000 },
  { code:'1200', name:'Accounts Receivable', type:'receivable', parent:'1000', balance:247800 },
  { code:'1210', name:'Receivables - USA', type:'receivable', parent:'1200', balance:180000 },
  { code:'1220', name:'Receivables - International', type:'receivable', parent:'1200', balance:67800 },
  { code:'1300', name:'Inventory', type:'other', parent:'1000', balance:420000 },
  { code:'1700', name:'Fixed Assets', type:'other', parent:'1000', balance:800000 },
  { code:'2000', name:'Liabilities', type:'view', parent:'', balance:580000 },
  { code:'2100', name:'Accounts Payable', type:'payable', parent:'2000', balance:781750 },
  { code:'2500', name:'Sales Tax Payable', type:'other', parent:'2000', balance:57778 },
  { code:'3000', name:'Equity', type:'view', parent:'', balance:890000 },
  { code:'4000', name:'Sales Revenue', type:'other', parent:'3000', balance:1250000 },
  { code:'5000', name:'Cost of Goods Sold', type:'other', parent:'3000', balance:420000 },
  { code:'6000', name:'Operating Expenses', type:'other', parent:'3000', balance:180000 },
];

// HR Data
const EMPLOYEES = [
  { id:'E001', firstName:'Sarah', lastName:'Johnson', email:'sarah.johnson@elsx.io', phone:'+1 555-0101', department:'Sales', jobTitle:'Senior Account Executive', manager:'E005', hireDate:'2024-03-15', birthDate:'1990-05-22', status:'active', salary:95000, bankAccount:'****4521', address:'123 Oak Street, San Francisco, CA', emergencyContact:'John Johnson +1 555-9001', skills:['Negotiation', 'CRM', 'Enterprise Sales'], certifications:['Salesforce Certified', 'HubSpot Certified'] },
  { id:'E002', firstName:'Mike', lastName:'Peters', email:'mike.peters@elsx.io', phone:'+1 555-0102', department:'Sales', jobTitle:'Account Executive', manager:'E005', hireDate:'2025-01-10', birthDate:'1988-11-03', status:'active', salary:78000, bankAccount:'****8923', address:'456 Elm Avenue, Austin, TX', emergencyContact:'Maria Peters +1 555-9002', skills:['Account Management', 'Presentations'], certifications:['Solution Selling'] },
  { id:'E003', firstName:'Emma', lastName:'Wilson', email:'emma.wilson@elsx.io', phone:'+1 555-0103', department:'Sales', jobTitle:'Account Executive', manager:'E005', hireDate:'2024-09-01', birthDate:'1992-07-14', status:'active', salary:82000, bankAccount:'****1247', address:'789 Pine Road, Los Angeles, CA', emergencyContact:'Robert Wilson +1 555-9003', skills:['Technical Sales', 'API Knowledge'], certifications:['Technical Sales Professional'] },
  { id:'E004', firstName:'Alex', lastName:'Kumar', email:'alex.kumar@elsx.io', phone:'+1 555-0104', department:'Marketing', jobTitle:'Marketing Manager', manager:'E005', hireDate:'2023-06-20', birthDate:'1991-02-28', status:'active', salary:105000, bankAccount:'****5678', address:'321 Birch Lane, San Francisco, CA', emergencyContact:'Priya Kumar +1 555-9004', skills:['Digital Marketing', 'Content Strategy', 'Analytics'], certifications:['Google Analytics', 'HubSpot Marketing'] },
  { id:'E005', firstName:'James', lastName:'Mitchell', email:'james.mitchell@elsx.io', phone:'+1 555-0105', department:'Executive', jobTitle:'VP of Sales', manager:'', hireDate:'2020-01-15', birthDate:'1982-09-10', status:'active', salary:185000, bankAccount:'****9012', address:'555 Maple Drive, San Francisco, CA', emergencyContact:'Jennifer Mitchell +1 555-9005', skills:['Leadership', 'Strategy', 'Enterprise Sales'], certifications:['MBA Stanford'] },
  { id:'E006', firstName:'Linda', lastName:'Zhang', email:'linda.zhang@elsx.io', phone:'+1 555-0106', department:'Engineering', jobTitle:'Lead Engineer', manager:'E007', hireDate:'2022-04-01', birthDate:'1993-12-05', status:'active', salary:125000, bankAccount:'****3456', address:'888 Cedar Court, Mountain View, CA', emergencyContact:'Wei Zhang +1 555-9006', skills:['React', 'Node.js', 'AWS', 'System Design'], certifications:['AWS Solutions Architect'] },
  { id:'E007', firstName:'Robert', lastName:'Chen', email:'robert.chen@elsx.io', phone:'+1 555-0107', department:'Engineering', jobTitle:'CTO', manager:'', hireDate:'2019-08-01', birthDate:'1979-04-18', status:'active', salary:250000, bankAccount:'****7890', address:'100 Tech Plaza, Palo Alto, CA', emergencyContact:'Mei Chen +1 555-9007', skills:['Architecture', 'AI/ML', 'Leadership'], certifications:['PhD Computer Science MIT'] },
];

const LEAVE_REQUESTS = [
  { id:'LR001', employeeId:'E001', employeeName:'Sarah Johnson', type:'annual', startDate:'2026-07-15', endDate:'2026-07-22', days:5, reason:'Family vacation to Hawaii', status:'approved', approvedBy:'James Mitchell', approvedOn:'2026-07-01', notes:'Coverage arranged with Emma' },
  { id:'LR002', employeeId:'E003', employeeName:'Emma Wilson', type:'sick', startDate:'2026-07-03', endDate:'2026-07-03', days:1, reason:'Medical appointment', status:'confirmed', approvedBy:'', approvedOn:'', notes:'Doctor appointment at 2PM' },
  { id:'LR003', employeeId:'E002', employeeName:'Mike Peters', type:'annual', startDate:'2026-08-10', endDate:'2026-08-14', days:5, reason:'Personal leave', status:'draft', approvedBy:'', approvedOn:'', notes:'Pending manager approval' },
];

const TIMESHEETS = [
  { id:'TS001', employeeId:'E001', employeeName:'Sarah Johnson', date:'2026-07-01', project:'Apex Dynamics Integration', task:'Demo preparation', hours:8, description:'Prepared demo environment and presentation', billable:true, status:'confirmed' },
  { id:'TS002', employeeId:'E001', employeeName:'Sarah Johnson', date:'2026-07-02', project:'Apex Dynamics Integration', task:'Client meeting', hours:4, description:'Product demo with IT team', billable:true, status:'confirmed' },
  { id:'TS003', employeeId:'E006', employeeName:'Linda Zhang', date:'2026-07-01', project:'Platform v3', task:'API development', hours:6, description:'Implemented new endpoints for ERP module', billable:false, status:'approved' },
];

// Project Data
const PROJECTS = [
  { id:'PRJ001', name:'Apex Dynamics Integration', customer:'Apex Dynamics Inc', customerId:'C001', manager:'Linda Zhang', startDate:'2026-06-01', endDate:'2026-09-30', budget:420000, spent:125000, status:'in_progress', progress:35, taskCount:24, tasksDone:8, color: '#22d3ee', description:'Full ERP implementation for Apex Dynamics including CRM, Sales, and Inventory modules.', milestones:['Discovery','Design','Development','Testing','Deployment'] },
  { id:'PRJ002', name:'Horizon Tech Migration', customer:'Horizon Tech', customerId:'C003', manager:'Linda Zhang', startDate:'2026-07-15', endDate:'2026-12-31', budget:280000, spent:0, status:'planned', progress:0, taskCount:18, tasksDone:0, color: '#a78bfa', description:'Migration from legacy SAP to ELSX ERP system.', milestones:['Planning','Data Migration','Training','Go-Live'] },
  { id:'PRJ003', name:'Platform v3 Development', customer:'ELSX Internal', customerId:'', manager:'Robert Chen', startDate:'2026-01-01', endDate:'2026-06-30', budget:150000, spent:142000, status:'completed', progress:100, taskCount:32, tasksDone:32, color: '#34d399', description:'Internal development project for ELSX Platform v3 with new ERP module.', milestones:['Planning','Alpha','Beta','Release'] },
];

const PROJECT_TASKS = [
  { id:'T001', name:'API Gateway Setup', project:'PRJ001', projectName:'Apex Dynamics Integration', milestone:'Design', assignee:'E006', assigneeName:'Linda Zhang', stage:'done', priority:'high', startDate:'2026-06-01', endDate:'2026-06-15', estimatedHours:40, spentHours:38, progress:100, description:'Configure API gateway and rate limiting layer', dependencies:[], tags:['Backend','Infrastructure'] },
  { id:'T002', name:'Database Migration', project:'PRJ001', projectName:'Apex Dynamics Integration', milestone:'Development', assignee:'E006', assigneeName:'Linda Zhang', stage:'in_progress', priority:'high', startDate:'2026-06-10', endDate:'2026-07-05', estimatedHours:80, spentHours:45, progress:55, description:'Migrate legacy data to new database schema', dependencies:['T001'], tags:['Backend','Database'] },
  { id:'T003', name:'UI Dashboard', project:'PRJ001', projectName:'Apex Dynamics Integration', milestone:'Development', assignee:'E004', assigneeName:'Alex Kumar', stage:'todo', priority:'medium', startDate:'2026-07-15', endDate:'2026-08-01', estimatedHours:60, spentHours:0, progress:0, description:'Build custom analytics dashboard', dependencies:['T002'], tags:['Frontend','Analytics'] },
  { id:'T004', name:'Integration Testing', project:'PRJ001', projectName:'Apex Dynamics Integration', milestone:'Testing', assignee:'E001', assigneeName:'Sarah Johnson', stage:'todo', priority:'medium', startDate:'2026-08-15', endDate:'2026-09-01', estimatedHours:50, spentHours:0, progress:0, description:'End-to-end integration tests', dependencies:['T002','T003'], tags:['QA','Testing'] },
  { id:'T005', name:'Requirements Gathering', project:'PRJ002', projectName:'Horizon Tech Migration', milestone:'Planning', assignee:'E002', assigneeName:'Mike Peters', stage:'in_progress', priority:'critical', startDate:'2026-07-15', endDate:'2026-08-01', estimatedHours:30, spentHours:12, progress:40, description:'Document all system requirements', dependencies:[], tags:['Planning','Client'] },
];

// Helpdesk Data
const TICKETS = [
  { id:'TKT001', number:'TKT-2026-0042', subject:'Login issue on mobile app', customer:'Apex Dynamics Inc', contact:'Marcus Chen', priority:'high', stage:'in_progress', assignedTo:'Support Team', category:'Technical', createDate:'2026-07-02', lastUpdate:'2026-07-03', slaStatus:'within', messages:3, description:'User unable to login using SSO on mobile app. Getting error code AUTH-5003' },
  { id:'TKT002', number:'TKT-2026-0043', subject:'Invoice not showing in portal', customer:'Nova Ventures LLC', contact:'Elena Rodriguez', priority:'medium', stage:'new', assignedTo:'', category:'Billing', createDate:'2026-07-03', lastUpdate:'2026-07-03', slaStatus:'within', messages:1, description:'Invoice INV-2026-0442 not appearing in customer portal despite being sent.' },
  { id:'TKT003', number:'TKT-2026-0044', subject:'Feature request: Custom reports', customer:'Horizon Tech', contact:'James Okonkwo', priority:'low', stage:'pending_customer', assignedTo:'', category:'Feature Request', createDate:'2026-06-28', lastUpdate:'2026-07-01', slaStatus:'within', messages:5, description:'Request for custom financial reports with specific KPIs' },
];

// POS Data
const POS_PRODUCTS = PRODUCTS.filter(p => p.type === 'stockable').slice(0, 6);
const POS_CATEGORIES = ['Hardware', 'Software', 'Services'];

// Manufacturing Data
const MANUFACTURING_ORDERS = [
  { id:'MO001', number:'MO-2026-0089', product:'P001', productName:'ATH-0042', quantity:25, bom:'BOM-ATH-0042', status:'in_progress', startDate:'2026-07-01', endDate:'2026-07-08', workcenter:'Assembly Line A', rawMaterials:[{ product:'P002', name:'ATH-0108', required:50, consumed:25 }], finishedGoods:0, priority:'normal' },
  { id:'MO002', number:'MO-2026-0090', product:'P003', productName:'ATH-0215', quantity:100, bom:'BOM-ATH-0215', status:'confirmed', startDate:'2026-07-10', endDate:'2026-07-15', workcenter:'Assembly Line B', rawMaterials:[], finishedGoods:0, priority:'high' },
  { id:'MO003', number:'MO-2026-0088', product:'P006', productName:'ATH-0671', quantity:50, bom:'BOM-ATH-0671', status:'done', startDate:'2026-06-20', endDate:'2026-06-28', workcenter:'Packaging', rawMaterials:[{ product:'P001', name:'ATH-0042', required:50, consumed:50 }], finishedGoods:50, priority:'normal' },
];

const BILL_OF_MATERIALS = [
  { id:'BOM001', name:'BOM-ATH-0042', productId:'P001', productName:'ATH-0042', quantity:1, lines:[
    { productId:'P002', productName:'ATH-0108', quantity:2, uom:'Units' },
    { productId:'P003', productName:'ATH-0215', quantity:1, uom:'Units' },
  ], operations:[
    { workcenter:'Assembly Line A', duration:45, cost:500 },
    { workcenter:'Quality Check', duration:15, cost:100 },
  ], status:'active', version:'2.1' },
  { id:'BOM002', name:'BOM-ATH-0671', productId:'P006', productName:'ATH-0671', quantity:1, lines:[
    { productId:'P001', productName:'ATH-0042', quantity:1, uom:'Units' },
  ], operations:[
    { workcenter:'Assembly Line B', duration:30, cost:350 },
    { workcenter:'Packaging', duration:15, cost:100 },
  ], status:'active', version:'1.0' },
];

// Purchasing Data
const VENDORS = [
  { id:'V001', name:'TechSupply Co', email:'orders@techsupply.com', phone:'+1 800-555-0101', address:'1000 Supplier Ave, Chicago, IL', country:'USA', currency:'USD', paymentTerms:'Net 30', leadTime:7, rating:4.8, products:['ATH-0042','ATH-0215'], totalPurchased:450000, status:'active' },
  { id:'V002', name:'ComponentHub GmbH', email:'sales@componenthub.de', phone:'+49 30 12345', address:'Musterstraße 42, Berlin', country:'Germany', currency:'EUR', paymentTerms:'Net 45', leadTime:14, rating:4.2, products:['ATH-0108','ATH-0671'], totalPurchased:280000, status:'active' },
  { id:'V003', name:'AsiaParts Ltd', email:'inquiry@asiaparts.hk', phone:'+852 1234 5678', address:'88 Harbour Road, Hong Kong', country:'Hong Kong', currency:'HKD', paymentTerms:'Net 60', leadTime:21, rating:3.9, products:['ATH-0319','ATH-0553'], totalPurchased:120000, status:'active' },
];

const PURCHASE_ORDERS = [
  { id:'PO001', number:'PO-2026-0156', vendor:'TechSupply Co', vendorId:'V001', date:'2026-06-25', deliveryDate:'2026-07-05', lines:[
    { id:'POL1', product:'ATH-0042', name:'Sovereign Core Module', quantity:50, unitPrice:26500, discount:0, subtotal:1325000, received:0, uom:'Units' },
  ], subtotal:1325000, tax:238500, total:1563500, status:'confirmed', currency:'USD', paymentTerms:'Net 30', warehouse:'WH-MAIN' },
  { id:'PO002', number:'PO-2026-0157', vendor:'ComponentHub GmbH', vendorId:'V002', date:'2026-07-01', deliveryDate:'2026-07-20', lines:[
    { id:'POL2', product:'ATH-0108', name:'Neural Bridge Array', quantity:100, unitPrice:5200, discount:5, subtotal:494000, received:0, uom:'Units' },
  ], subtotal:494000, tax:88920, total:582920, status:'sent', currency:'EUR', paymentTerms:'Net 45', warehouse:'WH-MAIN' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function Badge({ children, variant = 'default', size = 'sm', className = '' }: { children: React.ReactNode; variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple'; size?: 'xs' | 'sm' | 'md' | 'lg'; className?: string }) {
  const colors: Record<string, string> = {
    default: 'bg-white/10 text-white/60 border-white/15',
    success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    warning: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    danger: 'bg-red-500/15 text-red-400 border-red-500/25',
    info: 'bg-sky-500/15 text-sky-400 border-sky-500/25',
    purple: 'bg-violet-500/15 text-violet-400 border-violet-500/25',
  };
  const sizes: Record<string, string> = { xs: 'text-[7px] px-1 py-0.5', sm: 'text-[8px] px-1.5 py-0.5', md: 'text-[9px] px-2 py-1', lg: 'text-[10px] px-2.5 py-1' };
  return <span className={`inline-flex items-center gap-1 rounded font-medium border ${colors[variant]} ${sizes[size]} ${className}`}>{children}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple'; label: string }> = {
    draft: { variant: 'default', label: 'Draft' },
    sent: { variant: 'info', label: 'Sent' },
    confirmed: { variant: 'warning', label: 'Confirmed' },
    posted: { variant: 'purple', label: 'Posted' },
    approved: { variant: 'success', label: 'Approved' },
    paid: { variant: 'success', label: 'Paid' },
    done: { variant: 'success', label: 'Done' },
    delivered: { variant: 'success', label: 'Delivered' },
    invoiced: { variant: 'purple', label: 'Invoiced' },
    cancelled: { variant: 'danger', label: 'Cancelled' },
    active: { variant: 'success', label: 'Active' },
    inactive: { variant: 'default', label: 'Inactive' },
    planned: { variant: 'info', label: 'Planned' },
    in_progress: { variant: 'warning', label: 'In Progress' },
    completed: { variant: 'success', label: 'Completed' },
    on_hold: { variant: 'danger', label: 'On Hold' },
    new: { variant: 'info', label: 'New' },
    qualified: { variant: 'purple', label: 'Qualified' },
    proposal: { variant: 'warning', label: 'Proposal' },
    negotiation: { variant: 'warning', label: 'Negotiation' },
    won: { variant: 'success', label: 'Won' },
    lost: { variant: 'danger', label: 'Lost' },
    todo: { variant: 'default', label: 'To Do' },
    review: { variant: 'info', label: 'Review' },
    critical: { variant: 'danger', label: 'Critical' },
    idle: { variant: 'default', label: 'Idle' },
    error: { variant: 'danger', label: 'Error' },
    pending_customer: { variant: 'warning', label: 'Awaiting Customer' },
    within: { variant: 'success', label: 'Within SLA' },
    overdue: { variant: 'danger', label: 'Overdue' },
  };
  const s = map[status] || { variant: 'default', label: status };
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

function KPI({ label, value, change, icon: Icon, color, trend }: { label: string; value: string | number; change?: string; icon: typeof TrendUp; color: string; trend?: 'up' | 'down' | 'neutral' }) {
  return (
    <div className="rounded-xl p-3 bg-white/[0.04] border border-white/8 hover:bg-white/[0.06] transition-colors">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={10} className={color} />
        <span className="text-[8px] text-white/35 uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-lg font-light font-mono ${color}`}>{value}</p>
      {change && (
        <p className={`text-[8px] mt-1 ${trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-white/40'}`}>{change}</p>
      )}
    </div>
  );
}

function ActionButton({ icon: Icon, label, onClick, variant = 'default', size = 'sm' }: { icon: typeof Plus; label: string; onClick?: () => void; variant?: 'default' | 'primary' | 'success' | 'danger' | 'warning'; size?: 'xs' | 'sm' | 'md' }) {
  const variants = {
    default: 'bg-white/5 border-white/15 text-white/70 hover:bg-white/10',
    primary: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/25',
    success: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25',
    danger: 'bg-red-500/15 border-red-500/30 text-red-400 hover:bg-red-500/25',
    warning: 'bg-amber-500/15 border-amber-500/30 text-amber-400 hover:bg-amber-500/25',
  };
  const sizes = { xs: 'px-1.5 py-1 text-[8px]', sm: 'px-2.5 py-1.5 text-[9px]', md: 'px-3 py-2 text-[10px]' };
  return (
    <button onClick={onClick} className={`flex items-center gap-1.5 rounded-lg border font-medium transition-all ${variants[variant]} ${sizes[size]}`}>
      <Icon size={12} /> {label}
    </button>
  );
}

function Modal({ open, onClose, title, children, width = 'lg', footer }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; width?: 'sm' | 'md' | 'lg' | 'xl' | 'full'; footer?: React.ReactNode }) {
  if (!open) return null;
  const widths: Record<string, string> = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl', full: 'max-w-6xl' };
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className={`card-glass rounded-2xl ${widths[width]} w-full border border-white/15 shadow-2xl max-h-[90vh] flex flex-col`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <h3 className="text-sm font-semibold text-white/90">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-white/10 shrink-0">{footer}</div>}
      </div>
    </div>
  );
}

function Drawer({ open, onClose, title, children, side = 'right' }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; side?: 'left' | 'right' }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`absolute top-0 ${side === 'right' ? 'right-0' : 'left-0'} h-full w-[480px] max-w-full bg-slate-950 border-l border-white/10 shadow-2xl flex flex-col`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <h3 className="text-sm font-semibold text-white/90">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/80"><X size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

function FormField({ label, children, required, help }: { label: string; children: React.ReactNode; required?: boolean; help?: string }) {
  return (
    <div className="space-y-1">
      <label className="text-[9px] text-white/50 uppercase tracking-wider flex items-center gap-1">
        {label}
        {required && <span className="text-red-400">*</span>}
        {help && <HelpCircle size={10} className="text-white/25" />}
      </label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = 'text', className = '' }: { value: string | number; onChange: (v: string) => void; placeholder?: string; type?: 'text' | 'number' | 'date' | 'email' | 'tel'; className?: string }) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className={`w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/15 text-[10px] text-white/80 placeholder-white/25 outline-none focus:border-cyan-500/50 focus:bg-white/[0.07] transition-all ${className}`} />
  );
}

function TextArea({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/15 text-[10px] text-white/80 placeholder-white/25 outline-none focus:border-cyan-500/50 transition-all resize-none" />
  );
}

function Select({ value, onChange, options, placeholder = 'Select...' }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; placeholder?: string }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/15 text-[10px] text-white/80 outline-none focus:border-cyan-500/50 transition-all cursor-pointer">
      <option value="" disabled className="bg-slate-900">{placeholder}</option>
      {options.map(o => <option key={o.value} value={o.value} className="bg-slate-900">{o.label}</option>)}
    </select>
  );
}

function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <div className={`w-4 h-4 rounded border ${checked ? 'bg-cyan-500/30 border-cyan-500/60' : 'bg-white/5 border-white/20'} flex items-center justify-center transition-all`}
        onClick={() => onChange(!checked)}>
        {checked && <CheckCircle size={10} className="text-cyan-400" />}
      </div>
      {label && <span className="text-[10px] text-white/70">{label}</span>}
    </label>
  );
}

function Tabs({ tabs, active, onChange, size = 'sm' }: { tabs: { id: string; label: string; count?: number; icon?: typeof Plus }[]; active: string; onChange: (id: string) => void; size?: 'xs' | 'sm' | 'md' }) {
  const sizes = { xs: 'px-2 py-1 text-[8px]', sm: 'px-3 py-1.5 text-[9px]', md: 'px-4 py-2 text-[10px]' };
  return (
    <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl border border-white/10 shrink-0">
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)}
          className={`flex items-center gap-1.5 ${sizes[size]} rounded-lg font-medium transition-all ${
            active === t.id ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30' : 'text-white/40 hover:text-white/60 hover:bg-white/5 border border-transparent'
          }`}>
          {t.icon && <t.icon size={12} />}
          {t.label}
          {t.count !== undefined && <span className="text-[8px] px-1 py-0.5 rounded bg-white/10">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

function ViewSwitcher({ view, onChange, views }: { view: ViewMode; onChange: (v: ViewMode) => void; views: ViewMode[] }) {
  const icons: Record<ViewMode, typeof List> = { list: List, kanban: Kanban, calendar: Calendar, gantt: GanttChart, pivot: PieChart, graph: BarChart3, map: MapPin, activity: Activity };
  return (
    <div className="flex items-center gap-0.5 p-1 bg-white/5 rounded-lg border border-white/10 shrink-0">
      {views.map(v => {
        const Icon = icons[v];
        return (
          <button key={v} onClick={() => onChange(v)}
            className={`p-1.5 rounded-lg transition-all ${view === v ? 'bg-cyan-500/20 text-cyan-400' : 'text-white/30 hover:text-white/60'}`}>
            <Icon size={12} />
          </button>
        );
      })}
    </div>
  );
}

function DataTable({ columns, data, onRowClick, pageSize = 10, selectable = false, selectedIds = [], onSelectionChange }: {
  columns: { key: string; label: string; render?: (v: any, row: any) => React.ReactNode; sortable?: boolean; width?: string; align?: 'left' | 'center' | 'right' }[];
  data: any[];
  onRowClick?: (row: any) => void;
  pageSize?: number;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
}) {
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null);
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState('');

  const sorted = useMemo(() => {
    let filtered = data.filter(row =>
      Object.values(row).some(v => String(v).toLowerCase().includes(filter.toLowerCase()))
    );
    if (sort) {
      filtered = [...filtered].sort((a, b) => {
        const va = a[sort.key]; const vb = b[sort.key];
        const cmp = typeof va === 'string' ? va.localeCompare(vb) : (va ?? 0) - (vb ?? 0);
        return sort.dir === 'asc' ? cmp : -cmp;
      });
    }
    return filtered;
  }, [data, sort, filter]);

  const paginated = sorted.slice(page * pageSize, page * pageSize + pageSize);
  const totalPages = Math.ceil(sorted.length / pageSize);

  const toggleAll = () => {
    if (selectedIds.length === paginated.length) {
      onSelectionChange?.([]);
    } else {
      onSelectionChange?.(paginated.map(r => r.id));
    }
  };

  const toggleRow = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange?.(selectedIds.filter(i => i !== id));
    } else {
      onSelectionChange?.([...selectedIds, id]);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-3 mb-3 shrink-0">
        <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-xl border border-white/10 bg-white/5">
          <Search size={11} className="text-white/30" />
          <input type="text" placeholder="Search records..." value={filter} onChange={e => { setFilter(e.target.value); setPage(0); }}
            className="flex-1 bg-transparent text-[10px] text-white/80 placeholder-white/30 outline-none" />
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[9px] text-white/50 border border-white/10 hover:bg-white/5 transition-colors">
            <Filter size={12} /> Filters
          </button>
          <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[9px] text-white/50 border border-white/10 hover:bg-white/5 transition-colors">
            <Columns size={12} /> Columns
          </button>
          <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[9px] text-white/50 border border-white/10 hover:bg-white/5 transition-colors">
            <Download size={12} /> Export
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto rounded-xl border border-white/8">
        <table className="w-full text-[10px]">
          <thead className="sticky top-0 bg-slate-900/95 backdrop-blur z-10">
            <tr className="border-b border-white/10">
              {selectable && (
                <th className="w-10 px-3 py-3">
                  <Checkbox checked={selectedIds.length === paginated.length && paginated.length > 0} onChange={toggleAll} />
                </th>
              )}
              {columns.map(col => (
                <th key={col.key} className={`px-4 py-3 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} font-medium text-white/40 ${col.width || ''}`}>
                  {col.sortable !== false ? (
                    <button onClick={() => setSort(s => s?.key === col.key ? { key: col.key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key: col.key, dir: 'asc' })}
                      className="flex items-center gap-1 hover:text-white/70 transition-colors">
                      {col.label}
                      {sort?.key === col.key ? (sort.dir === 'asc' ? <SortAsc size={9} className="text-cyan-400" /> : <SortDesc size={9} className="text-cyan-400" />) : <SortAsc size={9} className="opacity-20" />}
                    </button>
                  ) : col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map((row, i) => (
              <tr key={row.id || i}
                onClick={() => onRowClick?.(row)}
                className={`border-b border-white/5 transition-colors ${onRowClick ? 'cursor-pointer hover:bg-white/5' : ''} ${selectedIds.includes(row.id) ? 'bg-cyan-500/10' : ''} ${i % 2 === 0 ? '' : 'bg-white/[0.015]'}`}>
                {selectable && (
                  <td className="px-3 py-2.5">
                    <div onClick={e => e.stopPropagation()}>
                      <Checkbox checked={selectedIds.includes(row.id)} onChange={() => toggleRow(row.id)} />
                    </div>
                  </td>
                )}
                {columns.map(col => (
                  <td key={col.key} className={`px-4 py-2.5 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''}`}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr><td colSpan={columns.length + (selectable ? 1 : 0)} className="px-4 py-12 text-center text-white/30 text-[10px]">No records found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-3 shrink-0 text-[9px] text-white/30">
        <span>{sorted.length} records</span>
        <div className="flex items-center gap-1">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            className="p-1 rounded hover:bg-white/5 disabled:opacity-30"><ChevronLeft size={14} /></button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => (
            <button key={i} onClick={() => setPage(i)}
              className={`w-6 h-6 rounded text-[9px] ${i === page ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'hover:bg-white/5'}`}>
              {i + 1}
            </button>
          ))}
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
            className="p-1 rounded hover:bg-white/5 disabled:opacity-30"><ChevronRight size={14} /></button>
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-white/30">
      <RefreshCw size={24} className="animate-spin mb-3" />
      <p className="text-[10px]">Loading...</p>
    </div>
  );
}

function EmptyState({ icon: Icon, title, description, action }: { icon: typeof Package; title: string; description: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-white/30">
      <Icon size={40} className="mb-4 opacity-40" />
      <p className="text-[12px] font-medium text-white/50 mb-1">{title}</p>
      <p className="text-[10px] text-white/30 text-center max-w-xs">{description}</p>
      {action && (
        <button onClick={action.onClick} className="mt-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-[10px]">
          <Plus size={12} /> {action.label}
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SVG CHARTS
// ═══════════════════════════════════════════════════════════════════════════════

function LineChartSVG({ data, color, height = 80 }: { data: number[]; color: string; height?: number }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 300; const h = height;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 12);
    return `${x},${y}`;
  }).join(' ');
  const area = `0,${h} ${pts} ${w},${h}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`fill-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#fill-${color})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((v, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h - ((v - min) / range) * (h - 12);
        return <circle key={i} cx={x} cy={y} r="3" fill={color} />;
      })}
    </svg>
  );
}

function BarChartSVG({ data, color, labels, height = 80 }: { data: number[]; color: string; labels: string[]; height?: number }) {
  const max = Math.max(...data);
  const w = 300; const h = height; const gap = 6;
  const barW = (w - gap * (data.length - 1)) / data.length;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`bar-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.9" />
          <stop offset="100%" stopColor={color} stopOpacity="0.6" />
        </linearGradient>
      </defs>
      {data.map((v, i) => {
        const bh = (v / max) * (h - 24);
        const x = i * (barW + gap);
        const y = h - bh - 16;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={bh} rx="3" fill={`url(#bar-${color})`} />
            <text x={x + barW / 2} y={h - 4} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="8">{labels[i]}</text>
          </g>
        );
      })}
    </svg>
  );
}

function DonutChartSVG({ segments, size = 100, centerText }: { segments: { label: string; value: number; color: string }[]; size?: number; centerText?: string }) {
  const total = segments.reduce((a, s) => a + s.value, 0);
  const r = size / 2 - 12; const cx = size / 2; const cy = size / 2; const stroke = 12;
  let offset = 0;
  const circ = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
        {segments.map((s, i) => {
          const pct = s.value / total;
          const dash = circ * pct;
          const gap = circ - dash;
          const rotate = -90 + (offset / total) * 360;
          offset += s.value;
          return (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color}
              strokeWidth={stroke} strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={0}
              transform={`rotate(${rotate} ${cx} ${cy})`} strokeLinecap="round" />
          );
        })}
        <text x={cx} y={cy - 4} textAnchor="middle" fill="white" fontSize="12" fontWeight="600">{centerText || total.toFixed(0)}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="7">Total</text>
      </svg>
      <div className="space-y-1.5 flex-1">
        {segments.map(s => (
          <div key={s.label} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
              <span className="text-[9px] text-white/50">{s.label}</span>
            </div>
            <span className="text-[9px] font-mono text-white/70">{((s.value / total) * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgressBar({ value, max, color, showLabel = true }: { value: number; max: number; color?: string; showLabel?: boolean }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: color || 'linear-gradient(90deg, #22d3ee, #34d399)' }} />
      </div>
      {showLabel && <span className="text-[8px] text-white/40 w-8">{pct.toFixed(0)}%</span>}
    </div>
  );
}

function CalendarWidget({ events, selectedDate, onDateSelect }: { events: typeof ACTIVITIES; selectedDate: Date; onDateSelect: (d: Date) => void }) {
  const today = new Date();
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-white/70">
          {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </span>
        <div className="flex gap-1">
          <button onClick={() => onDateSelect(new Date(year, month - 1, 1))} className="p-1 rounded hover:bg-white/10 text-white/40"><ChevronLeft size={12} /></button>
          <button onClick={() => onDateSelect(new Date(year, month + 1, 1))} className="p-1 rounded hover:bg-white/10 text-white/40"><ChevronRight size={12} /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[8px] text-white/30">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          if (!day) return <div key={i} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
          const dayEvents = getEventsForDay(day);
          return (
            <button key={i}
              className={`relative w-7 h-7 rounded-lg text-[9px] flex flex-col items-center justify-center transition-all ${
                isToday ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'hover:bg-white/5 text-white/70'
              } ${dayEvents.length > 0 ? 'font-semibold' : ''}`}>
              {day}
              {dayEvents.length > 0 && <div className="absolute bottom-0.5 w-1 h-1 rounded-full bg-cyan-400" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ActivityFeed({ activities }: { activities: typeof ACTIVITIES }) {
  const typeIcons: Record<string, typeof Phone> = { meeting: Users, call: Phone, email: Mail, task: ListTodo, note: FileText };
  const typeColors: Record<string, string> = { meeting: 'bg-violet-500/15 text-violet-400', call: 'bg-cyan-500/15 text-cyan-400', email: 'bg-amber-500/15 text-amber-400', task: 'bg-emerald-500/15 text-emerald-400' };

  return (
    <div className="space-y-2">
      {activities.slice(0, 5).map(a => {
        const Icon = typeIcons[a.type] || FileText;
        return (
          <div key={a.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${typeColors[a.type] || 'bg-white/10'}`}>
              <Icon size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-white/80 truncate">{a.subject}</p>
              <p className="text-[8px] text-white/30">{a.date} {a.time} · {a.assignedTo}</p>
            </div>
            <StatusBadge status={a.status} />
          </div>
        );
      })}
    </div>
  );
}

function Timeline({ items }: { items: { date: string; title: string; description: string; icon?: typeof CheckCircle; color?: string }[] }) {
  return (
    <div className="relative pl-6">
      <div className="absolute left-2 top-2 bottom-2 w-px bg-white/10" />
      {items.map((item, i) => (
        <div key={i} className="relative pb-4 last:pb-0">
          <div className={`absolute left-[-16px] w-3 h-3 rounded-full border-2 ${item.color || 'bg-cyan-500/20 border-cyan-500/40'}`} />
          <div className="text-[8px] text-white/30 mb-1">{item.date}</div>
          <div className="text-[10px] font-medium text-white/80">{item.title}</div>
          <div className="text-[9px] text-white/40">{item.description}</div>
        </div>
      ))}
    </div>
  );
}

function Wizard({ steps, currentStep, onStepChange, children }: { steps: { id: string; label: string; icon?: typeof Users }[]; currentStep: number; onStepChange: (i: number) => void; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <button onClick={() => onStepChange(i)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-medium transition-all ${
                i === currentStep ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30' :
                i < currentStep ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                'text-white/40 border border-white/10'
              }`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] ${
                i === currentStep ? 'bg-cyan-500/30' : i < currentStep ? 'bg-emerald-500/20' : 'bg-white/10'
              }`}>
                {i < currentStep ? '✓' : i + 1}
              </div>
              {s.label}
            </button>
            {i < steps.length - 1 && <div className="w-4 h-px bg-white/20 mx-1" />}
          </div>
        ))}
      </div>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE VIEWS
// ═══════════════════════════════════════════════════════════════════════════════

// ── DASHBOARD ──────────────────────────────────────────────────────────────

function DashboardModule() {
  const [dateRange, setDateRange] = useState('month');
  const pipelineValue = CRM_LEADS.filter(l => l.stage !== 'lost' && l.stage !== 'won').reduce((a, l) => a + l.value * l.probability / 100, 0);
  const wonValue = CRM_LEADS.filter(l => l.stage === 'won').reduce((a, l) => a + l.value, 0);
  const revenueTotal = INVOICES.filter(i => i.type === 'out_invoice').reduce((a, i) => a + i.total, 0);
  const expenseTotal = INVOICES.filter(i => i.type === 'in_invoice').reduce((a, i) => a + i.total, 0);
  const overdueReceivables = INVOICES.filter(i => i.type === 'out_invoice' && i.residual > 0).reduce((a, i) => a + i.residual, 0);

  return (
    <div className="h-full overflow-y-auto space-y-5">
      {/* Quick Stats */}
      <div className="grid grid-cols-5 gap-3">
        <KPI label="Weighted Pipeline" value={`$${(pipelineValue / 1000).toFixed(0)}k`} change="+12% this month" icon={Target} color="text-cyan-400" trend="up" />
        <KPI label="Won This Quarter" value={`$${(wonValue / 1000).toFixed(0)}k`} icon={DollarSign} color="text-emerald-400" />
        <KPI label="Revenue" value={`$${(revenueTotal / 1000).toFixed(0)}k`} icon={BarChart3} color="text-amber-400" />
        <KPI label="Expenses" value={`$${(expenseTotal / 1000).toFixed(0)}k`} icon={Wallet} color="text-red-400" />
        <KPI label="Overdue" value={`$${(overdueReceivables / 1000).toFixed(0)}k`} icon={AlertTriangle} color="text-orange-400" trend="down" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 rounded-2xl p-5 bg-white/[0.04] border border-white/8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[11px] font-semibold text-white/80">Revenue vs Expenses</p>
              <p className="text-[9px] text-white/40">Last 12 months</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-[8px] text-emerald-400"><div className="w-2 h-2 rounded-sm bg-emerald-400" />Revenue</div>
              <div className="flex items-center gap-1 text-[8px] text-red-400"><div className="w-2 h-2 rounded-sm bg-red-400" />Expenses</div>
              <div className="flex items-center gap-1 text-[8px] text-cyan-400"><div className="w-2 h-2 rounded-sm bg-cyan-400" />Profit</div>
            </div>
          </div>
          <LineChartSVG data={[42, 58, 51, 73, 88, 95, 82, 109, 124, 118, 140, 155]} color="#34d399" height={100} />
          <div className="flex justify-between text-[7px] text-white/20 mt-2">
            {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(m => <span key={m}>{m}</span>)}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl p-4 bg-white/[0.04] border border-white/8">
            <p className="text-[9px] font-semibold text-white/70 mb-3">Lead Funnel</p>
            <DonutChartSVG segments={[
              { label: 'New', value: 15, color: '#38bdf8' },
              { label: 'Qualified', value: 32, color: '#a78bfa' },
              { label: 'Proposal', value: 24, color: '#fbbf24' },
              { label: 'Negotiation', value: 18, color: '#f97316' },
              { label: 'Won', value: 11, color: '#34d399' },
            ]} size={80} />
          </div>
          <div className="rounded-2xl p-4 bg-white/[0.04] border border-white/8">
            <p className="text-[9px] font-semibold text-white/70 mb-3">Activity Today</p>
            <div className="space-y-2">
              {ACTIVITIES.filter(a => a.date === '2026-07-03').slice(0, 3).map(a => (
                <div key={a.id} className="flex items-center gap-2">
                  <div className={`w-1 h-6 rounded-full ${a.status === 'planned' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] text-white/70 truncate">{a.subject}</p>
                    <p className="text-[8px] text-white/30">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Recent Activities */}
        <div className="rounded-2xl p-4 bg-white/[0.04] border border-white/8">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-semibold text-white/70">Recent Activities</p>
            <button className="text-[8px] text-cyan-400 hover:text-cyan-300">View All</button>
          </div>
          <ActivityFeed activities={ACTIVITIES} />
        </div>

        {/* Project Status */}
        <div className="rounded-2xl p-4 bg-white/[0.04] border border-white/8">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-semibold text-white/70">Active Projects</p>
            <button className="text-[8px] text-cyan-400 hover:text-cyan-300">View All</button>
          </div>
          <div className="space-y-3">
            {PROJECTS.filter(p => p.status !== 'completed').map(p => (
              <div key={p.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/80">{p.name}</span>
                  <StatusBadge status={p.status} />
                </div>
                <ProgressBar value={p.progress} max={100} color={`#${p.color?.slice(1) || '22d3ee'}`} />
                <div className="flex justify-between text-[8px] text-white/30">
                  <span>{p.tasksDone}/{p.taskCount} tasks</span>
                  <span>${(p.budget - p.spent).toLocaleString()} remaining</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { icon: Plus, label: 'New Lead', onClick: () => {}, color: 'cyan' },
          { icon: FileText, label: 'New Quote', onClick: () => {}, color: 'emerald' },
          { icon: Receipt, label: 'New Invoice', onClick: () => {}, color: 'amber' },
          { icon: Ticket, label: 'New Ticket', onClick: () => {}, color: 'violet' },
        ].map(a => (
          <button key={a.label} onClick={a.onClick}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl bg-${a.color}-500/10 border border-${a.color}-500/20 hover:bg-${a.color}-500/20 transition-all`}>
            <a.icon size={14} className={`text-${a.color}-400`} />
            <span className="text-[10px] font-medium text-white/70">{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── CRM MODULE ────────────────────────────────────────────────────────────

function CRMModule() {
  const [subView, setSubView] = useState<'pipeline' | 'leads' | 'customers' | 'activities' | 'calendar'>('pipeline');
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [showConvertWizard, setShowConvertWizard] = useState(false);

  const tabs = [
    { id: 'pipeline' as const, label: 'Pipeline', count: CRM_LEADS.filter(l => !['won', 'lost'].includes(l.stage)).length },
    { id: 'leads' as const, label: 'Leads', count: CRM_LEADS.length },
    { id: 'customers' as const, label: 'Customers', count: CUSTOMERS.length },
    { id: 'activities' as const, label: 'Activities', count: ACTIVITIES.filter(a => a.status === 'planned').length },
    { id: 'calendar' as const, label: 'Calendar' },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <Tabs tabs={tabs} active={subView} onChange={v => setSubView(v)} />
        <div className="flex items-center gap-2">
          {(subView === 'leads' || subView === 'pipeline') && (
            <ViewSwitcher view={viewMode} onChange={setViewMode} views={['list', 'kanban', 'activity']} />
          )}
          <ActionButton icon={Plus} label="New Lead" onClick={() => setShowLeadForm(true)} variant="primary" />
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {subView === 'pipeline' && (
          viewMode === 'kanban' ? <CRMPipeline onSelect={setSelectedLead} /> :
          viewMode === 'list' ? <CRMLeadsList onSelect={setSelectedLead} /> :
          <CRMActivityView />
        )}
        {subView === 'leads' && <CRMLeadsList onSelect={setSelectedLead} />}
        {subView === 'customers' && <CustomersList />}
        {subView === 'activities' && <ActivitiesList />}
        {subView === 'calendar' && <CRMCalendar />}
      </div>

      {/* Lead Form Drawer */}
      <Drawer open={showLeadForm} onClose={() => setShowLeadForm(false)} title="Create New Lead">
        <LeadForm onClose={() => setShowLeadForm(false)} />
      </Drawer>

      {/* Lead Detail Modal */}
      <Modal open={!!selectedLead} onClose={() => setSelectedLead(null)} title="Lead Details" width="xl">
        {selectedLead && <LeadDetail lead={selectedLead} onClose={() => setSelectedLead(null)} onConvert={() => setShowConvertWizard(true)} />}
      </Modal>

      {/* Convert to Opportunity Wizard */}
      <Modal open={showConvertWizard} onClose={() => setShowConvertWizard(false)} title="Convert to Opportunity" width="lg">
        <ConvertWizard onClose={() => { setShowConvertWizard(false); setSelectedLead(null); }} />
      </Modal>
    </div>
  );
}

function CRMPipeline({ onSelect }: { onSelect: (l: any) => void }) {
  const KANBAN_COLS = ['new', 'qualified', 'proposal', 'negotiation', 'won'] as const;
  const COL_CONFIG: Record<string, { label: string; color: string; border: string }> = {
    new: { label: 'New', color: 'text-sky-400', border: 'border-sky-500/30' },
    qualified: { label: 'Qualified', color: 'text-violet-400', border: 'border-violet-500/30' },
    proposal: { label: 'Proposal', color: 'text-amber-400', border: 'border-amber-500/30' },
    negotiation: { label: 'Negotiation', color: 'text-orange-400', border: 'border-orange-500/30' },
    won: { label: 'Won', color: 'text-emerald-400', border: 'border-emerald-500/30' },
  };

  return (
    <div className="h-full overflow-x-auto">
      <div className="flex gap-3 h-full min-w-max">
        {KANBAN_COLS.map(col => {
          const config = COL_CONFIG[col];
          const colLeads = CRM_LEADS.filter(l => l.stage === col);
          const totalValue = colLeads.reduce((a, l) => a + l.value, 0);

          return (
            <div key={col} className="w-56 flex flex-col shrink-0">
              <div className={`flex items-center justify-between px-3 py-2.5 rounded-t-xl border-b ${config.border} bg-white/[0.05]`}>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-white/80">{config.label}</span>
                  <span className="text-[8px] text-white/30 bg-white/10 px-1.5 py-0.5 rounded">{colLeads.length}</span>
                </div>
                <span className="text-[9px] font-mono text-emerald-400">${(totalValue / 1000).toFixed(0)}k</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 p-2 rounded-b-xl bg-white/[0.02] border border-t-0 border-white/8">
                {colLeads.map(lead => (
                  <div key={lead.id} onClick={() => onSelect(lead)}
                    className="p-3 rounded-xl bg-white/[0.06] border border-white/10 hover:border-cyan-500/30 cursor-pointer transition-all group">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="text-[10px] font-semibold text-white/90 leading-tight">{lead.name}</p>
                        <p className="text-[9px] text-white/40">{lead.company}</p>
                      </div>
                      <MoreHorizontal size={12} className="text-white/20 opacity-0 group-hover:opacity-100 shrink-0" />
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono text-emerald-400">${(lead.value / 1000).toFixed(0)}k</span>
                      <div className="flex items-center gap-1.5">
                        <div className="w-10 h-1 rounded-full bg-white/10 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500" style={{ width: `${lead.probability}%` }} />
                        </div>
                        <span className="text-[8px] text-white/30">{lead.probability}%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] text-white/30">{lead.assignedTo}</span>
                      <div className="flex flex-wrap gap-1">
                        {lead.tags.slice(0, 1).map(t => <Badge key={t} size="xs">{t}</Badge>)}
                        {lead.tags.length > 1 && <span className="text-[7px] text-white/25">+{lead.tags.length - 1}</span>}
                      </div>
                    </div>
                  </div>
                ))}
                {colLeads.length === 0 && (
                  <div className="text-center py-8 text-white/20 text-[10px]">No leads</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CRMLeadsList({ onSelect }: { onSelect: (l: any) => void }) {
  const columns = [
    { key: 'name', label: 'Lead', render: (v: string, row: any) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center text-[10px] font-semibold text-white/80">
          {v.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
        </div>
        <div>
          <p className="text-white/90">{v}</p>
          <p className="text-[8px] text-white/35">{row.company}</p>
        </div>
      </div>
    )},
    { key: 'email', label: 'Email', render: (v: string) => <span className="text-cyan-400/80 text-[9px]">{v}</span> },
    { key: 'value', label: 'Value', render: (v: number) => <span className="font-mono text-emerald-400">${(v / 1000).toFixed(0)}k</span> },
    { key: 'stage', label: 'Stage', render: (v: string) => <StatusBadge status={v} /> },
    { key: 'probability', label: 'Probability', render: (v: number) => (
      <div className="flex items-center gap-2">
        <div className="w-12 h-1 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full bg-cyan-500" style={{ width: `${v}%` }} />
        </div>
        <span className="text-[8px] text-white/50">{v}%</span>
      </div>
    )},
    { key: 'assignedTo', label: 'Assigned' },
    { key: 'source', label: 'Source' },
    { key: 'created', label: 'Created', render: (v: string) => <span className="text-white/40">{v}</span> },
  ];

  return <DataTable columns={columns} data={CRM_LEADS} onRowClick={onSelect} />;
}

function CRMActivityView() {
  return (
    <div className="h-full overflow-y-auto p-4">
      <Timeline items={[
        { date: 'Jul 3, 2026', title: 'Demo Meeting - Apex Dynamics', description: 'Product demonstration scheduled with IT team', color: 'bg-violet-500/20 border-violet-500/40' },
        { date: 'Jul 2, 2026', title: 'Proposal Sent - Horizon Tech', description: 'Final proposal with revised SLA terms', color: 'bg-amber-500/20 border-amber-500/40' },
        { date: 'Jul 1, 2026', title: 'Discovery Call - Nexus Solutions', description: 'Initial discovery meeting with CEO and CTO', color: 'bg-cyan-500/20 border-cyan-500/40' },
        { date: 'Jun 28, 2026', title: 'Meeting - Stellar Mesh Corp', description: 'Technical assessment completed', color: 'bg-emerald-500/20 border-emerald-500/40' },
      ]} />
    </div>
  );
}

function CustomersList() {
  const columns = [
    { key: 'name', label: 'Customer', render: (v: string, row: any) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center text-[9px] font-semibold text-white/80">
          {v.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
        </div>
        <div>
          <p className="text-white/90">{v}</p>
          <p className="text-[8px] text-white/35">{row.city}, {row.country}</p>
        </div>
      </div>
    )},
    { key: 'email', label: 'Email' },
    { key: 'type', label: 'Type', render: (v: string) => <Badge variant={v === 'customer' ? 'success' : v === 'lead' ? 'info' : 'default'}>{v}</Badge> },
    { key: 'totalRevenue', label: 'Revenue', render: (v: number) => <span className="font-mono text-emerald-400">${(v / 1000).toFixed(0)}k</span> },
    { key: 'ordersCount', label: 'Orders', align: 'center' },
    { key: 'paymentTerms', label: 'Terms' },
    { key: 'industry', label: 'Industry' },
  ];

  return <DataTable columns={columns} data={CUSTOMERS} />;
}

function ActivitiesList() {
  const typeIcons: Record<string, typeof Phone> = { meeting: Users, call: Phone, email: Mail, task: ListTodo };
  const typeColors: Record<string, string> = { meeting: 'bg-violet-500/15 text-violet-400', call: 'bg-cyan-500/15 text-cyan-400', email: 'bg-amber-500/15 text-amber-400', task: 'bg-emerald-500/15 text-emerald-400' };

  const columns = [
    { key: 'subject', label: 'Activity', render: (v: string, row: any) => (
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${typeColors[row.type] || 'bg-white/10'}`}>
          {React.createElement(typeIcons[row.type] || FileText, { size: 14 })}
        </div>
        <div>
          <p className="text-white/90">{v}</p>
          <p className="text-[8px] text-white/35">{row.type} · {row.duration} min</p>
        </div>
      </div>
    )},
    { key: 'date', label: 'Date', render: (v: string, row: any) => <span>{v} {row.time}</span> },
    { key: 'status', label: 'Status', render: (v: string) => <StatusBadge status={v} /> },
    { key: 'assignedTo', label: 'Assigned' },
    { key: 'priority', label: 'Priority', render: (v: string) => <Badge variant={v === 'high' || v === 'critical' ? 'danger' : v === 'medium' ? 'warning' : 'default'} size="xs">{v}</Badge> },
  ];

  return <DataTable columns={columns} data={ACTIVITIES} />;
}

function CRMCalendar() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <div className="h-full flex gap-4">
      <div className="w-64 shrink-0 rounded-2xl p-4 bg-white/[0.04] border border-white/8">
        <CalendarWidget events={ACTIVITIES} selectedDate={selectedDate} onDateSelect={setSelectedDate} />
      </div>
      <div className="flex-1 rounded-2xl p-4 bg-white/[0.04] border border-white/8 overflow-y-auto">
        <p className="text-[10px] font-semibold text-white/70 mb-4">
          Events for {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <ActivityFeed activities={ACTIVITIES.filter(a => a.date === selectedDate.toISOString().split('T')[0])} />
      </div>
    </div>
  );
}

function LeadForm({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    name: '', company: '', email: '', phone: '', stage: 'new', value: '', source: '', tags: '', notes: ''
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Contact Name" required><Input value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder="Full name" /></FormField>
        <FormField label="Company" required><Input value={form.company} onChange={v => setForm({ ...form, company: v })} placeholder="Company name" /></FormField>
        <FormField label="Email"><Input value={form.email} onChange={v => setForm({ ...form, email: v })} type="email" placeholder="email@example.com" /></FormField>
        <FormField label="Phone"><Input value={form.phone} onChange={v => setForm({ ...form, phone: v })} type="tel" placeholder="+1 555-0100" /></FormField>
        <FormField label="Stage"><Select value={form.stage} onChange={v => setForm({ ...form, stage: v })} options={[{ value: 'new', label: 'New' }, { value: 'qualified', label: 'Qualified' }, { value: 'proposal', label: 'Proposal' }, { value: 'negotiation', label: 'Negotiation' }]} /></FormField>
        <FormField label="Estimated Value"><Input value={form.value} onChange={v => setForm({ ...form, value: v })} type="number" placeholder="50000" /></FormField>
        <FormField label="Source"><Select value={form.source} onChange={v => setForm({ ...form, source: v })} options={[{ value: 'website', label: 'Website' }, { value: 'referral', label: 'Referral' }, { value: 'trade_show', label: 'Trade Show' }, { value: 'cold_outreach', label: 'Cold Outreach' }, { value: 'partner', label: 'Partner' }]} /></FormField>
        <FormField label="Tags"><Input value={form.tags} onChange={v => setForm({ ...form, tags: v })} placeholder="Enterprise, Priority (comma-separated)" /></FormField>
      </div>
      <FormField label="Notes"><TextArea value={form.notes} onChange={v => setForm({ ...form, notes: v })} placeholder="Add notes about this lead..." rows={4} /></FormField>
      <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
        <button onClick={onClose} className="px-4 py-2 rounded-lg text-[10px] text-white/60 hover:text-white/80">Cancel</button>
        <button className="px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-[10px] font-medium hover:bg-cyan-500/30">Create Lead</button>
      </div>
    </div>
  );
}

function LeadDetail({ lead, onClose, onConvert }: { lead: any; onClose: () => void; onConvert: () => void }) {
  const [tab, setTab] = useState('overview');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center text-xl font-semibold text-white/80 shrink-0">
          {lead.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-lg font-semibold text-white/90">{lead.name}</p>
            <StatusBadge status={lead.stage} />
          </div>
          <p className="text-[10px] text-white/50">{lead.company}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[10px] font-mono text-emerald-400">${(lead.value / 1000).toFixed(0)}k</span>
            <div className="flex items-center gap-1.5">
              <div className="w-16 h-1 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500" style={{ width: `${lead.probability}%` }} />
              </div>
              <span className="text-[8px] text-white/50">{lead.probability}% win probability</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={[{ id: 'overview', label: 'Overview' }, { id: 'activities', label: 'Activities' }, { id: 'notes', label: 'Notes' }, { id: 'emails', label: 'Emails' }]} active={tab} onChange={setTab} />

      {/* Content */}
      <div className="min-h-[300px]">
        {tab === 'overview' && (
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="rounded-xl p-4 bg-white/[0.04] border border-white/8">
                <p className="text-[8px] text-white/40 uppercase tracking-wider mb-3">Contact Information</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2"><Mail size={12} className="text-cyan-400" /><span className="text-[10px] text-white/80">{lead.email}</span></div>
                  <div className="flex items-center gap-2"><Phone size={12} className="text-cyan-400" /><span className="text-[10px] text-white/80">{lead.phone}</span></div>
                </div>
              </div>
              <div className="rounded-xl p-4 bg-white/[0.04] border border-white/8">
                <p className="text-[8px] text-white/40 uppercase tracking-wider mb-3">Details</p>
                <div className="space-y-2 text-[10px]">
                  <div className="flex justify-between"><span className="text-white/40">Source</span><span className="text-white/70">{lead.source}</span></div>
                  <div className="flex justify-between"><span className="text-white/40">Assigned To</span><span className="text-white/70">{lead.assignedTo}</span></div>
                  <div className="flex justify-between"><span className="text-white/40">Created</span><span className="text-white/70">{lead.created}</span></div>
                  <div className="flex justify-between"><span className="text-white/40">Last Activity</span><span className="text-white/70">{lead.lastActivity}</span></div>
                </div>
              </div>
            </div>
            <div>
              <div className="rounded-xl p-4 bg-white/[0.04] border border-white/8">
                <p className="text-[8px] text-white/40 uppercase tracking-wider mb-3">Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {lead.tags.map((t: string) => <Badge key={t} variant="purple">{t}</Badge>)}
                  <button className="text-[8px] text-cyan-400 hover:text-cyan-300">+ Add tag</button>
                </div>
              </div>
            </div>
          </div>
        )}
        {tab === 'activities' && (
          <div className="space-y-2">
            {ACTIVITIES.filter(a => a.relatedTo === lead.id).map(a => (
              <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.04] border border-white/8">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/15 flex items-center justify-center shrink-0">
                  <Phone size={12} className="text-cyan-400" />
                </div>
                <div>
                  <p className="text-[10px] text-white/80">{a.subject}</p>
                  <p className="text-[8px] text-white/30">{a.date} · {a.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        {tab === 'notes' && (
          <div className="rounded-xl p-4 bg-white/[0.04] border border-white/8">
            <p className="text-[10px] text-white/70 whitespace-pre-wrap">{lead.notes || 'No notes yet.'}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <div className="flex gap-2">
          <ActionButton icon={Phone} label="Call" size="xs" />
          <ActionButton icon={Mail} label="Email" size="xs" />
          <ActionButton icon={Calendar} label="Schedule" size="xs" />
        </div>
        <div className="flex gap-2">
          {lead.stage !== 'won' && lead.stage !== 'lost' && (
            <button onClick={onConvert} className="px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-medium hover:bg-emerald-500/30">
              Convert to Opportunity
            </button>
          )}
          <ActionButton icon={Edit} label="Edit" variant="primary" size="xs" />
        </div>
      </div>
    </div>
  );
}

function ConvertWizard({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const steps = [{ id: 'confirm', label: 'Confirm' }, { id: 'details', label: 'Details' }, { id: 'create', label: 'Create' }];

  return (
    <Wizard steps={steps} currentStep={step} onStepChange={setStep}>
      {step === 0 && (
        <div className="space-y-4 py-4">
          <p className="text-[11px] text-white/70">This will convert the lead to an opportunity and create a customer record.</p>
          <div className="rounded-xl p-4 bg-white/[0.04] border border-white/8">
            <div className="space-y-2">
              <div className="flex justify-between text-[10px]"><span className="text-white/40">Lead</span><span className="text-white/80">Marcus Chen</span></div>
              <div className="flex justify-between text-[10px]"><span className="text-white/40">Company</span><span className="text-white/80">Apex Dynamics Inc</span></div>
              <div className="flex justify-between text-[10px]"><span className="text-white/40">Value</span><span className="text-emerald-400">$125,000</span></div>
            </div>
          </div>
        </div>
      )}
      {step === 1 && (
        <div className="space-y-4 py-4">
          <FormField label="Opportunity Name" required><Input value="" onChange={() => {}} placeholder="Enterprise Package - Apex Dynamics" /></FormField>
          <FormField label="Expected Close Date" required><Input value="" onChange={() => {}} type="date" /></FormField>
          <FormField label="Sales Team"><Select value="" onChange={() => {}} options={[{ value: 'enterprise', label: 'Enterprise Team' }, { value: 'mid_market', label: 'Mid-Market Team' }]} /></FormField>
        </div>
      )}
      {step === 2 && (
        <div className="text-center py-8">
          <CheckCircle size={48} className="mx-auto mb-4 text-emerald-400" />
          <p className="text-[12px] text-white/80 mb-2">Opportunity Created</p>
          <p className="text-[10px] text-white/40">OPP-2026-0042 has been created successfully</p>
        </div>
      )}
      <div className="flex justify-between pt-4 border-t border-white/10">
        <button onClick={() => step > 0 && setStep(step - 1)} disabled={step === 0} className="px-4 py-2 rounded-lg text-[10px] text-white/60 hover:text-white/80 disabled:opacity-30">Back</button>
        {step < steps.length - 1 ? (
          <button onClick={() => setStep(step + 1)} className="px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-[10px] font-medium hover:bg-cyan-500/30">Continue</button>
        ) : (
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-medium hover:bg-emerald-500/30">Finish</button>
        )}
      </div>
    </Wizard>
  );
}

// ── SALES MODULE ───────────────────────────────────────────────────────────

function SalesModule() {
  const [subView, setSubView] = useState<'quotations' | 'orders' | 'products' | 'pricelists'>('quotations');
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showQuoteWizard, setShowQuoteWizard] = useState(false);
  const [showOrderWizard, setShowOrderWizard] = useState(false);

  const tabs = [
    { id: 'quotations' as const, label: 'Quotations', count: QUOTATIONS.length },
    { id: 'orders' as const, label: 'Orders', count: SALES_ORDERS.length },
    { id: 'products' as const, label: 'Products', count: PRODUCTS.length },
    { id: 'pricelists' as const, label: 'Pricelists' },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <Tabs tabs={tabs} active={subView} onChange={v => setSubView(v)} />
        <div className="flex items-center gap-2">
          {subView === 'quotations' && <ActionButton icon={Plus} label="New Quotation" onClick={() => setShowQuoteWizard(true)} variant="primary" />}
          {subView === 'orders' && <ActionButton icon={Plus} label="New Order" onClick={() => setShowOrderWizard(true)} variant="primary" />}
          {subView === 'products' && <ActionButton icon={Plus} label="New Product" onClick={() => {}} />}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {subView === 'quotations' && <QuotationsList onSelect={setSelectedQuote} />}
        {subView === 'orders' && <SalesOrdersList onSelect={setSelectedOrder} />}
        {subView === 'products' && <ProductsList />}
        {subView === 'pricelists' && <PricelistsView />}
      </div>

      {/* Quote Detail Modal */}
      <Modal open={!!selectedQuote} onClose={() => setSelectedQuote(null)} title="Quotation Details" width="xl">
        {selectedQuote && <QuotationDetail quote={selectedQuote} onClose={() => setSelectedQuote(null)} />}
      </Modal>

      {/* Quote Wizard */}
      <Modal open={showQuoteWizard} onClose={() => setShowQuoteWizard(false)} title="Create Quotation" width="xl">
        <QuotationWizard onClose={() => setShowQuoteWizard(false)} />
      </Modal>
    </div>
  );
}

function QuotationsList({ onSelect }: { onSelect: (q: any) => void }) {
  const columns = [
    { key: 'number', label: 'Number', render: (v: string) => <span className="font-mono text-cyan-400">{v}</span> },
    { key: 'customer', label: 'Customer' },
    { key: 'date', label: 'Date' },
    { key: 'validUntil', label: 'Valid Until' },
    { key: 'total', label: 'Total', render: (v: number) => <span className="font-mono text-emerald-400">${(v / 1000).toFixed(1)}k</span> },
    { key: 'status', label: 'Status', render: (v: string) => <StatusBadge status={v} /> },
    { key: 'salesperson', label: 'Salesperson' },
  ];

  return <DataTable columns={columns} data={QUOTATIONS} onRowClick={onSelect} />;
}

function SalesOrdersList({ onSelect }: { onSelect: (o: any) => void }) {
  const columns = [
    { key: 'number', label: 'Order #', render: (v: string) => <span className="font-mono text-cyan-400">{v}</span> },
    { key: 'customer', label: 'Customer' },
    { key: 'date', label: 'Date' },
    { key: 'deliveryDate', label: 'Delivery' },
    { key: 'total', label: 'Total', render: (v: number) => <span className="font-mono text-emerald-400">${(v / 1000).toFixed(1)}k</span> },
    { key: 'status', label: 'Status', render: (v: string) => <StatusBadge status={v} /> },
    { key: 'salesperson', label: 'Salesperson' },
  ];

  return <DataTable columns={columns} data={SALES_ORDERS} onRowClick={onSelect} />;
}

function ProductsList() {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filtered = selectedCategory === 'all' ? PRODUCTS : PRODUCTS.filter(p => p.category === selectedCategory);

  const columns = [
    { key: 'sku', label: 'SKU', render: (v: string) => <span className="font-mono text-cyan-400/80">{v}</span> },
    { key: 'name', label: 'Product Name' },
    { key: 'category', label: 'Category' },
    { key: 'type', label: 'Type', render: (v: string) => <Badge variant={v === 'stockable' ? 'info' : v === 'service' ? 'purple' : 'default'} size="xs">{v}</Badge> },
    { key: 'price', label: 'Price', render: (v: number) => <span className="font-mono text-white/80">${v.toLocaleString()}</span> },
    { key: 'cost', label: 'Cost', render: (v: number) => <span className="font-mono text-white/50">${v.toLocaleString()}</span> },
    { key: 'available', label: 'Available', render: (v: number, row: any) => (
      <span className={`font-mono ${v < 0 ? 'text-red-400' : v < row.minStock ? 'text-amber-400' : 'text-emerald-400'}`}>{v}</span>
    )},
  ];

  return (
    <div className="h-full flex gap-4">
      <div className="w-48 shrink-0 rounded-xl p-3 bg-white/[0.04] border border-white/8">
        <p className="text-[9px] font-semibold text-white/50 uppercase tracking-wider mb-2">Categories</p>
        <div className="space-y-1">
          {['all', 'Hardware', 'Software', 'Services'].map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)}
              className={`w-full text-left px-3 py-2 rounded-lg text-[10px] transition-all ${selectedCategory === cat ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/25' : 'text-white/50 hover:bg-white/5'}`}>
              {cat === 'all' ? 'All Products' : cat}
              <span className="float-right text-[8px]">{cat === 'all' ? PRODUCTS.length : PRODUCTS.filter(p => p.category === cat).length}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <DataTable columns={columns} data={filtered} />
      </div>
    </div>
  );
}

function PricelistsView() {
  return <EmptyState icon={DollarSign} title="Pricelists" description="Define pricing rules and discounts for different customer segments." />;
}

function QuotationDetail({ quote, onClose }: { quote: any; onClose: () => void }) {
  const [tab, setTab] = useState('lines');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-cyan-400 text-[12px]">{quote.number}</span>
            <StatusBadge status={quote.status} />
          </div>
          <p className="text-[11px] text-white/50 mt-1">{quote.customer}</p>
        </div>
        <div className="flex items-center gap-2">
          <ActionButton icon={Printer} label="Print" size="xs" />
          <ActionButton icon={Send} label="Send" size="xs" />
          <ActionButton icon={Copy} label="Duplicate" size="xs" />
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={[{ id: 'lines', label: 'Order Lines' }, { id: 'details', label: 'Details' }, { id: 'terms', label: 'Terms' }]} active={tab} onChange={setTab} />

      {/* Lines */}
      {tab === 'lines' && (
        <div className="rounded-xl border border-white/8 overflow-hidden">
          <table className="w-full text-[10px]">
            <thead className="bg-white/[0.03] border-b border-white/10">
              <tr className="text-white/40">
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3 text-right">Unit Price</th>
                <th className="px-4 py-3 text-right">Disc.</th>
                <th className="px-4 py-3 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {quote.lines.map((l: any) => (
                <tr key={l.id} className="border-b border-white/5">
                  <td className="px-4 py-3 font-mono text-cyan-400/80">{l.product}</td>
                  <td className="px-4 py-3 text-white/70">{l.description}</td>
                  <td className="px-4 py-3 text-right text-white/70">{l.quantity}</td>
                  <td className="px-4 py-3 text-right font-mono text-white/70">${l.unitPrice.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-white/50">{l.discount}%</td>
                  <td className="px-4 py-3 text-right font-mono text-emerald-400">${l.subtotal.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-end p-4 bg-white/[0.02]">
            <div className="w-52 space-y-2 text-[10px]">
              <div className="flex justify-between"><span className="text-white/40">Subtotal:</span><span className="font-mono text-white/70">${quote.subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-white/40">Tax (18%):</span><span className="font-mono text-white/70">${quote.tax.toLocaleString()}</span></div>
              <div className="flex justify-between font-semibold pt-2 border-t border-white/10"><span className="text-white/60">Total:</span><span className="font-mono text-emerald-400">${quote.total.toLocaleString()}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Details */}
      {tab === 'details' && (
        <div className="grid grid-cols-3 gap-4">
          <FormField label="Customer"><Input value={quote.customer} onChange={() => {}} /></FormField>
          <FormField label="Quotation Date"><Input value={quote.date} onChange={() => {}} type="date" /></FormField>
          <FormField label="Valid Until"><Input value={quote.validUntil} onChange={() => {}} type="date" /></FormField>
          <FormField label="Salesperson"><Input value={quote.salesperson} onChange={() => {}} /></FormField>
          <FormField label="Payment Terms"><Input value={quote.paymentTerms} onChange={() => {}} /></FormField>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t border-white/10">
        <ActionButton icon={Trash2} label="Delete" variant="danger" size="xs" />
        <div className="flex gap-2">
          {quote.status === 'draft' && <button className="px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-[10px]">Send by Email</button>}
          {quote.status === 'sent' && <button className="px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px]">Confirm Sale</button>}
          <ActionButton icon={Edit} label="Edit" variant="primary" size="xs" />
        </div>
      </div>
    </div>
  );
}

function QuotationWizard({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const steps = [{ id: 'customer', label: 'Customer' }, { id: 'products', label: 'Products' }, { id: 'terms', label: 'Terms' }, { id: 'confirm', label: 'Confirm' }];

  return (
    <Wizard steps={steps} currentStep={step} onStepChange={setStep}>
      {step === 0 && (
        <div className="space-y-4 py-4">
          <FormField label="Customer" required>
            <Select value="" onChange={() => {}} options={CUSTOMERS.map(c => ({ value: c.id, label: c.name }))} placeholder="Select customer" />
          </FormField>
          <FormField label="Quotation Date">
            <Input value={new Date().toISOString().split('T')[0]} onChange={() => {}} type="date" />
          </FormField>
          <FormField label="Valid Until">
            <Input value={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} onChange={() => {}} type="date" />
          </FormField>
        </div>
      )}
      {step === 1 && (
        <div className="py-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] text-white/50">Add products to quotation</p>
            <button className="flex items-center gap-1 text-[9px] text-cyan-400"><Plus size={10} /> Add Line</button>
          </div>
          <div className="rounded-xl border border-dashed border-white/20 p-8 text-center text-white/30 text-[10px]">
            No products added. Click "Add Line" to add products.
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4 py-4">
          <FormField label="Payment Terms">
            <Select value="net_30" onChange={() => {}} options={[{ value: 'net_15', label: 'Net 15' }, { value: 'net_30', label: 'Net 30' }, { value: 'net_45', label: 'Net 45' }]} />
          </FormField>
          <FormField label="Terms and Conditions">
            <TextArea value="Standard terms and conditions apply." onChange={() => {}} rows={3} />
          </FormField>
        </div>
      )}
      {step === 3 && (
        <div className="text-center py-8">
          <CheckCircle size={48} className="mx-auto mb-4 text-emerald-400" />
          <p className="text-[12px] text-white/80">Quotation Ready</p>
          <p className="text-[10px] text-white/40">QT-2026-0045 will be created</p>
        </div>
      )}
      <div className="flex justify-between pt-4 border-t border-white/10">
        <button onClick={() => step > 0 && setStep(step - 1)} disabled={step === 0} className="px-4 py-2 rounded-lg text-[10px] text-white/60 hover:text-white/80 disabled:opacity-30">Back</button>
        {step < steps.length - 1 ? (
          <button onClick={() => setStep(step + 1)} className="px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-[10px]">Continue</button>
        ) : (
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px]">Create Quotation</button>
        )}
      </div>
    </Wizard>
  );
}

// ── INVENTORY MODULE ───────────────────────────────────────────────────────

function InventoryModule() {
  const [subView, setSubView] = useState<'products' | 'warehouses' | 'moves' | 'adjustments' | 'scrap'>('products');
  const [showTransferWizard, setShowTransferWizard] = useState(false);
  const [showAdjustmentWizard, setShowAdjustmentWizard] = useState(false);

  const tabs = [
    { id: 'products' as const, label: 'Products', count: PRODUCTS.length },
    { id: 'warehouses' as const, label: 'Warehouses', count: WAREHOUSES.length },
    { id: 'moves' as const, label: 'Stock Moves', count: STOCK_MOVES.length },
    { id: 'adjustments' as const, label: 'Adjustments' },
    { id: 'scrap' as const, label: 'Scrap Orders' },
  ];

  const criticalStock = PRODUCTS.filter(p => p.available < p.minStock);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <Tabs tabs={tabs} active={subView} onChange={v => setSubView(v)} />
        <div className="flex items-center gap-2">
          {criticalStock.length > 0 && <Badge variant="danger">{criticalStock.length} Low Stock</Badge>}
          <ActionButton icon={Plus} label="New Transfer" onClick={() => setShowTransferWizard(true)} />
          <ActionButton icon={Plus} label="Adjustment" onClick={() => setShowAdjustmentWizard(true)} variant="warning" />
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {subView === 'products' && <InventoryProducts />}
        {subView === 'warehouses' && <InventoryWarehouses />}
        {subView === 'moves' && <InventoryStockMoves />}
        {subView === 'adjustments' && <InventoryAdjustments />}
        {subView === 'scrap' && <InventoryScrap />}
      </div>

      {/* Transfer Wizard */}
      <Modal open={showTransferWizard} onClose={() => setShowTransferWizard(false)} title="Create Stock Transfer" width="lg">
        <StockTransferWizard onClose={() => setShowTransferWizard(false)} />
      </Modal>
    </div>
  );
}

function InventoryProducts() {
  const columns = [
    { key: 'sku', label: 'SKU', render: (v: string) => <span className="font-mono text-cyan-400/80">{v}</span> },
    { key: 'name', label: 'Product' },
    { key: 'category', label: 'Category' },
    { key: 'stock', label: 'On Hand', render: (v: number) => <span className="font-mono text-white/70">{v.toLocaleString()}</span> },
    { key: 'reserved', label: 'Reserved', render: (v: number) => <span className="font-mono text-amber-400">{v > 0 ? v.toLocaleString() : '—'}</span> },
    { key: 'available', label: 'Available', render: (v: number, row: any) => (
      <div className="flex items-center gap-2">
        <span className={`font-mono ${v < 0 ? 'text-red-400' : v < row.minStock ? 'text-amber-400' : 'text-emerald-400'}`}>{v.toLocaleString()}</span>
        {v < row.minStock && <AlertTriangle size={10} className="text-amber-400" />}
      </div>
    )},
    { key: 'price', label: 'Price', render: (v: number) => <span className="font-mono text-white/70">${v.toLocaleString()}</span> },
  ];

  return <DataTable columns={columns} data={PRODUCTS} />;
}

function InventoryWarehouses() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="grid grid-cols-2 gap-4">
        {WAREHOUSES.map(wh => (
          <div key={wh.id} className="rounded-2xl p-5 bg-white/[0.04] border border-white/8 hover:border-cyan-500/30 cursor-pointer transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/15 flex items-center justify-center">
                  <Warehouse size={18} className="text-cyan-400" />
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-white/90">{wh.name}</p>
                  <p className="text-[9px] text-white/40">{wh.code} · {wh.type}</p>
                </div>
              </div>
              <StatusBadge status={wh.status} />
            </div>
            <div className="mb-4">
              <div className="flex justify-between text-[9px] mb-1">
                <span className="text-white/40">Capacity Utilization</span>
                <span className="text-white/70">{wh.utilized.toLocaleString()} / {wh.capacity.toLocaleString()} m³</span>
              </div>
              <ProgressBar value={wh.utilized} max={wh.capacity} />
            </div>
            <div className="flex items-center gap-4 text-[9px] text-white/40">
              <div className="flex items-center gap-1"><MapPin size={10} />{wh.city}, {wh.country}</div>
              {wh.default && <Badge variant="info" size="xs">Default</Badge>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InventoryStockMoves() {
  const columns = [
    { key: 'id', label: 'Reference', render: (v: string) => <div><span className="font-mono text-cyan-400/80">{v}</span><p className="text-[8px] text-white/30">{STOCK_MOVES.find(m => m.id === v)?.reference}</p></div> },
    { key: 'productName', label: 'Product' },
    { key: 'fromWarehouse', label: 'From', render: (v: string) => <Badge size="xs">{v}</Badge> },
    { key: 'toWarehouse', label: 'To', render: (v: string) => <Badge size="xs">{v}</Badge> },
    { key: 'quantity', label: 'Qty', render: (v: number) => <span className="font-mono text-white/70">{v}</span> },
    { key: 'status', label: 'Status', render: (v: string) => <StatusBadge status={v} /> },
    { key: 'scheduled', label: 'Scheduled' },
  ];

  return <DataTable columns={columns} data={STOCK_MOVES} />;
}

function InventoryAdjustments() {
  return <EmptyState icon={Scale} title="Stock Adjustments" description="Create stock adjustments to correct inventory discrepancies." action={{ label: 'New Adjustment', onClick: () => {} }} />;
}

function InventoryScrap() {
  return <EmptyState icon={Trash2} title="Scrap Orders" description="Process damaged or expired inventory through scrap orders." action={{ label: 'New Scrap Order', onClick: () => {} }} />;
}

function StockTransferWizard({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const steps = [{ id: 'source', label: 'Source' }, { id: 'destination', label: 'Destination' }, { id: 'products', label: 'Products' }, { id: 'confirm', label: 'Confirm' }];

  return (
    <Wizard steps={steps} currentStep={step} onStepChange={setStep}>
      {step === 0 && (
        <div className="space-y-4 py-4">
          <FormField label="Source Warehouse" required>
            <Select value="" onChange={() => {}} options={WAREHOUSES.map(w => ({ value: w.id, label: w.name }))} />
          </FormField>
        </div>
      )}
      {step === 1 && (
        <div className="space-y-4 py-4">
          <FormField label="Destination Warehouse" required>
            <Select value="" onChange={() => {}} options={WAREHOUSES.map(w => ({ value: w.id, label: w.name }))} />
          </FormField>
          <FormField label="Scheduled Date">
            <Input value={new Date().toISOString().split('T')[0]} onChange={() => {}} type="date" />
          </FormField>
        </div>
      )}
      {step === 2 && (
        <div className="py-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] text-white/50">Add products to transfer</p>
            <button className="flex items-center gap-1 text-[9px] text-cyan-400"><Plus size={10} /> Add Product</button>
          </div>
          <div className="rounded-xl border border-dashed border-white/20 p-8 text-center text-white/30 text-[10px]">
            No products added. Click "Add Product" to add items.
          </div>
        </div>
      )}
      {step === 3 && (
        <div className="text-center py-8">
          <CheckCircle size={48} className="mx-auto mb-4 text-emerald-400" />
          <p className="text-[12px] text-white/80">Transfer Ready</p>
        </div>
      )}
      <div className="flex justify-between pt-4 border-t border-white/10">
        <button onClick={() => step > 0 && setStep(step - 1)} disabled={step === 0} className="px-4 py-2 rounded-lg text-[10px] text-white/60 disabled:opacity-30">Back</button>
        {step < steps.length - 1 ? (
          <button onClick={() => setStep(step + 1)} className="px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-[10px]">Continue</button>
        ) : (
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px]">Create Transfer</button>
        )}
      </div>
    </Wizard>
  );
}

// ── ACCOUNTING MODULE ───────────────────────────────────────────────────────

function AccountingModule() {
  const [subView, setSubView] = useState<'dashboard' | 'invoices' | 'bills' | 'payments' | 'reconciliation' | 'chart'>('dashboard');
  const [showInvoiceWizard, setShowInvoiceWizard] = useState(false);
  const [showPaymentWizard, setShowPaymentWizard] = useState(false);

  const receivables = INVOICES.filter(i => i.type === 'out_invoice' && i.residual > 0).reduce((a, i) => a + i.residual, 0);
  const payables = INVOICES.filter(i => i.type === 'in_invoice' && i.residual > 0).reduce((a, i) => a + i.residual, 0);

  const tabs = [
    { id: 'dashboard' as const, label: 'Dashboard' },
    { id: 'invoices' as const, label: 'Invoices', count: INVOICES.filter(i => i.type === 'out_invoice').length },
    { id: 'bills' as const, label: 'Bills', count: INVOICES.filter(i => i.type === 'in_invoice').length },
    { id: 'payments' as const, label: 'Payments', count: PAYMENTS.length },
    { id: 'reconciliation' as const, label: 'Reconciliation' },
    { id: 'chart' as const, label: 'Chart of Accounts' },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <Tabs tabs={tabs} active={subView} onChange={v => setSubView(v)} />
        <div className="flex items-center gap-2">
          {subView === 'invoices' && <ActionButton icon={Plus} label="New Invoice" onClick={() => setShowInvoiceWizard(true)} variant="primary" />}
          {subView === 'bills' && <ActionButton icon={Plus} label="New Bill" onClick={() => {}} />}
          {subView === 'payments' && <ActionButton icon={Plus} label="Register Payment" onClick={() => setShowPaymentWizard(true)} variant="success" />}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {subView === 'dashboard' && <AccountingDashboard receivables={receivables} payables={payables} />}
        {subView === 'invoices' && <AccountingInvoices />}
        {subView === 'bills' && <AccountingBills />}
        {subView === 'payments' && <AccountingPayments />}
        {subView === 'reconciliation' && <AccountingReconciliation />}
        {subView === 'chart' && <AccountingChart />}
      </div>

      {/* Invoice Wizard */}
      <Modal open={showInvoiceWizard} onClose={() => setShowInvoiceWizard(false)} title="Create Invoice" width="lg">
        <InvoiceWizard onClose={() => setShowInvoiceWizard(false)} />
      </Modal>
    </div>
  );
}

function AccountingDashboard({ receivables, payables }: { receivables: number; payables: number }) {
  return (
    <div className="h-full overflow-y-auto space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <KPI label="Receivables" value={`$${(receivables / 1000).toFixed(0)}k`} icon={TrendingUp} color="text-emerald-400" />
        <KPI label="Payables" value={`$${(payables / 1000).toFixed(0)}k`} icon={TrendingDown} color="text-red-400" />
        <KPI label="Bank Balance" value="$428k" icon={PiggyBank} color="text-cyan-400" />
        <KPI label="Net Cash Flow" value={`$${((receivables - payables) / 1000).toFixed(0)}k`} icon={Activity} color={receivables > payables ? 'text-emerald-400' : 'text-red-400'} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl p-5 bg-white/[0.04] border border-white/8">
          <p className="text-[10px] font-semibold text-white/70 mb-4">Revenue vs Expenses</p>
          <BarChartSVG data={[82, 95, 78, 110, 125, 98, 140, 115, 130, 145, 160, 175]} color="#34d399" labels={['J','F','M','A','M','J','J','A','S','O','N','D']} height={100} />
        </div>

        <div className="rounded-2xl p-5 bg-white/[0.04] border border-white/8">
          <p className="text-[10px] font-semibold text-white/70 mb-4">Account Distribution</p>
          <DonutChartSVG segments={[
            { label: 'Assets', value: 1270, color: '#22d3ee' },
            { label: 'Liabilities', value: 580, color: '#f87171' },
            { label: 'Equity', value: 890, color: '#34d399' },
          ]} size={90} />
        </div>
      </div>

      {/* Aged Receivables */}
      <div className="rounded-2xl p-5 bg-white/[0.04] border border-white/8">
        <p className="text-[10px] font-semibold text-white/70 mb-4">Aged Receivables</p>
        <table className="w-full text-[10px]">
          <thead className="border-b border-white/10 text-white/40">
            <tr><th className="px-3 py-2 text-left">Period</th><th className="px-3 py-2 text-right">Amount</th><th className="px-3 py-2 text-right">%</th></tr>
          </thead>
          <tbody>
            {[{ period: '0-30 days', amount: 125000, pct: 50 }, { period: '31-60 days', amount: 75000, pct: 30 }, { period: '61-90 days', amount: 32000, pct: 13 }, { period: '90+ days', amount: 18000, pct: 7 }].map(r => (
              <tr key={r.period} className="border-b border-white/5">
                <td className="px-3 py-2.5 text-white/70">{r.period}</td>
                <td className="px-3 py-2.5 text-right font-mono text-emerald-400">${(r.amount / 1000).toFixed(0)}k</td>
                <td className="px-3 py-2.5 text-right text-white/50">{r.pct}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AccountingInvoices() {
  const columns = [
    { key: 'number', label: 'Invoice #', render: (v: string) => <span className="font-mono text-cyan-400">{v}</span> },
    { key: 'partner', label: 'Customer' },
    { key: 'date', label: 'Date' },
    { key: 'dueDate', label: 'Due Date' },
    { key: 'total', label: 'Total', render: (v: number) => <span className="font-mono text-emerald-400">${v.toLocaleString()}</span> },
    { key: 'residual', label: 'Due', render: (v: number) => <span className={`font-mono ${v > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>${v.toLocaleString()}</span> },
    { key: 'status', label: 'Status', render: (v: string) => <StatusBadge status={v} /> },
  ];

  return <DataTable columns={columns} data={INVOICES.filter(i => i.type === 'out_invoice')} />;
}

function AccountingBills() {
  const columns = [
    { key: 'number', label: 'Bill #', render: (v: string) => <span className="font-mono text-amber-400">{v}</span> },
    { key: 'partner', label: 'Vendor' },
    { key: 'date', label: 'Date' },
    { key: 'dueDate', label: 'Due Date' },
    { key: 'total', label: 'Total', render: (v: number) => <span className="font-mono text-red-400">${v.toLocaleString()}</span> },
    { key: 'residual', label: 'Due', render: (v: number) => <span className="font-mono text-amber-400">${v.toLocaleString()}</span> },
    { key: 'status', label: 'Status', render: (v: string) => <StatusBadge status={v} /> },
  ];

  return <DataTable columns={columns} data={INVOICES.filter(i => i.type === 'in_invoice')} />;
}

function AccountingPayments() {
  const columns = [
    { key: 'number', label: 'Payment #', render: (v: string) => <span className="font-mono text-emerald-400">{v}</span> },
    { key: 'partner', label: 'Partner' },
    { key: 'amount', label: 'Amount', render: (v: number) => <span className="font-mono text-white/80">${v.toLocaleString()}</span> },
    { key: 'date', label: 'Date' },
    { key: 'method', label: 'Method', render: (v: string) => <Badge size="xs">{v}</Badge> },
    { key: 'state', label: 'Status', render: (v: string) => <StatusBadge status={v} /> },
  ];

  return <DataTable columns={columns} data={PAYMENTS} />;
}

function AccountingReconciliation() {
  return <EmptyState icon={Calculator} title="Bank Reconciliation" description="Match your bank statements with your accounting records." action={{ label: 'Import Statement', onClick: () => {} }} />;
}

function AccountingChart() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="rounded-xl border border-white/8 overflow-hidden">
        <table className="w-full text-[10px]">
          <thead className="bg-white/[0.03] border-b border-white/10">
            <tr className="text-white/40">
              <th className="px-4 py-3 text-left">Code</th>
              <th className="px-4 py-3 text-left">Account Name</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            {CHART_OF_ACCOUNTS.map(a => (
              <tr key={a.code} className={`border-b border-white/5 hover:bg-white/[0.03] cursor-pointer ${a.type === 'view' ? 'bg-white/[0.03]' : ''}`}>
                <td className="px-4 py-2.5 font-mono text-cyan-400/70">{a.code}</td>
                <td className="px-4 py-2.5 text-white/80" style={{ paddingLeft: `${(parseInt(a.code) / 100) * 8 + 16}px` }}>{a.name}</td>
                <td className="px-4 py-2.5"><Badge variant={a.type === 'receivable' ? 'success' : a.type === 'payable' ? 'danger' : 'default'} size="xs">{a.type}</Badge></td>
                <td className="px-4 py-2.5 text-right font-mono text-white/70">${(a.balance / 1000).toFixed(0)}k</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InvoiceWizard({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const steps = [{ id: 'customer', label: 'Customer' }, { id: 'lines', label: 'Lines' }, { id: 'confirm', label: 'Confirm' }];

  return (
    <Wizard steps={steps} currentStep={step} onStepChange={setStep}>
      <div className="flex justify-between pt-4 border-t border-white/10">
        <button onClick={() => step > 0 && setStep(step - 1)} disabled={step === 0} className="px-4 py-2 rounded-lg text-[10px] text-white/60 disabled:opacity-30">Back</button>
        {step < steps.length - 1 ? (
          <button onClick={() => setStep(step + 1)} className="px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-[10px]">Continue</button>
        ) : (
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px]">Create Invoice</button>
        )}
      </div>
    </Wizard>
  );
}

// ── HR MODULE ───────────────────────────────────────────────────────────────

function HRModule() {
  const [subView, setSubView] = useState<'employees' | 'leaves' | 'timesheets' | 'expenses' | 'recruitment'>('employees');
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);

  const tabs = [
    { id: 'employees' as const, label: 'Employees', count: EMPLOYEES.length },
    { id: 'leaves' as const, label: 'Leaves', count: LEAVE_REQUESTS.length },
    { id: 'timesheets' as const, label: 'Timesheets', count: TIMESHEETS.length },
    { id: 'expenses' as const, label: 'Expenses' },
    { id: 'recruitment' as const, label: 'Recruitment' },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <Tabs tabs={tabs} active={subView} onChange={v => setSubView(v)} />
        <div className="flex items-center gap-2">
          {subView === 'employees' && <ActionButton icon={Plus} label="New Employee" onClick={() => setShowEmployeeForm(true)} variant="primary" />}
          {subView === 'leaves' && <ActionButton icon={Plus} label="Request Leave" onClick={() => {}} />}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {subView === 'employees' && <HREmployees />}
        {subView === 'leaves' && <HRLeaves />}
        {subView === 'timesheets' && <HRTimesheets />}
        {subView === 'expenses' && <HRExpenses />}
        {subView === 'recruitment' && <HRRecruitment />}
      </div>

      <Drawer open={showEmployeeForm} onClose={() => setShowEmployeeForm(false)} title="New Employee">
        <EmployeeForm onClose={() => setShowEmployeeForm(false)} />
      </Drawer>
    </div>
  );
}

function HREmployees() {
  const columns = [
    { key: 'firstName', label: 'Employee', render: (v: string, row: any) => (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center text-[10px] font-semibold text-white/80">
          {v[0]}{row.lastName[0]}
        </div>
        <div>
          <p className="text-white/90">{v} {row.lastName}</p>
          <p className="text-[8px] text-white/35">{row.email}</p>
        </div>
      </div>
    )},
    { key: 'jobTitle', label: 'Position' },
    { key: 'department', label: 'Department', render: (v: string) => <Badge variant="purple" size="xs">{v}</Badge> },
    { key: 'salary', label: 'Salary', render: (v: number) => <span className="font-mono text-emerald-400">${v.toLocaleString()}</span> },
    { key: 'status', label: 'Status', render: (v: string) => <StatusBadge status={v} /> },
    { key: 'hireDate', label: 'Hire Date' },
  ];

  return <DataTable columns={columns} data={EMPLOYEES} />;
}

function HRLeaves() {
  const columns = [
    { key: 'employeeName', label: 'Employee' },
    { key: 'type', label: 'Type', render: (v: string) => <Badge variant={v === 'annual' ? 'info' : v === 'sick' ? 'warning' : 'default'} size="xs">{v}</Badge> },
    { key: 'startDate', label: 'Start' },
    { key: 'endDate', label: 'End' },
    { key: 'days', label: 'Days', render: (v: number) => <span className="font-mono text-white/70">{v}</span> },
    { key: 'reason', label: 'Reason' },
    { key: 'status', label: 'Status', render: (v: string) => <StatusBadge status={v} /> },
  ];

  return <DataTable columns={columns} data={LEAVE_REQUESTS} />;
}

function HRTimesheets() {
  const columns = [
    { key: 'employeeName', label: 'Employee' },
    { key: 'date', label: 'Date' },
    { key: 'project', label: 'Project' },
    { key: 'task', label: 'Task' },
    { key: 'hours', label: 'Hours', render: (v: number) => <span className="font-mono text-white/70">{v}h</span> },
    { key: 'billable', label: 'Billable', render: (v: boolean) => <Badge variant={v ? 'success' : 'default'} size="xs">{v ? 'Yes' : 'No'}</Badge> },
    { key: 'status', label: 'Status', render: (v: string) => <StatusBadge status={v} /> },
  ];

  return <DataTable columns={columns} data={TIMESHEETS} />;
}

function HRExpenses() {
  return <EmptyState icon={Wallet} title="Expense Claims" description="Submit and manage employee expense claims for reimbursement." action={{ label: 'New Expense', onClick: () => {} }} />;
}

function HRRecruitment() {
  return <EmptyState icon={GraduationCap} title="Recruitment" description="Manage job positions, applications, and hiring pipeline." />;
}

function EmployeeForm({ onClose }: { onClose: () => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField label="First Name" required><Input value="" onChange={() => {}} /></FormField>
        <FormField label="Last Name" required><Input value="" onChange={() => {}} /></FormField>
        <FormField label="Email" required><Input value="" onChange={() => {}} type="email" /></FormField>
        <FormField label="Phone"><Input value="" onChange={() => {}} type="tel" /></FormField>
        <FormField label="Department"><Select value="" onChange={() => {}} options={[{ value: 'sales', label: 'Sales' }, { value: 'engineering', label: 'Engineering' }, { value: 'marketing', label: 'Marketing' }, { value: 'executive', label: 'Executive' }]} /></FormField>
        <FormField label="Job Title"><Input value="" onChange={() => {}} /></FormField>
        <FormField label="Salary"><Input value="" onChange={() => {}} type="number" /></FormField>
        <FormField label="Hire Date"><Input value={new Date().toISOString().split('T')[0]} onChange={() => {}} type="date" /></FormField>
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
        <button onClick={onClose} className="px-4 py-2 rounded-lg text-[10px] text-white/60">Cancel</button>
        <button className="px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-[10px]">Create Employee</button>
      </div>
    </div>
  );
}

// ── PROJECT MODULE ───────────────────────────────────────────────────────────

function ProjectModule() {
  const [subView, setSubView] = useState<'projects' | 'tasks' | 'gantt' | 'timesheets'>('projects');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const tabs = [
    { id: 'projects' as const, label: 'Projects', count: PROJECTS.length },
    { id: 'tasks' as const, label: 'Tasks', count: PROJECT_TASKS.length },
    { id: 'gantt' as const, label: 'Gantt' },
    { id: 'timesheets' as const, label: 'Timesheets' },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <Tabs tabs={tabs} active={subView} onChange={v => setSubView(v)} />
        <div className="flex items-center gap-2">
          {(subView === 'projects' || subView === 'tasks') && <ViewSwitcher view={viewMode} onChange={setViewMode} views={['list', 'kanban', 'gantt']} />}
          <ActionButton icon={Plus} label="New Project" onClick={() => {}} variant="primary" />
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {subView === 'projects' && (viewMode === 'list' ? <ProjectList /> : <ProjectCards />)}
        {subView === 'tasks' && <ProjectTasks viewMode={viewMode} />}
        {subView === 'gantt' && <ProjectGantt />}
        {subView === 'timesheets' && <HRTimesheets />}
      </div>
    </div>
  );
}

function ProjectList() {
  const columns = [
    { key: 'name', label: 'Project', render: (v: string, row: any) => (
      <div className="flex items-center gap-3">
        <div className="w-3 h-10 rounded-full" style={{ background: row.color }} />
        <div>
          <p className="text-white/90">{v}</p>
          <p className="text-[8px] text-white/35">{row.customer}</p>
        </div>
      </div>
    )},
    { key: 'manager', label: 'Manager' },
    { key: 'startDate', label: 'Start' },
    { key: 'endDate', label: 'End' },
    { key: 'budget', label: 'Budget', render: (v: number, row: any) => (
      <div>
        <span className="font-mono text-white/70">${(v / 1000).toFixed(0)}k</span>
        <p className="text-[8px] text-white/30">${(row.spent / 1000).toFixed(0)}k spent</p>
      </div>
    )},
    { key: 'progress', label: 'Progress', render: (v: number) => <ProgressBar value={v} max={100} /> },
    { key: 'status', label: 'Status', render: (v: string) => <StatusBadge status={v} /> },
  ];

  return <DataTable columns={columns} data={PROJECTS} />;
}

function ProjectCards() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="grid grid-cols-2 gap-4">
        {PROJECTS.map(p => (
          <div key={p.id} className="rounded-2xl p-5 bg-white/[0.04] border border-white/8 hover:border-emerald-500/30 cursor-pointer transition-all">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[12px] font-semibold text-white/90">{p.name}</p>
                <p className="text-[9px] text-white/40">{p.customer}</p>
              </div>
              <StatusBadge status={p.status} />
            </div>
            <div className="mb-4">
              <div className="flex justify-between text-[9px] mb-1">
                <span className="text-white/40">Progress</span>
                <span className="text-white/70">{p.progress}%</span>
              </div>
              <ProgressBar value={p.progress} max={100} color={p.color} />
            </div>
            <div className="grid grid-cols-3 gap-2 text-[9px]">
              <div><p className="text-white/30">Tasks</p><p className="text-white/60">{p.tasksDone}/{p.taskCount}</p></div>
              <div><p className="text-white/30">Budget</p><p className="text-white/60">${(p.budget / 1000).toFixed(0)}k</p></div>
              <div><p className="text-white/30">Spent</p><p className="text-white/60">${(p.spent / 1000).toFixed(0)}k</p></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProjectTasks({ viewMode }: { viewMode: ViewMode }) {
  const TASK_STAGES = ['todo', 'in_progress', 'review', 'done'] as const;
  const STAGE_CONFIG: Record<string, { label: string; color: string }> = {
    todo: { label: 'To Do', color: 'border-slate-500/30' },
    in_progress: { label: 'In Progress', color: 'border-cyan-500/30' },
    review: { label: 'Review', color: 'border-amber-500/30' },
    done: { label: 'Done', color: 'border-emerald-500/30' },
  };

  if (viewMode === 'kanban') {
    return (
      <div className="h-full overflow-x-auto">
        <div className="flex gap-3 h-full min-w-max">
          {TASK_STAGES.map(stage => {
            const config = STAGE_CONFIG[stage];
            const tasks = PROJECT_TASKS.filter(t => t.stage === stage);
            return (
              <div key={stage} className="w-56 flex flex-col shrink-0">
                <div className={`flex items-center justify-between px-3 py-2.5 rounded-t-xl border-b ${config.color} bg-white/[0.04]`}>
                  <span className="text-[10px] font-semibold text-white/70">{config.label}</span>
                  <span className="text-[8px] text-white/30 bg-white/10 px-1.5 py-0.5 rounded">{tasks.length}</span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 p-2 rounded-b-xl bg-white/[0.02] border border-t-0 border-white/8">
                  {tasks.map(t => (
                    <div key={t.id} className="p-3 rounded-xl bg-white/[0.06] border border-white/10 hover:border-cyan-500/30 cursor-pointer">
                      <p className="text-[10px] font-semibold text-white/90 mb-1">{t.name}</p>
                      <p className="text-[9px] text-white/40 mb-2">{t.projectName}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant={t.priority === 'critical' ? 'danger' : t.priority === 'high' ? 'warning' : 'default'} size="xs">{t.priority}</Badge>
                        <span className="text-[8px] text-white/50">{t.spentHours}/{t.estimatedHours}h</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const columns = [
    { key: 'name', label: 'Task' },
    { key: 'projectName', label: 'Project' },
    { key: 'assigneeName', label: 'Assignee' },
    { key: 'stage', label: 'Stage', render: (v: string) => <StatusBadge status={v} /> },
    { key: 'priority', label: 'Priority', render: (v: string) => <Badge variant={v === 'critical' || v === 'high' ? 'danger' : v === 'medium' ? 'warning' : 'default'} size="xs">{v}</Badge> },
    { key: 'progress', label: 'Progress', render: (v: number) => <ProgressBar value={v} max={100} color="#22d3ee" showLabel={false} /> },
  ];

  return <DataTable columns={columns} data={PROJECT_TASKS} />;
}

function ProjectGantt() {
  return <EmptyState icon={GanttChart} title="Gantt Chart" description="View project timelines and task dependencies in a Gantt chart." />;
}

// ── POS MODULE ───────────────────────────────────────────────────────────────

function POSModule() {
  const [cart, setCart] = useState<{ product: typeof PRODUCTS[0]; qty: number }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const addToCart = (product: typeof PRODUCTS[0]) => {
    const existing = cart.find(c => c.product.id === product.id);
    if (existing) {
      setCart(cart.map(c => c.product.id === product.id ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { product, qty: 1 }]);
    }
  };

  const cartTotal = cart.reduce((a, c) => a + c.product.price * c.qty, 0);
  const filteredProducts = selectedCategory === 'all' ? POS_PRODUCTS : POS_PRODUCTS.filter(p => p.category === selectedCategory);

  return (
    <div className="h-full flex gap-4">
      {/* Products */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-4 shrink-0">
          {['all', ...POS_CATEGORIES].map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg text-[10px] font-medium transition-all ${selectedCategory === cat ? 'bg-cyan-500/20 border border-cyan-500/30 text-cyan-400' : 'text-white/50 hover:bg-white/5'}`}>
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-3 gap-3">
            {filteredProducts.map(p => (
              <button key={p.id} onClick={() => addToCart(p)}
                className="p-4 rounded-xl bg-white/[0.04] border border-white/8 hover:border-cyan-500/30 text-left transition-all">
                <p className="text-[11px] font-semibold text-white/90">{p.name}</p>
                <p className="text-[9px] text-white/40 mt-1">{p.sku}</p>
                <p className="text-[12px] font-mono text-cyan-400 mt-2">${p.price.toLocaleString()}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cart */}
      <div className="w-80 shrink-0 rounded-2xl bg-white/[0.04] border border-white/8 flex flex-col">
        <div className="px-4 py-3 border-b border-white/10 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-white/80">Current Order</span>
            <button className="text-[9px] text-red-400 hover:text-red-300">Clear</button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <p className="text-center text-white/30 text-[10px] py-8">Cart is empty</p>
          ) : (
            cart.map(item => (
              <div key={item.product.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                <div className="flex-1">
                  <p className="text-[10px] text-white/80">{item.product.name}</p>
                  <p className="text-[8px] text-white/30">${item.product.price.toLocaleString()} x {item.qty}</p>
                </div>
                <span className="font-mono text-emerald-400 text-[10px]">${(item.product.price * item.qty).toLocaleString()}</span>
              </div>
            ))
          )}
        </div>
        <div className="p-4 border-t border-white/10 shrink-0 space-y-3">
          <div className="flex justify-between text-[11px]">
            <span className="text-white/50">Subtotal</span>
            <span className="font-mono text-white/80">${cartTotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-white/50">Tax (18%)</span>
            <span className="font-mono text-white/80">${(cartTotal * 0.18).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[13px] font-semibold pt-2 border-t border-white/10">
            <span className="text-white/80">Total</span>
            <span className="font-mono text-emerald-400">${(cartTotal * 1.18).toFixed(2)}</span>
          </div>
          <button className="w-full py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold hover:bg-emerald-500/30 transition-all">
            Pay ${(cartTotal * 1.18).toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── HELPDESK MODULE ──────────────────────────────────────────────────────────

function HelpdeskModule() {
  const [subView, setSubView] = useState<'tickets' | 'knowledge' | 'sla'>('tickets');
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  const tabs = [
    { id: 'tickets' as const, label: 'Tickets', count: TICKETS.length },
    { id: 'knowledge' as const, label: 'Knowledge Base' },
    { id: 'sla' as const, label: 'SLA Policies' },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <Tabs tabs={tabs} active={subView} onChange={v => setSubView(v)} />
        <ActionButton icon={Plus} label="New Ticket" onClick={() => {}} variant="primary" />
      </div>

      <div className="flex-1 overflow-hidden">
        {subView === 'tickets' && <TicketsList onSelect={setSelectedTicket} />}
        {subView === 'knowledge' && <KnowledgeBase />}
        {subView === 'sla' && <SLAPolicies />}
      </div>

      <Modal open={!!selectedTicket} onClose={() => setSelectedTicket(null)} title="Ticket Details" width="xl">
        {selectedTicket && <TicketDetail ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />}
      </Modal>
    </div>
  );
}

function TicketsList({ onSelect }: { onSelect: (t: any) => void }) {
  const columns = [
    { key: 'number', label: 'Ticket #', render: (v: string) => <span className="font-mono text-cyan-400/80">{v}</span> },
    { key: 'subject', label: 'Subject' },
    { key: 'customer', label: 'Customer' },
    { key: 'priority', label: 'Priority', render: (v: string) => <Badge variant={v === 'high' ? 'danger' : v === 'medium' ? 'warning' : 'default'} size="xs">{v}</Badge> },
    { key: 'stage', label: 'Stage', render: (v: string) => <StatusBadge status={v} /> },
    { key: 'assignedTo', label: 'Assigned' },
    { key: 'lastUpdate', label: 'Updated' },
    { key: 'slaStatus', label: 'SLA', render: (v: string) => <StatusBadge status={v} /> },
  ];

  return <DataTable columns={columns} data={TICKETS} onRowClick={onSelect} />;
}

function KnowledgeBase() {
  return <EmptyState icon={BookOpen} title="Knowledge Base" description="Create and manage help articles for customers and support staff." />;
}

function SLAPolicies() {
  return <EmptyState icon={Shield} title="SLA Policies" description="Define service level agreements for different customer tiers." />;
}

function TicketDetail({ ticket, onClose }: { ticket: any; onClose: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <span className="font-mono text-cyan-400 text-[12px]">{ticket.number}</span>
          <p className="text-[14px] font-semibold text-white/90">{ticket.subject}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={ticket.priority === 'high' ? 'danger' : 'warning'}>{ticket.priority}</Badge>
          <StatusBadge status={ticket.stage} />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4 text-[10px]">
        <div><p className="text-white/30">Customer</p><p className="text-white/70">{ticket.customer}</p></div>
        <div><p className="text-white/30">Contact</p><p className="text-white/70">{ticket.contact}</p></div>
        <div><p className="text-white/30">Category</p><p className="text-white/70">{ticket.category}</p></div>
        <div><p className="text-white/30">Created</p><p className="text-white/70">{ticket.createDate}</p></div>
      </div>
      <div className="rounded-xl p-4 bg-white/[0.04] border border-white/8">
        <p className="text-[9px] text-white/40 uppercase mb-2">Description</p>
        <p className="text-[10px] text-white/70">{ticket.description}</p>
      </div>
    </div>
  );
}

// ── MANUFACTURING MODULE ────────────────────────────────────────────────────

function ManufacturingModule() {
  const [subView, setSubView] = useState<'orders' | 'bom' | 'workcenters' | 'quality'>('orders');

  const tabs = [
    { id: 'orders' as const, label: 'Manufacturing Orders', count: MANUFACTURING_ORDERS.length },
    { id: 'bom' as const, label: 'Bill of Materials', count: BILL_OF_MATERIALS.length },
    { id: 'workcenters' as const, label: 'Work Centers' },
    { id: 'quality' as const, label: 'Quality Control' },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <Tabs tabs={tabs} active={subView} onChange={v => setSubView(v)} />
        <ActionButton icon={Plus} label="New MO" onClick={() => {}} variant="primary" />
      </div>

      <div className="flex-1 overflow-hidden">
        {subView === 'orders' && <ManufacturingOrders />}
        {subView === 'bom' && <BOMList />}
        {subView === 'workcenters' && <WorkCenters />}
        {subView === 'quality' && <QualityControl />}
      </div>
    </div>
  );
}

function ManufacturingOrders() {
  const columns = [
    { key: 'number', label: 'MO #', render: (v: string) => <span className="font-mono text-orange-400">{v}</span> },
    { key: 'productName', label: 'Product' },
    { key: 'quantity', label: 'Quantity', render: (v: number) => <span className="font-mono text-white/70">{v}</span> },
    { key: 'status', label: 'Status', render: (v: string) => <StatusBadge status={v} /> },
    { key: 'startDate', label: 'Start' },
    { key: 'endDate', label: 'End' },
    { key: 'finishedGoods', label: 'Produced', render: (v: number) => <span className="font-mono text-emerald-400">{v}</span> },
  ];

  return <DataTable columns={columns} data={MANUFACTURING_ORDERS} />;
}

function BOMList() {
  const columns = [
    { key: 'name', label: 'BOM Code', render: (v: string) => <span className="font-mono text-cyan-400">{v}</span> },
    { key: 'productName', label: 'Product' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'status', label: 'Status', render: (v: string) => <StatusBadge status={v} /> },
    { key: 'version', label: 'Version' },
  ];

  return <DataTable columns={columns} data={BILL_OF_MATERIALS} />;
}

function WorkCenters() {
  const workcenters = [
    { id: 'WC-001', name: 'Assembly Line A', capacity: 100, load: 72, status: 'active' },
    { id: 'WC-002', name: 'Assembly Line B', capacity: 80, load: 65, status: 'active' },
    { id: 'WC-003', name: 'Packaging Station', capacity: 200, load: 45, status: 'active' },
    { id: 'WC-004', name: 'Quality Check', capacity: 150, load: 30, status: 'active' },
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="grid grid-cols-2 gap-4">
        {workcenters.map(wc => (
          <div key={wc.id} className="rounded-xl p-4 bg-white/[0.04] border border-white/8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Cog size={14} className="text-orange-400" />
                <span className="text-[11px] font-semibold text-white/80">{wc.name}</span>
              </div>
              <StatusBadge status={wc.status} />
            </div>
            <div className="flex justify-between text-[9px] mb-2">
              <span className="text-white/40">Capacity</span>
              <span className="text-white/60">{wc.load}/{wc.capacity} units</span>
            </div>
            <ProgressBar value={wc.load} max={wc.capacity} color="#f97316" />
          </div>
        ))}
      </div>
    </div>
  );
}

function QualityControl() {
  return <EmptyState icon={CheckCircle} title="Quality Control" description="Manage quality checks and inspection processes." />;
}

// ── PURCHASING MODULE ─────────────────────────────────────────────────────────

function PurchasingModule() {
  const [subView, setSubView] = useState<'orders' | 'vendors' | 'agreements'>('orders');

  const tabs = [
    { id: 'orders' as const, label: 'Purchase Orders', count: PURCHASE_ORDERS.length },
    { id: 'vendors' as const, label: 'Vendors', count: VENDORS.length },
    { id: 'agreements' as const, label: 'Agreements' },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <Tabs tabs={tabs} active={subView} onChange={v => setSubView(v)} />
        <ActionButton icon={Plus} label="New PO" onClick={() => {}} variant="primary" />
      </div>

      <div className="flex-1 overflow-hidden">
        {subView === 'orders' && <PurchaseOrders />}
        {subView === 'vendors' && <VendorsList />}
        {subView === 'agreements' && <VendorAgreements />}
      </div>
    </div>
  );
}

function PurchaseOrders() {
  const columns = [
    { key: 'number', label: 'PO #', render: (v: string) => <span className="font-mono text-amber-400">{v}</span> },
    { key: 'vendor', label: 'Vendor' },
    { key: 'date', label: 'Date' },
    { key: 'deliveryDate', label: 'Delivery' },
    { key: 'total', label: 'Total', render: (v: number) => <span className="font-mono text-red-400">${(v / 1000).toFixed(0)}k</span> },
    { key: 'status', label: 'Status', render: (v: string) => <StatusBadge status={v} /> },
  ];

  return <DataTable columns={columns} data={PURCHASE_ORDERS} />;
}

function VendorsList() {
  const columns = [
    { key: 'name', label: 'Vendor' },
    { key: 'email', label: 'Email' },
    { key: 'country', label: 'Country' },
    { key: 'leadTime', label: 'Lead Time', render: (v: number) => <span className="font-mono text-white/70">{v} days</span> },
    { key: 'rating', label: 'Rating', render: (v: number) => (
      <div className="flex items-center gap-1">
        <Star size={10} className="text-amber-400" fill={v >= 4.5 ? 'currentColor' : 'none'} />
        <span className="text-white/70">{v.toFixed(1)}</span>
      </div>
    )},
    { key: 'totalPurchased', label: 'Total Purchased', render: (v: number) => <span className="font-mono text-emerald-400">${(v / 1000).toFixed(0)}k</span> },
  ];

  return <DataTable columns={columns} data={VENDORS} />;
}

function VendorAgreements() {
  return <EmptyState icon={FileCheck} title="Vendor Agreements" description="Manage blanket orders and long-term supplier agreements." />;
}

// ── REPORTS MODULE ──────────────────────────────────────────────────────────

function ReportsModule() {
  return (
    <div className="h-full overflow-y-auto space-y-4">
      <div className="grid grid-cols-4 gap-4">
        {[
          { name: 'Sales Analysis', icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
          { name: 'Inventory Valuation', icon: Package, color: 'text-cyan-400', bg: 'bg-cyan-500/15' },
          { name: 'Financial Reports', icon: FileText, color: 'text-amber-400', bg: 'bg-amber-500/15' },
          { name: 'HR Statistics', icon: Users, color: 'text-violet-400', bg: 'bg-violet-500/15' },
          { name: 'Project Performance', icon: BarChart3, color: 'text-sky-400', bg: 'bg-sky-500/15' },
          { name: 'Manufacturing Efficiency', icon: Factory, color: 'text-orange-400', bg: 'bg-orange-500/15' },
          { name: 'Customer Insights', icon: Target, color: 'text-rose-400', bg: 'bg-rose-500/15' },
          { name: 'Expense Analysis', icon: Wallet, color: 'text-red-400', bg: 'bg-red-500/15' },
        ].map(r => {
          const Icon = r.icon;
          return (
            <div key={r.name} className="rounded-2xl p-5 bg-white/[0.04] border border-white/8 hover:border-cyan-500/30 cursor-pointer transition-all">
              <div className={`w-12 h-12 rounded-xl ${r.bg} flex items-center justify-center mb-4`}>
                <Icon size={20} className={r.color} />
              </div>
              <p className="text-[11px] font-semibold text-white/80">{r.name}</p>
              <p className="text-[9px] text-white/30 mt-1">Generate detailed reports</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── SETTINGS MODULE ───────────────────────────────────────────────────────────

function SettingsModule() {
  const [subView, setSubView] = useState<'company' | 'users' | 'localization' | 'email' | 'integrations'>('company');

  const tabs = [
    { id: 'company' as const, label: 'Company' },
    { id: 'users' as const, label: 'Users & Permissions' },
    { id: 'localization' as const, label: 'Localization' },
    { id: 'email' as const, label: 'Email' },
    { id: 'integrations' as const, label: 'Integrations' },
  ];

  return (
    <div className="h-full flex flex-col">
      <Tabs tabs={tabs} active={subView} onChange={v => setSubView(v)} />

      <div className="flex-1 mt-4">
        {subView === 'company' && (
          <div className="space-y-6 max-w-2xl">
            <div className="rounded-2xl p-6 bg-white/[0.04] border border-white/8">
              <p className="text-[10px] font-semibold text-white/70 uppercase tracking-wider mb-4">Company Information</p>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Company Name"><Input value="ELSX Corporation" onChange={() => {}} /></FormField>
                <FormField label="Tax ID"><Input value="US-123456789" onChange={() => {}} /></FormField>
                <FormField label="Address"><Input value="100 Tech Plaza" onChange={() => {}} /></FormField>
                <FormField label="City"><Input value="San Francisco" onChange={() => {}} /></FormField>
                <FormField label="Country"><Select value="USA" onChange={() => {}} options={[{ value: 'USA', label: 'United States' }, { value: 'UK', label: 'United Kingdom' }, { value: 'DE', label: 'Germany' }]} /></FormField>
                <FormField label="Currency"><Select value="USD" onChange={() => {}} options={[{ value: 'USD', label: 'USD ($)' }, { value: 'EUR', label: 'EUR (€)' }, { value: 'GBP', label: 'GBP (£)' }]} /></FormField>
              </div>
            </div>
            <div className="flex justify-end">
              <button className="px-6 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-[10px] font-medium">Save Changes</button>
            </div>
          </div>
        )}
        {subView === 'users' && <EmptyState icon={Users} title="User Management" description="Manage user accounts, roles, and access permissions." />}
        {subView === 'localization' && <EmptyState icon={Globe} title="Localization" description="Configure language, timezone, and regional settings." />}
        {subView === 'email' && <EmptyState icon={Mail} title="Email Configuration" description="Set up SMTP servers and email templates." />}
        {subView === 'integrations' && <EmptyState icon={Layers} title="Integrations" description="Connect third-party services and APIs." />}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const MODULES: Array<{ id: ModuleId; label: string; icon: typeof LayoutDashboard; color: string; badge?: string }> = [
  { id: 'dashboard',     label: 'Dashboard',      icon: LayoutDashboard, color: 'text-cyan-400'    },
  { id: 'crm',          label: 'CRM',             icon: Target,         color: 'text-violet-400', badge: '3' },
  { id: 'sales',        label: 'Sales',          icon: DollarSign,     color: 'text-emerald-400' },
  { id: 'inventory',    label: 'Inventory',       icon: Package,       color: 'text-sky-400',    badge: '2' },
  { id: 'accounting',   label: 'Accounting',       icon: Receipt,       color: 'text-amber-400'  },
  { id: 'hr',           label: 'HR',              icon: Users,         color: 'text-rose-400'   },
  { id: 'project',      label: 'Projects',        icon: ListTodo,      color: 'text-teal-400'   },
  { id: 'purchasing',   label: 'Purchasing',       icon: ShoppingCart, color: 'text-orange-400' },
  { id: 'manufacturing',label: 'Manufacturing',    icon: Factory,       color: 'text-red-400'    },
  { id: 'pos',          label: 'Point of Sale',    icon: Monitor,       color: 'text-indigo-400' },
  { id: 'helpdesk',      label: 'Helpdesk',        icon: Headphones,    color: 'text-pink-400'   },
  { id: 'reports',      label: 'Reports',         icon: BarChart3,     color: 'text-slate-400'  },
  { id: 'settings',     label: 'Settings',        icon: Settings,      color: 'text-gray-400'   },
];

export default function ELSXApp({ leads, shipments, syncing, onSync }: Props) {
  const [module, setModule] = useState<ModuleId>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [breadcrumb, setBreadcrumb] = useState<string[]>(['ELSX', 'Dashboard']);
  const [showNotifications, setShowNotifications] = useState(false);

  const navigate = (m: ModuleId) => {
    setModule(m);
    const mod = MODULES.find(x => x.id === m);
    setBreadcrumb(['ELSX', mod?.label || m]);
  };

  return (
    <div className="h-full flex bg-slate-950/95 text-white">
      {/* Sidebar */}
      <div className={`shrink-0 border-r border-white/[0.07] flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-56'}`}
        style={{ background: 'rgba(255,255,255,0.015)' }}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-3 py-3 border-b border-white/[0.07] shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center shrink-0">
            <Zap size={16} className="text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-white/90">ELSX ERP</p>
              <p className="text-[8px] text-white/30">Enterprise Suite v3.0</p>
            </div>
          )}
          <button onClick={() => setSidebarCollapsed(c => !c)} className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-white/60 transition-colors shrink-0">
            {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-2 px-2">
          <div className="space-y-0.5">
            {MODULES.map(m => {
              const Icon = m.icon;
              const active = module === m.id;
              return (
                <button key={m.id} onClick={() => navigate(m.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[10px] font-medium transition-all ${
                    active
                      ? `bg-gradient-to-r from-white/[0.08] to-transparent ${m.color} border ${m.color.replace('text-', 'border-')}/20`
                      : 'text-white/40 hover:text-white/70 hover:bg-white/5 border border-transparent'
                  }`}>
                  <Icon size={16} className={active ? m.color : 'text-white/30'} />
                  {!sidebarCollapsed && (
                    <>
                      <span className="flex-1 text-left">{m.label}</span>
                      {m.badge && <span className="text-[7px] px-1.5 py-0.5 rounded bg-white/10 text-white/50">{m.badge}</span>}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom */}
        <div className="shrink-0 p-3 border-t border-white/[0.07] space-y-2">
          {!sidebarCollapsed && (
            <div className="px-3 py-2 rounded-lg bg-white/[0.03] space-y-1">
              <div className="flex justify-between text-[8px]">
                <span className="text-white/25">Pipeline</span>
                <span className="text-emerald-400">$2.84M</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar - Sticky with backdrop blur */}
        <div className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-5 py-3 border-b border-white/[0.07] shrink-0 backdrop-blur-xl"
          style={{ background: 'rgba(5,8,17,0.85)' }}>
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-[10px] overflow-x-auto no-scrollbar">
            {breadcrumb.map((b, i) => (
              <span key={i} className="flex items-center gap-1 shrink-0">
                {i > 0 && <ChevronRight size={10} className="text-white/20" />}
                <span className={i === breadcrumb.length - 1 ? 'text-white/70 font-medium' : 'text-white/30 hover:text-white/50 cursor-pointer'}>{b}</span>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search - Hidden on mobile */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
              <Search size={12} className="text-white/30" />
              <input type="text" placeholder="Search..." className="bg-transparent text-[10px] text-white/70 placeholder-white/30 outline-none w-32 lg:w-40" />
              <span className="text-[7px] text-white/20 px-1.5 py-0.5 rounded bg-white/10">⌘K</span>
            </div>
            <button onClick={onSync} disabled={syncing}
              className="flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/25 text-cyan-400 text-[9px] font-medium hover:bg-cyan-500/25 transition-all disabled:opacity-50 min-h-[44px] sm:min-h-0">
              <RefreshCw size={14} className={`sm:text-[11px] ${syncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{syncing ? 'Syncing…' : 'Sync'}</span>
            </button>
            <button className="relative p-2.5 sm:p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white/70 transition-colors min-h-[44px] sm:min-h-0 flex items-center justify-center">
              <Bell size={16} className="sm:text-[14px]" />
              <span className="absolute top-1.5 right-1.5 sm:top-1 sm:right-1 w-1.5 h-1.5 rounded-full bg-red-500" />
            </button>
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500/30 to-cyan-500/30 flex items-center justify-center cursor-pointer hover:brightness-110 transition-all shrink-0">
              <span className="text-[10px] font-semibold text-white/80">A</span>
            </div>
          </div>
        </div>

        {/* Module Content - scrollable */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-5">
          {module === 'dashboard' && <DashboardModule />}
          {module === 'crm' && <CRMModule />}
          {module === 'sales' && <SalesModule />}
          {module === 'inventory' && <InventoryModule />}
          {module === 'accounting' && <AccountingModule />}
          {module === 'hr' && <HRModule />}
          {module === 'project' && <ProjectModule />}
          {module === 'purchasing' && <PurchasingModule />}
          {module === 'manufacturing' && <ManufacturingModule />}
          {module === 'pos' && <POSModule />}
          {module === 'helpdesk' && <HelpdeskModule />}
          {module === 'reports' && <ReportsModule />}
          {module === 'settings' && <SettingsModule />}
        </div>
      </div>
    </div>
  );
}
