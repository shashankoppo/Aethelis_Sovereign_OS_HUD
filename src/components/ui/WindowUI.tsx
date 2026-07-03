import React, { memo } from 'react';
import { X, Minus, Maximize2 } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────

export interface TrafficLightsProps {
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  isMaximized?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export interface WindowTitlebarProps {
  title: string;
  icon?: React.ReactNode;
  isActive?: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  isMaximized?: boolean;
  children?: React.ReactNode;
  draggable?: boolean;
  onDragStart?: (e: React.MouseEvent) => void;
  onDoubleClick?: () => void;
}

// ── TrafficLights Component ────────────────────────────────────────

export const TrafficLights = memo(function TrafficLights({
  onClose,
  onMinimize,
  onMaximize,
  isMaximized = false,
  size = 'sm',
  className = '',
}: TrafficLightsProps) {
  const buttons = [
    {
      action: onClose,
      icon: X,
      color: '#ff5f56',
      border: '#e0443e',
      label: 'Close window',
    },
    {
      action: onMinimize,
      icon: Minus,
      color: '#ffbd2e',
      border: '#dea123',
      label: 'Minimize window',
    },
    {
      action: onMaximize,
      icon: Maximize2,
      color: '#27c93f',
      border: '#1aab29',
      label: isMaximized ? 'Restore window' : 'Maximize window',
    },
  ];

  const sizeStyles = {
    sm: { button: 'w-3 h-3', icon: 7 },
    md: { button: 'w-5 h-5', icon: 10 },
  };

  return (
    <div
      className={`flex items-center gap-1.5 ${size === 'md' ? 'gap-2' : ''} ${className}`}
      role="group"
      aria-label="Window controls"
    >
      {buttons.map((btn) => {
        const Icon = btn.icon;
        return (
          <button
            key={btn.color}
            onClick={(e) => {
              e.stopPropagation();
              btn.action();
            }}
            style={{ backgroundColor: btn.color, borderColor: btn.border }}
            className={`rounded-full border flex items-center justify-center group hover:brightness-110 active:scale-90 transition-transform ${sizeStyles[size].button}`}
            aria-label={btn.label}
            type="button"
          >
            <Icon
              size={sizeStyles[size].icon}
              className="text-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-hidden="true"
            />
          </button>
        );
      })}
    </div>
  );
});

// ── WindowTitlebar Component ─────────────────────────────────────────

export const WindowTitlebar = memo(function WindowTitlebar({
  title,
  icon,
  isActive = false,
  onClose,
  onMinimize,
  onMaximize,
  isMaximized = false,
  children,
  draggable = true,
  onDragStart,
  onDoubleClick,
}: WindowTitlebarProps) {
  return (
    <header
      className={`h-12 sm:h-10 flex items-center px-2 sm:px-3 cursor-default shrink-0 ${isActive ? 'titlebar-glass' : 'bg-transparent'}`}
      onMouseDown={draggable ? onDragStart : undefined}
      onDoubleClick={onDoubleClick}
      onTouchStart={draggable ? (onDragStart as React.TouchEventHandler | undefined) as any : undefined}
      role="banner"
      aria-label={`${title} window titlebar`}
    >
      <TrafficLights
        onClose={onClose}
        onMinimize={onMinimize}
        onMaximize={onMaximize}
        isMaximized={isMaximized}
        size="sm"
      />

      <div className="flex-1 flex justify-center items-center gap-1.5 pointer-events-none text-sm sm:text-[10px] font-semibold text-white/70">
        {icon}
        <span>{title}</span>
      </div>

      {children}
      <div className="w-[60px]" aria-hidden="true" />
    </header>
  );
});
