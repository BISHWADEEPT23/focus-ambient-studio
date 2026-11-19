/**
 * Dual-Tier Storage Engine for Focus & Ambient Engine.
 * Combines synchronous LocalStorage for instantaneous UI hydration with
 * IndexedDB for durable, high-capacity session logs and analytics.
 */

export interface AppStoredState {
  settings?: any;
  tasks?: any[];
  streakData?: any;
  sessions?: any[];
}

const STORAGE_KEYS = {
  SETTINGS: 'flocus_engine_settings',
  TASKS: 'flocus_engine_tasks',
  STREAK: 'flocus_engine_streak',
  SESSIONS: 'flocus_engine_sessions',
};

const DB_NAME = 'FlocusAmbientDB';
const DB_VERSION = 1;
const STORE_SESSIONS = 'sessions';
const STORE_TASKS = 'tasks';

export class StorageEngine {
  private dbPromise: Promise<IDBDatabase | null>;
  private debounceTimers: Map<string, number> = new Map();

  constructor() {
    this.dbPromise = this.initIndexedDB();
  }

  private initIndexedDB(): Promise<IDBDatabase | null> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return Promise.resolve(null);
    }

    return new Promise((resolve) => {
      try {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(STORE_SESSIONS)) {
            db.createObjectStore(STORE_SESSIONS, { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(STORE_TASKS)) {
            db.createObjectStore(STORE_TASKS, { keyPath: 'id' });
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => {
          console.warn('IndexedDB failed to open, falling back to LocalStorage only');
          resolve(null);
        };
      } catch (err) {
        console.warn('IndexedDB initialization error:', err);
        resolve(null);
      }
    });
  }

  public saveLocalSync(key: string, data: any): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn(`LocalStorage write error for ${key}:`, e);
    }
  }

  public loadLocalSync<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined' || !window.localStorage) return fallback;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch {
      return fallback;
    }
  }

  public debouncedSave(key: string, data: any, delayMs = 400): void {
    const existing = this.debounceTimers.get(key);
    if (existing) clearTimeout(existing);

    const timer = window.setTimeout(() => {
      this.saveLocalSync(key, data);
      this.debounceTimers.delete(key);
    }, delayMs);

    this.debounceTimers.set(key, timer);
  }

  public async persistSessionToIDB(session: any): Promise<void> {
    const db = await this.dbPromise;
    if (!db) return;

    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(STORE_SESSIONS, 'readwrite');
        const store = tx.objectStore(STORE_SESSIONS);
        store.put(session);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  public async loadAllSessionsFromIDB(): Promise<any[]> {
    const db = await this.dbPromise;
    if (!db) return [];

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_SESSIONS, 'readonly');
        const store = tx.objectStore(STORE_SESSIONS);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });
  }

  public getKeys() {
    return STORAGE_KEYS;
  }
}

export const globalStorage = new StorageEngine();
