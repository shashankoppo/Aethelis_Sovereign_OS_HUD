import React, { memo, ReactNode } from 'react';
import { LucideIcon, FileX, Inbox, AlertTriangle, Wifi, Database, Shield } from 'lucide-react';

// ── Skeleton Components ────────────────────────────────────────────

export const Skeleton = memo(function Skeleton({
  variant = 'text',
  className = '',
}: {
  variant?: 'text' | 'title' | 'avatar' | 'card' | 'row';
  className?: string;
}) {
  const variantStyles = {
    text: 'h-4 w-full',
    title: 'h-6 w-3/5',
    avatar: 'h-10 w-10 rounded-full',
    card: 'h-32 w-full rounded-xl',
    row: 'h-12 w-full rounded-lg mb-2',
  };

  return (
    <div
      className={`skeleton-glass ${variantStyles[variant]} ${className}`}
      aria-hidden="true"
    />
  );
});

// ── Loading Grid ───────────────────────────────────────────────────

export const LoadingGrid = memo(function LoadingGrid({
  count = 3,
  variant = 'card',
}: {
  count?: number;
  variant?: 'card' | 'row';
}) {
  return (
    <div className="space-y-3" role="status" aria-label="Loading content">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} variant={variant} />
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
});

// ── Empty State ────────────────────────────────────────────────────

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState = memo(function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`empty-state ${className}`} role="status">
      <Icon className="empty-state-icon" size={48} aria-hidden="true" />
      <h3 className="empty-state-title">{title}</h3>
      {description && (
        <p className="empty-state-description">{description}</p>
      )}
      {action && (
        <button onClick={action.onClick} className="empty-state-action">
          {action.label}
        </button>
      )}
    </div>
  );
});

// ── Error State ────────────────────────────────────────────────────

export interface ErrorStateProps {
  title?: string;
  message: string;
  retry?: () => void;
  className?: string;
}

export const ErrorState = memo(function ErrorState({
  title = 'Something went wrong',
  message,
  retry,
  className = '',
}: ErrorStateProps) {
  return (
    <div className={`empty-state ${className}`} role="alert">
      <AlertTriangle className="empty-state-icon text-rose-400" size={48} aria-hidden="true" />
      <h3 className="empty-state-title text-rose-300">{title}</h3>
      <p className="empty-state-description text-rose-200/60">{message}</p>
      {retry && (
        <button
          onClick={retry}
          className="empty-state-action bg-gradient-to-r from-rose-500 to-orange-500"
        >
          Try Again
        </button>
      )}
    </div>
  );
});

// ── Offline State ────────────────────────────────────────────────────

export const OfflineState = memo(function OfflineState({
  onRetry,
}: {
  onRetry?: () => void;
}) {
  return (
    <div className="empty-state" role="alert" aria-live="polite">
      <Wifi className="empty-state-icon text-amber-400" size={48} aria-hidden="true" />
      <h3 className="empty-state-title text-amber-300">You're offline</h3>
      <p className="empty-state-description">
        Check your internet connection and try again.
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="empty-state-action bg-gradient-to-r from-amber-500 to-orange-500"
        >
          Retry Connection
        </button>
      )}
    </div>
  );
});

// ── Empty States for Specific Apps ─────────────────────────────────────

export const EmptyLedger = memo(function EmptyLedger({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      icon={Database}
      title="No Transactions Yet"
      description="Your sovereign ledger is empty. Start tracking assets and movements."
      action={onAdd ? { label: 'Add First Entry', onClick: onAdd } : undefined}
    />
  );
});

export const EmptyVault = memo(function EmptyVault({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      icon={Shield}
      title="Vault is Empty"
      description="No encrypted files or notes detected. Initiate a secure entry."
      action={onAdd ? { label: 'Create Note', onClick: onAdd } : undefined}
    />
  );
});

export const EmptyFiles = memo(function EmptyFiles() {
  return (
    <EmptyState
      icon={FileX}
      title="No Files Found"
      description="This directory is empty or no files match your search."
    />
  );
});

// ── Toast Notification System ─────────────────────────────────────────

export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onDismiss: (id: string) => void;
}

export const Toast = memo(function Toast({ id, type, message, onDismiss }: ToastProps) {
  return (
    <div
      className={`toast toast-${type}`}
      role="alert"
      aria-live="polite"
      onClick={() => onDismiss(id)}
    >
      <span className="flex-1 text-sm text-white/90">{message}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDismiss(id);
        }}
        className="text-white/40 hover:text-white/80 ml-2"
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  );
});

export const ToastContainer = memo(function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastProps[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-label="Notifications">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
});
