import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  MessageCircle, Users, Send, Phone, Video, MoreVertical, Search,
  Plus, Hash, Lock, Bell, BellOff, Pin, Archive, Trash2, Edit,
  Smile, Paperclip, Image, Mic, ChevronLeft, Circle, CheckCircle,
  AlertTriangle, Shield, Key, Fingerprint, Globe, Clock, Star
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: Date;
  encrypted: boolean;
  read: boolean;
  edited?: boolean;
  attachments?: Array<{ type: 'image' | 'file'; name: string; url: string }>;
}

interface Conversation {
  id: string;
  type: 'direct' | 'group' | 'channel';
  name: string;
  avatar?: string;
  participants: Array<{ id: string; name: string; avatar: string; status: 'online' | 'offline' | 'away' }>;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
  encrypted: boolean;
  muted: boolean;
  pinned: boolean;
}

interface Contact {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline' | 'away';
  publicKey: string;
  verified: boolean;
  lastSeen?: Date;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════════

const MOCK_CONTACTS: Contact[] = [
  { id: 'U001', name: 'Sarah Chen', avatar: 'SC', status: 'online', publicKey: '0x7a2f...', verified: true },
  { id: 'U002', name: 'Marcus Webb', avatar: 'MW', status: 'away', publicKey: '0x3b4c...', verified: true },
  { id: 'U003', name: 'Elena Vasquez', avatar: 'EV', status: 'offline', publicKey: '0x9d1e...', verified: false, lastSeen: new Date(Date.now() - 3600000) },
  { id: 'U004', name: 'James Liu', avatar: 'JL', status: 'online', publicKey: '0x5f2a...', verified: true },
  { id: 'U005', name: 'Nadia Hassan', avatar: 'NH', status: 'offline', publicKey: '0x8c3b...', verified: true, lastSeen: new Date(Date.now() - 86400000) },
];

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'C001',
    type: 'direct',
    name: 'Sarah Chen',
    participants: [{ id: 'U001', name: 'Sarah Chen', avatar: 'SC', status: 'online' }],
    lastMessage: 'The quantum relay is ready for deployment',
    lastMessageTime: new Date(Date.now() - 120000),
    unreadCount: 2,
    encrypted: true,
    muted: false,
    pinned: true,
  },
  {
    id: 'C002',
    type: 'group',
    name: 'Operations Alpha',
    avatar: 'OA',
    participants: [
      { id: 'U001', name: 'Sarah Chen', avatar: 'SC', status: 'online' },
      { id: 'U002', name: 'Marcus Webb', avatar: 'MW', status: 'away' },
      { id: 'U004', name: 'James Liu', avatar: 'JL', status: 'online' },
    ],
    lastMessage: 'Meeting scheduled for 1400 UTC',
    lastMessageTime: new Date(Date.now() - 1800000),
    unreadCount: 0,
    encrypted: true,
    muted: false,
    pinned: true,
  },
  {
    id: 'C003',
    type: 'channel',
    name: '#announcements',
    avatar: '#',
    participants: [],
    lastMessage: 'System upgrade complete - v4.2.0 deployed',
    lastMessageTime: new Date(Date.now() - 7200000),
    unreadCount: 5,
    encrypted: false,
    muted: false,
    pinned: false,
  },
  {
    id: 'C004',
    type: 'direct',
    name: 'Elena Vasquez',
    participants: [{ id: 'U003', name: 'Elena Vasquez', avatar: 'EV', status: 'offline' }],
    lastMessage: 'Contract review attached',
    lastMessageTime: new Date(Date.now() - 3600000),
    unreadCount: 0,
    encrypted: true,
    muted: true,
    pinned: false,
  },
  {
    id: 'C005',
    type: 'group',
    name: 'Security Council',
    avatar: 'SC',
    participants: [
      { id: 'U004', name: 'James Liu', avatar: 'JL', status: 'online' },
      { id: 'U005', name: 'Nadia Hassan', avatar: 'NH', status: 'offline' },
    ],
    lastMessage: 'Audit report finalized',
    lastMessageTime: new Date(Date.now() - 86400000),
    unreadCount: 0,
    encrypted: true,
    muted: false,
    pinned: false,
  },
];

const MOCK_MESSAGES: Message[] = [
  { id: 'M001', conversationId: 'C001', senderId: 'U001', senderName: 'Sarah Chen', senderAvatar: 'SC', content: 'Hey, are you ready for the deployment?', timestamp: new Date(Date.now() - 300000), encrypted: true, read: true },
  { id: 'M002', conversationId: 'C001', senderId: 'me', senderName: 'You', senderAvatar: 'ME', content: 'Almost. Running final checks on the quantum lattice.', timestamp: new Date(Date.now() - 240000), encrypted: true, read: true },
  { id: 'M003', conversationId: 'C001', senderId: 'U001', senderName: 'Sarah Chen', senderAvatar: 'SC', content: 'Perfect. The integration tests passed with 100% coverage. Core nodes are synchronized.', timestamp: new Date(Date.now() - 180000), encrypted: true, read: true },
  { id: 'M004', conversationId: 'C001', senderId: 'me', senderName: 'You', senderAvatar: 'ME', content: 'Excellent. Initiating the relay sequence now.', timestamp: new Date(Date.now() - 120000), encrypted: true, read: true },
  { id: 'M005', conversationId: 'C001', senderId: 'U001', senderName: 'Sarah Chen', senderAvatar: 'SC', content: 'The quantum relay is ready for deployment', timestamp: new Date(Date.now() - 60000), encrypted: true, read: false },
  { id: 'M006', conversationId: 'C002', senderId: 'U002', senderName: 'Marcus Webb', senderAvatar: 'MW', content: 'Team, the coordination meeting is set. Please confirm availability.', timestamp: new Date(Date.now() - 3600000), encrypted: true, read: true },
  { id: 'M007', conversationId: 'C002', senderId: 'U004', senderName: 'James Liu', senderAvatar: 'JL', content: 'Confirmed. 1400 UTC works for me.', timestamp: new Date(Date.now() - 3000000), encrypted: true, read: true },
  { id: 'M008', conversationId: 'C002', senderId: 'U001', senderName: 'Sarah Chen', senderAvatar: 'SC', content: 'Meeting scheduled for 1400 UTC', timestamp: new Date(Date.now() - 1800000), encrypted: true, read: true },
];

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function StatusIndicator({ status, size = 'sm' }: { status: 'online' | 'offline' | 'away'; size?: 'sm' | 'md' }) {
  const colors = {
    online: 'bg-emerald-400',
    away: 'bg-amber-400',
    offline: 'bg-white/30',
  };
  const sizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
  };
  return <span className={`${sizes[size]} rounded-full ${colors[status]} ${status === 'online' ? 'animate-pulse' : ''}`} />;
}

function Avatar({ initials, color = 'from-violet-500 to-cyan-500', size = 'md', status }: { initials: string; color?: string; size?: 'sm' | 'md' | 'lg'; status?: 'online' | 'offline' | 'away' }) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-[10px]',
    md: 'w-10 h-10 text-xs',
    lg: 'w-12 h-12 text-sm',
  };
  return (
    <div className="relative">
      <div className={`${sizeClasses[size]} rounded-xl bg-gradient-to-br ${color} flex items-center justify-center font-semibold text-white shadow-lg`}>
        {initials}
      </div>
      {status && (
        <span className="absolute -bottom-0.5 -right-0.5">
          <StatusIndicator status={status} />
        </span>
      )}
    </div>
  );
}

function ConversationItem({
  conversation,
  isActive,
  onClick
}: {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}) {
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 60000) return 'now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const icon = conversation.type === 'channel' ? Hash :
               conversation.type === 'group' ? Users : MessageCircle;

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all min-h-[60px] ${
        isActive
          ? 'bg-gradient-to-r from-violet-500/15 to-cyan-500/10 border border-violet-500/30'
          : 'hover:bg-white/5 border border-transparent'
      }`}
    >
      {conversation.type === 'direct' ? (
        <Avatar
          initials={conversation.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          status={conversation.participants[0]?.status}
        />
      ) : (
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          conversation.type === 'channel' ? 'bg-white/10 text-white/60' : 'bg-gradient-to-br from-pink-500 to-rose-600'
        }`}>
          {conversation.type === 'channel' ? <Hash size={18} /> : <Users size={18} className="text-white" />}
        </div>
      )}

      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-xs font-semibold text-white/80 truncate">{conversation.name}</span>
          {conversation.encrypted && <Lock size={10} className="text-cyan-400 shrink-0" />}
          {conversation.pinned && <Pin size={10} className="text-amber-400/60 shrink-0" />}
        </div>
        <p className="text-[10px] text-white/40 truncate">{conversation.lastMessage || 'No messages'}</p>
      </div>

      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className="text-[9px] text-white/30">
          {conversation.lastMessageTime ? formatTime(conversation.lastMessageTime) : ''}
        </span>
        {conversation.unreadCount > 0 && (
          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-violet-500 text-white">
            {conversation.unreadCount}
          </span>
        )}
      </div>
    </button>
  );
}

function MessageBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''} mb-3`}>
      <Avatar initials={message.senderAvatar} size="sm" />
      <div className={`max-w-[70%] ${isOwn ? 'text-right' : ''}`}>
        <div className={`flex items-center gap-2 mb-1 ${isOwn ? 'justify-end' : ''}`}>
          <span className="text-[10px] font-semibold text-white/70">{isOwn ? 'You' : message.senderName}</span>
          <span className="text-[8px] text-white/30">{formatTime(message.timestamp)}</span>
          {message.encrypted && <Lock size={8} className="text-cyan-400" />}
        </div>
        <div className={`px-4 py-2.5 rounded-2xl text-[11px] leading-relaxed ${
          isOwn
            ? 'bg-gradient-to-r from-violet-500/20 to-cyan-500/15 text-white/90 border border-violet-500/20'
            : 'bg-white/5 text-white/80 border border-white/10'
        }`}>
          {message.content}
        </div>
        {isOwn && (
          <div className="flex items-center justify-end gap-1 mt-1">
            <CheckCircle size={10} className={message.read ? 'text-cyan-400' : 'text-white/30'} />
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function AetherLifeApp() {
  const [activeConversation, setActiveConversation] = useState<string | null>('C001');
  const [activeView, setActiveView] = useState<'chats' | 'contacts' | 'settings'>('chats');
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConv = useMemo(() =>
    MOCK_CONVERSATIONS.find(c => c.id === activeConversation),
    [activeConversation]
  );

  const conversationMessages = useMemo(() =>
    MOCK_MESSAGES.filter(m => m.conversationId === activeConversation),
    [activeConversation]
  );

  const filteredConversations = useMemo(() =>
    MOCK_CONVERSATIONS.filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => {
      if (a.pinned !== b.pinned) return b.pinned ? 1 : -1;
      if (b.lastMessageTime && a.lastMessageTime) {
        return b.lastMessageTime.getTime() - a.lastMessageTime.getTime();
      }
      return 0;
    }),
    [searchQuery]
  );

  const filteredContacts = useMemo(() =>
    MOCK_CONTACTS.filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => {
      if (a.status === 'online' && b.status !== 'online') return -1;
      if (b.status === 'online' && a.status !== 'online') return 1;
      return a.name.localeCompare(b.name);
    }),
    [searchQuery]
  );

  const handleSendMessage = useCallback(() => {
    if (!messageInput.trim()) return;
    // In real app, would send encrypted message
    setMessageInput('');
  }, [messageInput]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages]);

  return (
    <div className="h-full flex bg-slate-950/95 text-white overflow-hidden">
      {/* Left Sidebar - Conversations/Contacts */}
      <div className={`${showSidebar ? 'w-72 sm:w-80' : 'w-0'} shrink-0 flex flex-col border-r border-white/[0.07] transition-all duration-300 overflow-hidden`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07] shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
              <MessageCircle size={14} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white/90">Aether-Life</p>
              <p className="text-[8px] text-white/30">Encrypted Network</p>
            </div>
          </div>
          <button
            onClick={() => setShowSidebar(false)}
            className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white/70 transition-colors lg:hidden"
          >
            <ChevronLeft size={14} />
          </button>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-1 px-3 py-2 shrink-0 border-b border-white/[0.04]">
          {(['chats', 'contacts'] as const).map(view => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              className={`flex-1 py-2 px-3 rounded-lg text-[10px] font-medium capitalize transition-all min-h-[40px]
                ${activeView === view
                  ? 'bg-violet-500/15 text-violet-300 border border-violet-500/30'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                }`}
            >
              {view}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="px-3 py-2 shrink-0">
          <div className="relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              placeholder="Search..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg text-[10px] bg-white/[0.04] border border-white/[0.07] text-white/80 placeholder-white/30 outline-none focus:border-violet-500/30 transition-colors"
            />
          </div>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {activeView === 'chats' ? (
            filteredConversations.map(conv => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={activeConversation === conv.id}
                onClick={() => {
                  setActiveConversation(conv.id);
                  setShowSidebar(false);
                }}
              />
            ))
          ) : (
            filteredContacts.map(contact => (
              <button
                key={contact.id}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all min-h-[56px]"
              >
                <Avatar
                  initials={contact.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  status={contact.status}
                />
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs font-medium text-white/80">{contact.name}</span>
                    {contact.verified && <Shield size={10} className="text-cyan-400" />}
                  </div>
                  <p className="text-[9px] text-white/30 flex items-center gap-1">
                    <StatusIndicator status={contact.status} />
                    <span className="capitalize">{contact.status}</span>
                    {contact.status === 'offline' && contact.lastSeen && (
                      <span>• {contact.lastSeen.toLocaleDateString()}</span>
                    )}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button className="p-2 rounded-lg hover:bg-white/10 text-white/30 hover:text-cyan-400 transition-all">
                    <Phone size={12} />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-white/10 text-white/30 hover:text-violet-400 transition-all">
                    <Video size={12} />
                  </button>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Security Status */}
        <div className="shrink-0 p-3 border-t border-white/[0.07]">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
            <Shield size={14} className="text-cyan-400" />
            <div className="flex-1">
              <p className="text-[9px] font-medium text-cyan-300">E2E Encrypted</p>
              <p className="text-[7px] text-cyan-400/50">All messages secured</p>
            </div>
            <Fingerprint size={16} className="text-cyan-400/50" />
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeConv ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07] shrink-0 backdrop-blur-xl bg-slate-950/80">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowSidebar(true)}
                  className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white/70 transition-colors lg:hidden"
                >
                  <ChevronLeft size={14} />
                </button>
                {activeConv.type === 'direct' ? (
                  <Avatar
                    initials={activeConv.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    status={activeConv.participants[0]?.status}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-pink-500 to-rose-600">
                    {activeConv.type === 'channel' ? <Hash size={18} className="text-white" /> : <Users size={18} className="text-white" />}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-white/90">{activeConv.name}</span>
                    {activeConv.encrypted && <Lock size={10} className="text-cyan-400" />}
                  </div>
                  <p className="text-[9px] text-white/40">
                    {activeConv.type === 'direct' ? (
                      activeConv.participants[0]?.status === 'online' ? 'Active now' : 'Offline'
                    ) : (
                      `${activeConv.participants.length} members`
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button className="p-2.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white/70 transition-all min-h-[44px] flex items-center justify-center">
                  <Phone size={16} />
                </button>
                <button className="p-2.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white/70 transition-all min-h-[44px] flex items-center justify-center">
                  <Video size={16} />
                </button>
                <button className="p-2.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white/70 transition-all min-h-[44px] flex items-center justify-center">
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
              {conversationMessages.map(msg => (
                <MessageBubble key={msg.id} message={msg} isOwn={msg.senderId === 'me'} />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="shrink-0 p-4 border-t border-white/[0.07] bg-slate-950/80 backdrop-blur-xl">
              <div className="flex items-end gap-3">
                <div className="flex gap-1 shrink-0">
                  <button className="p-2.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-white/60 transition-all min-h-[44px] flex items-center justify-center">
                    <Paperclip size={16} />
                  </button>
                  <button className="p-2.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-white/60 transition-all min-h-[44px] flex items-center justify-center">
                    <Image size={16} />
                  </button>
                </div>
                <div className="flex-1 relative">
                  <textarea
                    value={messageInput}
                    onChange={e => setMessageInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type a message..."
                    rows={1}
                    className="w-full px-4 py-3 rounded-xl text-[11px] bg-white/[0.04] border border-white/[0.07] text-white/90 placeholder-white/30 outline-none focus:border-violet-500/30 resize-none min-h-[44px]"
                  />
                </div>
                <button className="p-2.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-white/60 transition-all min-h-[44px] flex items-center justify-center">
                  <Mic size={16} />
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                  className="p-3 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 text-white disabled:opacity-40 disabled:grayscale transition-all min-h-[44px] flex items-center justify-center"
                >
                  <Send size={16} />
                </button>
              </div>
              <div className="flex items-center justify-between mt-2 px-1">
                <div className="flex items-center gap-1.5 text-[8px] text-white/30">
                  <Lock size={10} />
                  Messages are end-to-end encrypted
                </div>
                <button className="text-[8px] text-violet-400 hover:text-violet-300 transition-colors">
                  <Smile size={14} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500/20 to-rose-600/20 flex items-center justify-center mx-auto mb-4">
                <MessageCircle size={32} className="text-pink-400" />
              </div>
              <h3 className="text-lg font-light text-white/80 mb-2">Select a conversation</h3>
              <p className="text-[10px] text-white/40">Choose from your existing chats or start a new one</p>
              <button
                onClick={() => setShowSidebar(true)}
                className="mt-4 px-4 py-2 rounded-lg bg-violet-500/20 text-violet-300 text-[10px] font-medium hover:bg-violet-500/30 transition-all"
              >
                View Conversations
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - Contact Details (Desktop Only) */}
      {activeConv && activeConv.type === 'direct' && (
        <div className="hidden lg:flex w-64 shrink-0 flex-col border-l border-white/[0.07] overflow-hidden">
          <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
            <Avatar
              initials={activeConv.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              size="lg"
              status={activeConv.participants[0]?.status}
            />
            <h3 className="text-sm font-semibold text-white/90 mt-4">{activeConv.name}</h3>
            <p className="text-[10px] text-white/40 capitalize">{activeConv.participants[0]?.status}</p>

            <div className="w-full mt-6 space-y-2">
              <button className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-white/5 text-white/60 hover:text-white/90 transition-all text-[10px]">
                <Bell size={14} />
                <span>Mute notifications</span>
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-white/5 text-white/60 hover:text-white/90 transition-all text-[10px]">
                <Search size={14} />
                <span>Search messages</span>
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-white/5 text-white/60 hover:text-white/90 transition-all text-[10px]">
                <Star size={14} />
                <span>Add to favorites</span>
              </button>
            </div>
          </div>

          <div className="shrink-0 p-4 border-t border-white/[0.07]">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
              <Key size={12} className="text-cyan-400" />
              <div>
                <p className="text-[8px] font-medium text-cyan-300">Public Key</p>
                <p className="text-[7px] text-cyan-400/50 font-mono">{activeConv.participants[0]?.id.slice(0, 8)}...****</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
