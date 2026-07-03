import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode, useRef } from 'react';

// ── Types ─────────────────────────────────────────────────────────

export type WindowAnimationState = 'idle' | 'launching' | 'minimizing' | 'restoring' | 'closing';

export interface WindowState {
  id: string;
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  gradient: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  isMaximized: boolean;
  animationState: WindowAnimationState;
}

export interface AppConfig {
  id: string;
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  gradient: string;
  defaultWidth?: number;
  defaultHeight?: number;
}

interface OSContextValue {
  // Window Management
  windows: WindowState[];
  activeWindowId: string | null;
  minimizedWindows: Set<string>;
  openWindow: (app: AppConfig) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  toggleMaximize: (id: string) => void;
  bringToFront: (id: string) => void;
  updateWindowPosition: (id: string, x: number, y: number) => void;
  updateWindowSize: (id: string, width: number, height: number) => void;

  // Dragging State
  isDragging: string | null;
  setIsDragging: (id: string | null) => void;

  // Launchpad
  launchpadOpen: boolean;
  setLaunchpadOpen: (open: boolean) => void;
  toggleLaunchpad: () => void;

  // Animation State
  getWindowAnimation: (id: string) => WindowAnimationState;

  // Utility
  isWindowOpen: (id: string) => boolean;
  isWindowMinimized: (id: string) => boolean;
  isWindowActive: (id: string) => boolean;
}

const OSContext = createContext<OSContextValue | null>(null);

// ── Animation Durations ────────────────────────────────────────────

const LAUNCH_DURATION = 500;
const MINIMIZE_DURATION = 400;
const RESTORE_DURATION = 450;
const CLOSE_DURATION = 250;

// ── Provider ─────────────────────────────────────────────────────────

export function OSProvider({ children }: { children: ReactNode }) {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [minimizedWindows, setMinimizedWindows] = useState<Set<string>>(new Set());
  const [launchpadOpen, setLaunchpadOpen] = useState(false);
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const animationTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // ── Window Management Functions ─────────────────────────────────

  const openWindow = useCallback((app: AppConfig) => {
    setWindows(prev => {
      const existing = prev.find(w => w.id === app.id);
      if (existing) {
        // Window exists, just bring to front and unminimize
        return prev.map(w =>
          w.id === app.id
            ? { ...w, zIndex: Math.max(...prev.map(p => p.zIndex)) + 1 }
            : w
        );
      }

      // Calculate position for new window
      const baseOffset = (prev.length % 5) * 30;
      const newZIndex = prev.length > 0 ? Math.max(...prev.map(w => w.zIndex)) + 1 : 1;

      const newWindow: WindowState = {
        id: app.id,
        title: app.title,
        icon: app.icon,
        color: app.color,
        gradient: app.gradient,
        x: 100 + baseOffset,
        y: 60 + baseOffset,
        width: app.defaultWidth || 800,
        height: app.defaultHeight || 500,
        zIndex: newZIndex,
        isMaximized: false,
        animationState: 'launching' as WindowAnimationState,
      };

      // Set animation to idle after launch animation completes
      const existingTimeout = animationTimeouts.current.get(app.id);
      if (existingTimeout) clearTimeout(existingTimeout);
      animationTimeouts.current.set(app.id, setTimeout(() => {
        setWindows(w => w.map(win =>
          win.id === app.id ? { ...win, animationState: 'idle' } : win
        ));
      }, LAUNCH_DURATION));

      return [...prev, newWindow];
    });

    setMinimizedWindows(prev => {
      const next = new Set(prev);
      next.delete(app.id);
      return next;
    });
    setActiveWindowId(app.id);
    setLaunchpadOpen(false);
  }, []);

  const closeWindow = useCallback((id: string) => {
    // Start closing animation
    setWindows(prev =>
      prev.map(w =>
        w.id === id ? { ...w, animationState: 'closing' as WindowAnimationState } : w
      )
    );

    // Remove after animation completes
    const existingTimeout = animationTimeouts.current.get(id);
    if (existingTimeout) clearTimeout(existingTimeout);
    animationTimeouts.current.set(id, setTimeout(() => {
      setWindows(prev => prev.filter(w => w.id !== id));
      setMinimizedWindows(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setActiveWindowId(prev => prev === id ? null : prev);
      animationTimeouts.current.delete(id);
    }, CLOSE_DURATION));
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    // Start minimize animation
    setWindows(prev =>
      prev.map(w =>
        w.id === id ? { ...w, animationState: 'minimizing' as WindowAnimationState } : w
      )
    );

    // Actually minimize after animation starts
    const existingTimeout = animationTimeouts.current.get(id);
    if (existingTimeout) clearTimeout(existingTimeout);
    animationTimeouts.current.set(id, setTimeout(() => {
      setMinimizedWindows(prev => new Set(prev).add(id));
      setWindows(w => w.map(win =>
        win.id === id ? { ...win, animationState: 'idle' } : win
      ));
      animationTimeouts.current.delete(id);
    }, MINIMIZE_DURATION));

    setActiveWindowId(prev => prev === id ? null : prev);
  }, []);

  const bringToFront = useCallback((id: string) => {
    setWindows(prev => {
      const maxZ = Math.max(...prev.map(w => w.zIndex));
      return prev.map(w =>
        w.id === id ? { ...w, zIndex: maxZ + 1 } : w
      );
    });
    setActiveWindowId(id);
    setMinimizedWindows(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const restoreWindow = useCallback((id: string) => {
    setWindows(prev =>
      prev.map(w =>
        w.id === id ? { ...w, animationState: 'restoring' as WindowAnimationState } : w
      )
    );

    setMinimizedWindows(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

    const existingTimeout = animationTimeouts.current.get(id);
    if (existingTimeout) clearTimeout(existingTimeout);
    animationTimeouts.current.set(id, setTimeout(() => {
      setWindows(w => w.map(win =>
        win.id === id ? { ...win, animationState: 'idle' } : win
      ));
      animationTimeouts.current.delete(id);
    }, RESTORE_DURATION));

    bringToFront(id);
  }, [bringToFront]);

  const toggleMaximize = useCallback((id: string) => {
    setWindows(prev =>
      prev.map(w =>
        w.id === id ? { ...w, isMaximized: !w.isMaximized } : w
      )
    );
  }, []);

  const updateWindowPosition = useCallback((id: string, x: number, y: number) => {
    setWindows(prev =>
      prev.map(w =>
        w.id === id && !w.isMaximized ? { ...w, x, y } : w
      )
    );
  }, []);

  const updateWindowSize = useCallback((id: string, width: number, height: number) => {
    setWindows(prev =>
      prev.map(w =>
        w.id === id && !w.isMaximized ? { ...w, width, height } : w
      )
    );
  }, []);

  const toggleLaunchpad = useCallback(() => {
    setLaunchpadOpen(prev => !prev);
  }, []);

  // ── Utility Functions ─────────────────────────────────

  const isWindowOpen = useCallback((id: string) => {
    return windows.some(w => w.id === id);
  }, [windows]);

  const isWindowMinimized = useCallback((id: string) => {
    return minimizedWindows.has(id);
  }, [minimizedWindows]);

  const isWindowActive = useCallback((id: string) => {
    return activeWindowId === id && !minimizedWindows.has(id);
  }, [activeWindowId, minimizedWindows]);

  const getWindowAnimation = useCallback((id: string): WindowAnimationState => {
    const win = windows.find(w => w.id === id);
    return win?.animationState || 'idle';
  }, [windows]);

  // ── Context Value ─────────────────────────────────

  const value = useMemo<OSContextValue>(() => ({
    windows,
    activeWindowId,
    minimizedWindows,
    openWindow,
    closeWindow,
    minimizeWindow,
    restoreWindow,
    toggleMaximize,
    bringToFront,
    updateWindowPosition,
    updateWindowSize,
    isDragging,
    setIsDragging,
    launchpadOpen,
    setLaunchpadOpen,
    toggleLaunchpad,
    getWindowAnimation,
    isWindowOpen,
    isWindowMinimized,
    isWindowActive,
  }), [
    windows,
    activeWindowId,
    minimizedWindows,
    openWindow,
    closeWindow,
    minimizeWindow,
    restoreWindow,
    toggleMaximize,
    bringToFront,
    updateWindowPosition,
    updateWindowSize,
    isDragging,
    launchpadOpen,
    setLaunchpadOpen,
    toggleLaunchpad,
    getWindowAnimation,
    isWindowOpen,
    isWindowMinimized,
    isWindowActive,
  ]);

  return (
    <OSContext.Provider value={value}>
      {children}
    </OSContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────────

export function useOS() {
  const context = useContext(OSContext);
  if (!context) {
    throw new Error('useOS must be used within an OSProvider');
  }
  return context;
}

export { OSContext };
