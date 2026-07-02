// ── Secure Local Vault: IndexedDB + Web Crypto API ─────────────────────────
// Offline-first encrypted storage. Files/notes are encrypted client-side with
// AES-GCM before being persisted to IndexedDB. The encryption key is derived
// from a passphrase via PBKDF2 and held in memory only while the vault is open.
//
// Phase 12: Zero-Trust Client-Side Encryption
// IndexedDB Store: AethelisVaultDB
// Object Store: secure_notes with keyPath 'id'
// Record Schema: { id: string, encryptedData: ArrayBuffer, iv: Uint8Array, timestamp: string }

const DB_NAME = 'AethelisVaultDB';
const DB_VERSION = 1;
const STORE_NAME = 'secure_notes';
const SALT_KEY = 'aethelis_vault_salt';

export interface SecureNote {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

interface StoredRecord {
  id: string;
  encryptedData: ArrayBuffer;
  iv: Uint8Array;
  timestamp: string;
  createdAt?: number;
  updatedAt?: number;
}

let cryptoKey: CryptoKey | null = null;

// ── IndexedDB helpers ──────────────────────────────────────────────────────

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function dbGetAll(): Promise<StoredRecord[]> {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result as StoredRecord[]);
    req.onerror = () => reject(req.error);
  }));
}

function dbPut(record: StoredRecord): Promise<void> {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  }));
}

function dbDelete(id: string): Promise<void> {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  }));
}

// ── Key derivation (PBKDF2) ────────────────────────────────────────────────

async function getOrCreateSalt(): Promise<Uint8Array> {
  const existing = localStorage.getItem(SALT_KEY);
  if (existing) {
    const arr = JSON.parse(existing) as number[];
    return new Uint8Array(arr);
  }
  const salt = crypto.getRandomValues(new Uint8Array(16));
  localStorage.setItem(SALT_KEY, JSON.stringify(Array.from(salt)));
  return salt;
}

async function deriveKey(passphrase: string): Promise<CryptoKey> {
  const salt = await getOrCreateSalt();
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 150000, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// ── Public API ─────────────────────────────────────────────────────────────

export async function unlockVault(passphrase: string): Promise<SecureNote[]> {
  cryptoKey = await deriveKey(passphrase);
  return listNotes();
}

export function lockVault(): void {
  cryptoKey = null;
}

export function isVaultUnlocked(): boolean {
  return cryptoKey !== null;
}

export async function listNotes(): Promise<SecureNote[]> {
  if (!cryptoKey) return [];
  const records = await dbGetAll();
  const notes: SecureNote[] = [];
  for (const rec of records) {
    try {
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: rec.iv }, cryptoKey, rec.encryptedData
      );
      const text = new TextDecoder().decode(decrypted);
      const parsed = JSON.parse(text) as { title: string; content: string };
      notes.push({
        id: rec.id,
        title: parsed.title,
        content: parsed.content,
        createdAt: rec.createdAt ?? Date.now(),
        updatedAt: rec.updatedAt ?? Date.now(),
      });
    } catch {
      notes.push({
        id: rec.id,
        title: '[Decryption Failed]',
        content: '',
        createdAt: rec.createdAt ?? Date.now(),
        updatedAt: rec.updatedAt ?? Date.now(),
      });
    }
  }
  return notes.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function saveNote(title: string, content: string): Promise<SecureNote> {
  if (!cryptoKey) throw new Error('Vault is locked');
  const now = Date.now();
  const id = `note_${now}_${Math.random().toString(36).slice(2, 8)}`;
  const plaintext = JSON.stringify({ title, content });
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv }, cryptoKey, new TextEncoder().encode(plaintext)
  );
  await dbPut({
    id,
    encryptedData,
    iv,
    timestamp: new Date().toISOString(),
    createdAt: now,
    updatedAt: now,
  });
  return { id, title, content, createdAt: now, updatedAt: now };
}

export async function deleteNote(id: string): Promise<void> {
  await dbDelete(id);
}
