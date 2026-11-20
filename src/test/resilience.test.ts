import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnalyticsEngine } from '../core/analytics/analyticsEngine';
import { StorageEngine } from '../core/storage/storageEngine';

describe('Data Integrity & Resilience Tests', () => {
  let analytics: AnalyticsEngine;
  let storage: StorageEngine;

  beforeEach(() => {
    localStorage.clear();
    analytics = new AnalyticsEngine();
    storage = new StorageEngine();
  });

  describe('Corrupted Backup Recovery & Sanitization', () => {
    it('handles totally invalid JSON syntax without crashing or throwing', () => {
      const initialStreak = analytics.getStreakData();
      const result = analytics.importBackup('{{{ invalid json syntax ...');
      expect(result).toBe(false);
      // Existing data must remain intact
      expect(analytics.getStreakData()).toEqual(initialStreak);
    });

    it('rejects empty or whitespace-only backup strings', () => {
      expect(analytics.importBackup('')).toBe(false);
      expect(analytics.importBackup('   ')).toBe(false);
    });

    it('rejects non-object parsed JSON (e.g. primitives, arrays)', () => {
      expect(analytics.importBackup('12345')).toBe(false);
      expect(analytics.importBackup('"just a string"')).toBe(false);
      expect(analytics.importBackup('true')).toBe(false);
      expect(analytics.importBackup('null')).toBe(false);
      expect(analytics.importBackup('[]')).toBe(false);
    });

    it('rejects backups with missing or invalid sessions array', () => {
      expect(analytics.importBackup(JSON.stringify({ streakData: { currentStreak: 5 } }))).toBe(false);
      expect(analytics.importBackup(JSON.stringify({ sessions: "not an array", streakData: { currentStreak: 5 } }))).toBe(false);
    });

    it('rejects backups with missing or invalid streakData object', () => {
      expect(analytics.importBackup(JSON.stringify({ sessions: [] }))).toBe(false);
      expect(analytics.importBackup(JSON.stringify({ sessions: [], streakData: "corrupted_string" }))).toBe(false);
      expect(analytics.importBackup(JSON.stringify({ sessions: [], streakData: null }))).toBe(false);
      expect(analytics.importBackup(JSON.stringify({ sessions: [], streakData: { currentStreak: "not_a_number" } }))).toBe(false);
    });

    it('sanitizes partial streakData and filters invalid session objects gracefully', () => {
      const payload = {
        sessions: [
          { id: 'sess_1', durationSeconds: 1500, endedAt: Date.now() },
          null, // corrupted entry
          { id: 'sess_bad' }, // missing durationSeconds
          { id: 'sess_2', durationSeconds: 900, endedAt: Date.now(), subjectTag: 'UPSC-Polity' }
        ],
        streakData: {
          currentStreak: 3,
          longestStreak: 10,
          // missing lastActiveDate, nextCheckTimestamp, history
        }
      };

      const result = analytics.importBackup(JSON.stringify(payload));
      expect(result).toBe(true);

      const importedSessions = analytics.getSessions();
      expect(importedSessions.length).toBe(2);
      expect(importedSessions[0].id).toBe('sess_1');
      expect(importedSessions[1].id).toBe('sess_2');

      const importedStreak = analytics.getStreakData();
      expect(importedStreak.currentStreak).toBe(3);
      expect(importedStreak.longestStreak).toBe(10);
      expect(importedStreak.history).toBeDefined();
      expect(typeof importedStreak.history).toBe('object');
    });
  });

  describe('Storage Engine Resilience', () => {
    it('returns fallback value when localStorage contains syntax errors', () => {
      localStorage.setItem('corrupted_key', '{bad_json: 123');
      const fallback = { fallback: true };
      const loaded = storage.loadLocalSync('corrupted_key', fallback);
      expect(loaded).toEqual(fallback);
    });

    it('returns fallback value when localStorage contains literal null string', () => {
      localStorage.setItem('null_key', 'null');
      const fallback = { defaultSettings: true };
      const loaded = storage.loadLocalSync('null_key', fallback);
      expect(loaded).toEqual(fallback);
    });

    it('returns fallback value when localStorage key does not exist', () => {
      const fallback = { count: 0 };
      const loaded = storage.loadLocalSync('non_existent_key', fallback);
      expect(loaded).toEqual(fallback);
    });

    it('handles localStorage quota exceeded errors without throwing unhandled exceptions', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('QuotaExceededError', 'QuotaExceededError');
      });
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      expect(() => {
        storage.saveLocalSync('large_key', { data: 'test' });
      }).not.toThrow();

      expect(consoleWarnSpy).toHaveBeenCalled();
      setItemSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });

    it('handles corrupted IndexedDB operations gracefully without crashing', async () => {
      // Mock dbPromise with rejecting transaction
      const customStorage = new StorageEngine();
      (customStorage as any).dbPromise = Promise.resolve({
        transaction: () => {
          throw new Error('IndexedDB transaction failed');
        }
      });

      await expect(customStorage.persistSessionToIDB({ id: 'test' })).rejects.toThrow('IndexedDB transaction failed');
      const sessions = await customStorage.loadAllSessionsFromIDB();
      expect(sessions).toEqual([]);
    });
  });
});
