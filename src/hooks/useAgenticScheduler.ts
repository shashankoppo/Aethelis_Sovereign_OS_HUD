import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  agenticScheduler,
  agenticEventBus,
  AgenticEvent,
  AgenticStatus,
} from '../lib/AgenticScheduler';

// ── Types ─────────────────────────────────────────────────────────

export interface TaskInfo {
  id: string;
  name: string;
  intervalSec: number;
  lastRun: Date | null;
  runCount: number;
}

export interface SchedulerState {
  isEnabled: boolean;
  tasks: TaskInfo[];
  events: AgenticEvent[];
  recentSuccessCount: number;
  recentErrorCount: number;
}

export interface SchedulerActions {
  start: () => void;
  stop: () => void;
  toggle: () => void;
  clearEvents: () => void;
}

export type UseAgenticSchedulerReturn = SchedulerState & SchedulerActions;

// ── Hook ─────────────────────────────────────────────────────────

export function useAgenticScheduler(maxEvents: number = 50): UseAgenticSchedulerReturn {
  const [events, setEvents] = useState<AgenticEvent[]>([]);
  const [isEnabled, setIsEnabled] = useState(false);
  const [tasks, setTasks] = useState<TaskInfo[]>([]);

  // Subscribe to agentic events
  useEffect(() => {
    const unsubscribe = agenticEventBus.subscribe((event) => {
      setEvents(prev => [...prev.slice(-(maxEvents - 1)), event].sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
      ));
    });

    // Check initial state
    setIsEnabled(agenticScheduler.isEnabled());
    setTasks(agenticScheduler.getTasks());

    return unsubscribe;
  }, [maxEvents]);

  // Update tasks periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setTasks(agenticScheduler.getTasks());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const start = useCallback(() => {
    agenticScheduler.start();
    setIsEnabled(true);
    setTasks(agenticScheduler.getTasks());
  }, []);

  const stop = useCallback(() => {
    agenticScheduler.stop();
    setIsEnabled(false);
    setTasks(agenticScheduler.getTasks());
  }, []);

  const toggle = useCallback(() => {
    if (agenticScheduler.isEnabled()) {
      stop();
    } else {
      start();
    }
  }, [start, stop]);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  // Memoized statistics
  const recentSuccessCount = useMemo(() =>
    events.filter(e => e.status === 'SUCCESS').length,
    [events]
  );

  const recentErrorCount = useMemo(() =>
    events.filter(e => e.status === 'ERROR').length,
    [events]
  );

  return {
    isEnabled,
    tasks,
    events,
    recentSuccessCount,
    recentErrorCount,
    start,
    stop,
    toggle,
    clearEvents,
  };
}

// ── Selective Hooks for Optimized Re-renders ─────────────────────────

export function useAgenticEvents(maxEvents: number = 20): AgenticEvent[] {
  const [events, setEvents] = useState<AgenticEvent[]>([]);

  useEffect(() => {
    const unsubscribe = agenticEventBus.subscribe((event) => {
      setEvents(prev => [...prev.slice(-(maxEvents - 1)), event]);
    });
    return unsubscribe;
  }, [maxEvents]);

  return events;
}

export function useSchedulerStatus(): { isEnabled: boolean; taskCount: number } {
  const [isEnabled, setIsEnabled] = useState(agenticScheduler.isEnabled());
  const [taskCount, setTaskCount] = useState(agenticScheduler.getTasks().length);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsEnabled(agenticScheduler.isEnabled());
      setTaskCount(agenticScheduler.getTasks().length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return { isEnabled, taskCount };
}
