import { useState, useCallback, useEffect } from 'react';
import {
  unlockVault as vaultUnlock,
  lockVault as vaultLock,
  isVaultUnlocked,
  listNotes,
  saveNote as vaultSaveNote,
  deleteNote as vaultDeleteNote,
  SecureNote,
} from '../lib/secureVault';

// ── Types ─────────────────────────────────────────────────────────

export interface VaultState {
  notes: SecureNote[];
  isUnlocked: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface VaultActions {
  unlock: (passphrase: string) => Promise<boolean>;
  lock: () => void;
  saveNote: (title: string, content: string) => Promise<SecureNote | null>;
  deleteNote: (id: string) => Promise<boolean>;
  refreshNotes: () => Promise<void>;
}

export type UseSecureVaultReturn = VaultState & VaultActions;

// ── Hook ─────────────────────────────────────────────────────────

export function useSecureVault(): UseSecureVaultReturn {
  const [notes, setNotes] = useState<SecureNote[]>([]);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check initial unlock state on mount
  useEffect(() => {
    setIsUnlocked(isVaultUnlocked());
    if (isVaultUnlocked()) {
      refreshNotes();
    }
  }, []);

  const refreshNotes = useCallback(async () => {
    if (!isVaultUnlocked()) return;
    setIsLoading(true);
    setError(null);
    try {
      const fetchedNotes = await listNotes();
      setNotes(fetchedNotes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const unlock = useCallback(async (passphrase: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedNotes = await vaultUnlock(passphrase);
      setNotes(fetchedNotes);
      setIsUnlocked(true);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlock vault');
      setIsUnlocked(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const lock = useCallback(() => {
    vaultLock();
    setNotes([]);
    setIsUnlocked(false);
    setError(null);
  }, []);

  const saveNote = useCallback(async (title: string, content: string): Promise<SecureNote | null> => {
    if (!isVaultUnlocked()) {
      setError('Vault is locked');
      return null;
    }
    setIsLoading(true);
    setError(null);
    try {
      const note = await vaultSaveNote(title, content);
      await refreshNotes();
      return note;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save note');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [refreshNotes]);

  const deleteNote = useCallback(async (id: string): Promise<boolean> => {
    if (!isVaultUnlocked()) {
      setError('Vault is locked');
      return false;
    }
    setIsLoading(true);
    setError(null);
    try {
      await vaultDeleteNote(id);
      setNotes(prev => prev.filter(n => n.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete note');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    notes,
    isUnlocked,
    isLoading,
    error,
    unlock,
    lock,
    saveNote,
    deleteNote,
    refreshNotes,
  };
}
