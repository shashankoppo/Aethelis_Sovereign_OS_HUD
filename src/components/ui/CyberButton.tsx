import React, { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────

export interface CyberButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'default' | 'primary' | 'danger' | 'ghost' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────

export const CyberButton = forwardRef<HTMLButtonElement, CyberButtonProps>(
  (
    {
      children,
      variant = 'default',
      size = 'md',
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center justify-center font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2';

    const variantStyles = {
      default: 'btn-glass text-white/85 hover:text-white',
      primary: 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:opacity-90 shadow-lg hover:shadow-cyan-500/25',
      danger: 'bg-rose-500/80 text-white hover:bg-rose-600 shadow-lg hover:shadow-rose-500/25',
      ghost: 'bg-transparent text-white/60 hover:text-white hover:bg-white/10',
      gradient: 'bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:opacity-90 shadow-lg hover:shadow-violet-500/25',
    };

    const sizeStyles = {
      sm: 'text-[10px] px-3 py-1.5 rounded-lg gap-1.5 min-h-[32px]',
      md: 'text-xs px-4 py-2.5 rounded-xl gap-2 min-h-[40px]',
      lg: 'text-sm px-6 py-3 rounded-xl gap-2.5 min-h-[48px]',
    };

    const disabledStyles = disabled || isLoading
      ? 'opacity-50 cursor-not-allowed pointer-events-none'
      : 'cursor-pointer';

    const widthStyles = fullWidth ? 'w-full' : '';

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${disabledStyles} ${widthStyles} ${className}`}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 size={size === 'sm' ? 12 : size === 'md' ? 14 : 16} className="animate-spin" />
            {loadingText && <span>{loadingText}</span>}
          </>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            <span>{children}</span>
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

CyberButton.displayName = 'CyberButton';

// ── Icon Button Variant ─────────────────────────────────────────

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  variant?: 'default' | 'ghost' | 'primary';
  size?: 'sm' | 'md' | 'lg';
  'aria-label': string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      variant = 'default',
      size = 'md',
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400';

    const variantStyles = {
      default: 'bg-white/10 hover:bg-white/20 text-white/70 hover:text-white',
      ghost: 'bg-transparent hover:bg-white/10 text-white/50 hover:text-white/80',
      primary: 'bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30',
    };

    const sizeStyles = {
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
      lg: 'w-12 h-12',
    };

    const disabledStyles = disabled
      ? 'opacity-50 cursor-not-allowed pointer-events-none'
      : 'cursor-pointer';

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${disabledStyles} ${className}`}
        {...props}
      >
        {icon}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
