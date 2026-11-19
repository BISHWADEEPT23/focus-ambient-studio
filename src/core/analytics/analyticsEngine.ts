import { FocusSessionLog, StreakData } from '../../types';

export function getTodayDateString(d = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isWeekend(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

export class AnalyticsEngine {
  private sessions: FocusSessionLog[] = [];
  private streakData: StreakData;
  private onDataChange?: (sessions: FocusSessionLog[], streak: StreakData) => void;

  constructor(
    initialSessions?: FocusSessionLog[],
    initialStreak?: StreakData,
    onDataChange?: (sessions: FocusSessionLog[], streak: StreakData) => void
  ) {
    this.sessions = initialSessions ? [...initialSessions] : [];
    this.streakData = initialStreak ?? {
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: '',
      nextCheckTimestamp: new Date().setHours(24, 0, 0, 0),
      history: {},
    };
    this.onDataChange = onDataChange;
    this.evaluateStreak();
  }

  public getSessions(): FocusSessionLog[] {
    return [...this.sessions];
  }

  public getStreakData(): StreakData {
    return { ...this.streakData };
  }

  public logSession(session: Omit<FocusSessionLog, 'id'>): FocusSessionLog {
    const newSession: FocusSessionLog = {
      id: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...session,
    };

    this.sessions.push(newSession);

    // Update streak history
    const dateStr = getTodayDateString(new Date(session.endedAt));
    this.streakData.history[dateStr] = (this.streakData.history[dateStr] || 0) + session.durationSeconds;

    // Evaluate and increment streak if applicable
    this.recordActivityForDate(new Date(session.endedAt));

    this.notify();
    return newSession;
  }

  private recordActivityForDate(date: Date): void {
    const todayStr = getTodayDateString(date);

    if (this.streakData.lastActiveDate === todayStr) {
      // Already credited today
      return;
    }

    if (!this.streakData.lastActiveDate) {
      // First active day ever
      this.streakData.currentStreak = 1;
      this.streakData.longestStreak = Math.max(this.streakData.longestStreak, 1);
      this.streakData.lastActiveDate = todayStr;
      return;
    }

    const lastDate = new Date(this.streakData.lastActiveDate);
    const diffMs = date.getTime() - lastDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) {
      // Consecutive day
      this.streakData.currentStreak += 1;
    } else {
      // Check if missed days were all weekends
      let onlyWeekendsMissed = true;
      const checkDate = new Date(lastDate);
      checkDate.setDate(checkDate.getDate() + 1);

      while (getTodayDateString(checkDate) < todayStr) {
        if (!isWeekend(checkDate)) {
          onlyWeekendsMissed = false;
          break;
        }
        checkDate.setDate(checkDate.getDate() + 1);
      }

      if (onlyWeekendsMissed) {
        // Weekend grace applies! Streak continues
        this.streakData.currentStreak += 1;
      } else {
        // Streak broken
        this.streakData.currentStreak = 1;
      }
    }

    this.streakData.longestStreak = Math.max(this.streakData.longestStreak, this.streakData.currentStreak);
    this.streakData.lastActiveDate = todayStr;
  }

  public evaluateStreak(): void {
    if (!this.streakData.lastActiveDate) return;

    const today = new Date();
    const todayStr = getTodayDateString(today);

    if (this.streakData.lastActiveDate === todayStr) return;

    const lastDate = new Date(this.streakData.lastActiveDate);
    const diffMs = today.getTime() - lastDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays > 1) {
      let onlyWeekendsMissed = true;
      const checkDate = new Date(lastDate);
      checkDate.setDate(checkDate.getDate() + 1);

      while (getTodayDateString(checkDate) < todayStr) {
        if (!isWeekend(checkDate)) {
          onlyWeekendsMissed = false;
          break;
        }
        checkDate.setDate(checkDate.getDate() + 1);
      }

      if (!onlyWeekendsMissed && !isWeekend(today)) {
        this.streakData.currentStreak = 0;
      }
    }
  }

  public getDailyStats(days = 7): Array<{ date: string; minutes: number }> {
    const result: Array<{ date: string; minutes: number }> = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const str = getTodayDateString(d);
      const seconds = this.streakData.history[str] || 0;
      result.push({
        date: str,
        minutes: Math.round(seconds / 60),
      });
    }

    return result;
  }

  public getSubjectBreakdown(): Record<string, number> {
    const map: Record<string, number> = {};
    for (const s of this.sessions) {
      const tag = s.subjectTag || 'General';
      map[tag] = (map[tag] || 0) + Math.round(s.durationSeconds / 60);
    }
    return map;
  }

  public exportBackup(): string {
    const data = {
      version: '1.0.0',
      exportedAt: Date.now(),
      sessions: this.sessions,
      streakData: this.streakData,
    };
    return JSON.stringify(data, null, 2);
  }

  public importBackup(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed.sessions) && parsed.streakData) {
        this.sessions = parsed.sessions;
        this.streakData = parsed.streakData;
        this.notify();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  private notify(): void {
    if (this.onDataChange) {
      this.onDataChange(this.getSessions(), this.getStreakData());
    }
  }
}
