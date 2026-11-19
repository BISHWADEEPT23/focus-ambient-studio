import { describe, it, expect } from 'vitest';
import { AnalyticsEngine } from '../core/analytics/analyticsEngine';

describe('Analytics & Streaks Engine Unit Tests', () => {
  it('increments streak on consecutive active days', () => {
    const engine = new AnalyticsEngine();
    const day1 = new Date(2026, 10, 10);
    const day2 = new Date(2026, 10, 11);

    engine.logSession({
      startedAt: day1.getTime() - 1500000,
      endedAt: day1.getTime(),
      durationSeconds: 1500,
      mode: 'pomodoro',
      completedSuccessfully: true,
    });

    expect(engine.getStreakData().currentStreak).toBe(1);

    engine.logSession({
      startedAt: day2.getTime() - 1500000,
      endedAt: day2.getTime(),
      durationSeconds: 1500,
      mode: 'pomodoro',
      completedSuccessfully: true,
    });

    expect(engine.getStreakData().currentStreak).toBe(2);
  });

  it('preserves streaks across weekend grace periods', () => {
    const engine = new AnalyticsEngine();
    // Friday: Nov 13, 2026
    const friday = new Date(2026, 10, 13);
    // Monday: Nov 16, 2026 (Saturday 14 & Sunday 15 skipped)
    const monday = new Date(2026, 10, 16);

    engine.logSession({
      startedAt: friday.getTime() - 1500000,
      endedAt: friday.getTime(),
      durationSeconds: 1500,
      mode: 'pomodoro',
      completedSuccessfully: true,
    });

    expect(engine.getStreakData().currentStreak).toBe(1);

    engine.logSession({
      startedAt: monday.getTime() - 1500000,
      endedAt: monday.getTime(),
      durationSeconds: 1500,
      mode: 'pomodoro',
      completedSuccessfully: true,
    });

    // Should NOT reset to 1, because intervening days were Saturday & Sunday!
    expect(engine.getStreakData().currentStreak).toBe(2);
  });

  it('exports and restores JSON backups accurately', () => {
    const engine = new AnalyticsEngine();
    engine.logSession({
      startedAt: Date.now() - 1500000,
      endedAt: Date.now(),
      durationSeconds: 1500,
      mode: 'pomodoro',
      subjectTag: 'UPSC-Polity',
      completedSuccessfully: true,
    });

    const backupJson = engine.exportBackup();
    expect(backupJson).toContain('UPSC-Polity');

    const freshEngine = new AnalyticsEngine();
    const success = freshEngine.importBackup(backupJson);

    expect(success).toBe(true);
    expect(freshEngine.getSessions().length).toBe(1);
    expect(freshEngine.getSessions()[0].subjectTag).toBe('UPSC-Polity');
  });
});
