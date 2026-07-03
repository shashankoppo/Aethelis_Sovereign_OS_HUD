import React, { forwardRef, HTMLAttributes, ReactNode } from 'react';

// ── Types ─────────────────────────────────────────────────────────

export interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'default' | 'elevated' | 'subtle';
  glow?: 'none' | 'cyan' | 'violet' | 'emerald' | 'rose';
  hoverable?: boolean;
  clickable?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────

export const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(
  (
    {
      children,
      variant = 'default',
      glow = 'none',
      hoverable = false,
      clickable = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseStyles = 'relative overflow-hidden';

    const variantStyles = {
      default: 'card-glass',
      elevated: 'card-glass shadow-[0_8px_32px_rgba(0,0,0,0.4)]',
      subtle: 'bg-white/[0.02] border border-white/[0.05]',
    };

    const glowStyles = {
      none: '',
      cyan: 'glow-accent-cyan',
      violet: 'glow-accent-violet',
      emerald: 'glow-accent-emerald',
      rose: 'shadow-[0_0_30px_rgba(244,63,94,0.15)]',
    };

    const interactiveStyles = hoverable ? 'hover-lift cursor-pointer' : '';
    const clickStyles = clickable ? 'active:scale-[0.98] cursor-pointer' : '';

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${glowStyles[glow]} ${interactiveStyles} ${clickStyles} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassPanel.displayName = 'GlassPanel';

// ── Sub-components ─────────────────────────────────────────────────

export const GlassPanelHeader: React.FC<{ children: ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div className={`px-4 py-3 border-b border-white/[0.07] ${className}`}>
    {children}
  </div>
);

export const GlassPanelBody: React.FC<{ children: ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div className={`p-4 ${className}`}>
    {children}
  </div>
);

export const GlassPanelFooter: React.FC<{ children: ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div className={`px-4 py-3 border-t border-white/[0.07] ${className}`}>
    {children}
  </div>
);
