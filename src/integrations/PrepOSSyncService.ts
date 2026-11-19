/**
 * PrepOSSyncService.ts
 * Focus session logger and syllabus sync dispatcher for UPSC Prep OS and RBI Prep OS.
 * Supports granular topic tagging, study intensity ratings (1-5), syllabus taxonomy mapping,
 * and comprehensive JSON/CSV export capabilities.
 */

import { FocusSessionLog } from '../types';
import {
  IntegrationEventBus,
  integrationBus,
} from '../core/contracts/integrationContracts';

export type PrepOSTargetSystem = 'UPSC_PREP_OS' | 'RBI_PREP_OS' | 'PERSONAL_INTEL_OS';

export type StudyIntensityRating = 1 | 2 | 3 | 4 | 5;

export interface PrepOSSessionRecord {
  id: string;
  targetSystem: PrepOSTargetSystem;
  subjectTag: string;
  syllabusModule: string;
  topicTag: string;
  durationMinutes: number;
  durationSeconds: number;
  startedAt: number;
  completedAt: number;
  studyIntensityRating: StudyIntensityRating;
  notes?: string;
  taskId?: string;
  taskTitle?: string;
  synced: boolean;
  syncedAt?: number;
}

export interface LogFocusSessionParams {
  id?: string;
  targetSystem?: PrepOSTargetSystem;
  subjectTag: string;
  syllabusModule?: string;
  topicTag?: string;
  durationSeconds: number;
  startedAt?: number;
  completedAt?: number;
  studyIntensityRating?: StudyIntensityRating;
  notes?: string;
  taskId?: string;
  taskTitle?: string;
}

export interface SyllabusModuleDefinition {
  moduleName: string;
  topics: string[];
  keywords: string[];
}

export interface SyllabusSummary {
  targetSystem?: PrepOSTargetSystem;
  totalSessions: number;
  totalDurationMinutes: number;
  totalDurationHours: number;
  averageIntensityRating: number;
  subjectBreakdown: Record<string, { minutes: number; sessions: number }>;
  moduleBreakdown: Record<string, { minutes: number; sessions: number }>;
  topSubjects: Array<{ subject: string; minutes: number }>;
}

export interface ExportFilter {
  targetSystem?: PrepOSTargetSystem;
  subjectTag?: string;
  minIntensity?: StudyIntensityRating;
  startDate?: number;
  endDate?: number;
}

export type SessionLoggedListener = (session: PrepOSSessionRecord) => void;

export class PrepOSSyncService {
  private static instance?: PrepOSSyncService;
  private sessions: PrepOSSessionRecord[] = [];
  private listeners: Set<SessionLoggedListener> = new Set();
  private bus: IntegrationEventBus;

  // UPSC Syllabus Taxonomy
  public static readonly UPSC_TAXONOMY: Record<string, SyllabusModuleDefinition> = {
    'GS1-History': {
      moduleName: 'GS1-History',
      topics: ['Ancient History', 'Medieval History', 'Modern History', 'Art & Culture', 'World History', 'Post-Independence'],
      keywords: ['history', 'ancient', 'medieval', 'modern', 'culture', 'art', 'freedom', 'spectrum'],
    },
    'GS1-Geography': {
      moduleName: 'GS1-Geography',
      topics: ['Physical Geography', 'Indian Geography', 'Climatology', 'Geomorphology', 'Oceanography', 'Human Geography'],
      keywords: ['geography', 'geo', 'maps', 'monsoon', 'climate', 'rivers', 'soils'],
    },
    'GS2-Polity': {
      moduleName: 'GS2-Polity',
      topics: ['Constitution', 'Parliament', 'Federalism', 'Judiciary', 'Elections', 'Fundamental Rights'],
      keywords: ['polity', 'constitution', 'laxmikanth', 'parliament', 'judiciary', 'rights', 'amendment'],
    },
    'GS2-Governance': {
      moduleName: 'GS2-Governance',
      topics: ['Governance', 'e-Governance', 'Citizen Charter', 'NGOs', 'Public Policy', 'Civil Services'],
      keywords: ['governance', 'policy', 'charter', 'schemes', 'welfare'],
    },
    'GS2-IR': {
      moduleName: 'GS2-IR',
      topics: ['International Relations', 'Bilateral Relations', 'Multilateral Organizations', 'India & Neighborhood'],
      keywords: ['ir', 'international', 'diplomacy', 'un', 'bilateral', 'geopolitics', 'summit'],
    },
    'GS3-Economy': {
      moduleName: 'GS3-Economy',
      topics: ['Indian Economy', 'Agriculture', 'Infrastructure', 'Budgeting & Fiscal Policy', 'Inflation', 'Investment Models'],
      keywords: ['economy', 'economics', 'agriculture', 'budget', 'gdp', 'inflation', 'banking', 'mrunal'],
    },
    'GS3-SciTech': {
      moduleName: 'GS3-SciTech',
      topics: ['Science & Tech', 'Space Technology', 'Biotechnology', 'IT & AI', 'Defense Technology'],
      keywords: ['science', 'tech', 'space', 'isro', 'biotech', 'cyber', 'quantum'],
    },
    'GS3-Environment': {
      moduleName: 'GS3-Environment',
      topics: ['Ecology', 'Biodiversity', 'Climate Change', 'Environmental Conventions', 'Renewable Energy'],
      keywords: ['environment', 'ecology', 'biodiversity', 'pollution', 'shankar', 'cop', 'climate'],
    },
    'GS3-Security': {
      moduleName: 'GS3-Security',
      topics: ['Internal Security', 'Border Management', 'Cyber Security', 'Terrorism & Extremism'],
      keywords: ['security', 'internal', 'border', 'cyber', 'insurgency', 'police'],
    },
    'GS4-Ethics': {
      moduleName: 'GS4-Ethics',
      topics: ['Ethics & Human Interface', 'Attitude & Aptitude', 'Emotional Intelligence', 'Philosophers', 'Probity', 'Case Studies'],
      keywords: ['ethics', 'moral', 'integrity', 'aptitude', 'philosophy', 'case study', 'lexicon'],
    },
    'CSAT': {
      moduleName: 'CSAT',
      topics: ['Reading Comprehension', 'Logical Reasoning', 'Quantitative Aptitude', 'Data Interpretation'],
      keywords: ['csat', 'reasoning', 'aptitude', 'comprehension', 'quant'],
    },
    'Essay': {
      moduleName: 'Essay',
      topics: ['Philosophical Essay', 'Socio-Economic Essay', 'Governance & Tech Essay'],
      keywords: ['essay', 'writing', 'quotes'],
    },
  };

  // RBI Grade B Syllabus Taxonomy
  public static readonly RBI_TAXONOMY: Record<string, SyllabusModuleDefinition> = {
    'RBI-ESI': {
      moduleName: 'RBI-ESI',
      topics: ['Growth & Development', 'Monetary Policy', 'Fiscal Policy', 'Indian Economic Reforms', 'Social Structure & Demographics'],
      keywords: ['esi', 'growth', 'reforms', 'demographics', 'poverty', 'sustainable development'],
    },
    'RBI-FM': {
      moduleName: 'RBI-FM',
      topics: ['Financial System', 'Financial Markets', 'Risk Management', 'Derivatives', 'Corporate Governance', 'Management & Leadership'],
      keywords: ['fm', 'finance', 'financial', 'derivatives', 'markets', 'management', 'leadership', 'ethics in banking'],
    },
    'RBI-English': {
      moduleName: 'RBI-English',
      topics: ['Descriptive English', 'Essay Writing', 'Précis Writing', 'Business Report & Letter'],
      keywords: ['english', 'descriptive', 'precis', 'letter', 'business writing'],
    },
    'RBI-Phase1-GA': {
      moduleName: 'RBI-Phase1-GA',
      topics: ['Banking Awareness', 'Current Affairs', 'Economic Survey', 'Union Budget', 'RBI Notifications'],
      keywords: ['ga', 'general awareness', 'banking awareness', 'rbi news', 'circulars'],
    },
    'RBI-Phase1-QRE': {
      moduleName: 'RBI-Phase1-QRE',
      topics: ['Quantitative Aptitude', 'Reasoning Ability', 'English Language'],
      keywords: ['quant', 'reasoning', 'qre', 'puzzles', 'syllogism'],
    },
  };

  constructor(bus: IntegrationEventBus = integrationBus) {
    this.bus = bus;
  }

  public static getInstance(): PrepOSSyncService {
    if (!PrepOSSyncService.instance) {
      PrepOSSyncService.instance = new PrepOSSyncService();
    }
    return PrepOSSyncService.instance;
  }

  /**
   * Infers whether a subject or topic belongs to UPSC Prep OS, RBI Prep OS, or Personal Intel OS
   */
  public inferTargetSystem(subjectTag: string, topic?: string): PrepOSTargetSystem {
    const combined = `${subjectTag} ${topic || ''}`.toLowerCase();

    // RBI indicators
    const rbiKeywords = ['rbi', 'esi', 'fm', 'finance', 'financial', 'banking', 'sebi', 'nabard', 'derivatives', 'monetary'];
    for (const kw of rbiKeywords) {
      if (combined.includes(kw)) {
        return 'RBI_PREP_OS';
      }
    }

    // UPSC indicators
    const upscKeywords = ['upsc', 'gs1', 'gs2', 'gs3', 'gs4', 'csat', 'polity', 'laxmikanth', 'mrunal', 'shankar', 'geography', 'ethics', 'essay', 'prelims', 'mains'];
    for (const kw of upscKeywords) {
      if (combined.includes(kw)) {
        return 'UPSC_PREP_OS';
      }
    }

    return 'PERSONAL_INTEL_OS';
  }

  /**
   * Resolves appropriate syllabus module name from subject or topic
   */
  public resolveSyllabusModule(target: PrepOSTargetSystem, subjectTag: string, topic?: string): string {
    const combined = `${subjectTag} ${topic || ''}`.toLowerCase();
    const tokens = new Set(combined.split(/[^a-z0-9]+/));
    const subjectTokens = new Set(subjectTag.toLowerCase().split(/[^a-z0-9]+/));

    const matchesTokens = (kw: string, targetTokens: Set<string>, targetText: string): boolean => {
      const lowerKw = kw.toLowerCase();
      if (lowerKw.includes(' ') || lowerKw.includes('-')) {
        return targetText.includes(lowerKw);
      }
      return targetTokens.has(lowerKw);
    };

    if (target === 'RBI_PREP_OS') {
      // 1. Exact or partial key match in subjectTag
      for (const [key] of Object.entries(PrepOSSyncService.RBI_TAXONOMY)) {
        if (key.toLowerCase() === subjectTag.toLowerCase()) return key;
        if (subjectTag.toLowerCase().includes(key.toLowerCase())) return key;
      }
      // 2. Keyword match within subjectTag
      for (const [, def] of Object.entries(PrepOSSyncService.RBI_TAXONOMY)) {
        for (const kw of def.keywords) {
          if (matchesTokens(kw, subjectTokens, subjectTag.toLowerCase())) return def.moduleName;
        }
      }
      // 3. Keyword match in topic / combined
      for (const [, def] of Object.entries(PrepOSSyncService.RBI_TAXONOMY)) {
        for (const kw of def.keywords) {
          if (matchesTokens(kw, tokens, combined)) return def.moduleName;
        }
      }
      return 'RBI-General';
    }

    if (target === 'UPSC_PREP_OS') {
      // 1. Exact or partial key match in subjectTag
      for (const [key] of Object.entries(PrepOSSyncService.UPSC_TAXONOMY)) {
        if (key.toLowerCase() === subjectTag.toLowerCase()) return key;
        if (subjectTag.toLowerCase().includes(key.toLowerCase())) return key;
      }
      // 2. Keyword match within subjectTag
      for (const [, def] of Object.entries(PrepOSSyncService.UPSC_TAXONOMY)) {
        for (const kw of def.keywords) {
          if (matchesTokens(kw, subjectTokens, subjectTag.toLowerCase())) return def.moduleName;
        }
      }
      // 3. Keyword match in topic / combined
      for (const [, def] of Object.entries(PrepOSSyncService.UPSC_TAXONOMY)) {
        for (const kw of def.keywords) {
          if (matchesTokens(kw, tokens, combined)) return def.moduleName;
        }
      }
      return 'UPSC-General';
    }

    return subjectTag || 'General';
  }

  /**
   * Logs a focus session and dispatches it immediately to Prep OS sync bus
   */
  public logFocusSession(params: LogFocusSessionParams): PrepOSSessionRecord {
    const targetSystem = params.targetSystem || this.inferTargetSystem(params.subjectTag, params.topicTag);
    const syllabusModule = params.syllabusModule || this.resolveSyllabusModule(targetSystem, params.subjectTag, params.topicTag);
    const completedAt = params.completedAt || Date.now();
    const durationSeconds = Math.max(0, params.durationSeconds);
    const durationMinutes = Math.max(1, Math.round(durationSeconds / 60));
    const startedAt = params.startedAt || completedAt - durationSeconds * 1000;

    // Sanitize intensity rating between 1 and 5
    let intensity: StudyIntensityRating = 3;
    if (params.studyIntensityRating && params.studyIntensityRating >= 1 && params.studyIntensityRating <= 5) {
      intensity = params.studyIntensityRating;
    }

    const sessionId = params.id || `prep_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const record: PrepOSSessionRecord = {
      id: sessionId,
      targetSystem,
      subjectTag: params.subjectTag,
      syllabusModule,
      topicTag: params.topicTag || params.subjectTag,
      durationMinutes,
      durationSeconds,
      startedAt,
      completedAt,
      studyIntensityRating: intensity,
      notes: params.notes,
      taskId: params.taskId,
      taskTitle: params.taskTitle,
      synced: true,
      syncedAt: Date.now(),
    };

    // Store in internal history
    this.sessions.push(record);

    // Emit via contract event bus
    this.dispatchSyncEvent(record);

    // Notify registered listeners
    for (const listener of this.listeners) {
      try {
        listener(record);
      } catch (err) {
        console.error('Error in PrepOSSyncService session listener:', err);
      }
    }

    return record;
  }

  /**
   * Helper to log directly from a core FocusSessionLog instance
   */
  public logFromCoreSession(session: FocusSessionLog, extra?: Partial<LogFocusSessionParams>): PrepOSSessionRecord {
    return this.logFocusSession({
      id: session.id,
      subjectTag: session.subjectTag || extra?.subjectTag || 'General',
      durationSeconds: session.durationSeconds,
      startedAt: session.startedAt,
      completedAt: session.endedAt,
      taskId: session.taskId,
      taskTitle: session.taskTitle,
      ...extra,
    });
  }

  /**
   * Dispatches the event to the integration bus and DOM CustomEvent
   */
  private dispatchSyncEvent(record: PrepOSSessionRecord): void {
    // Emit over bus
    this.bus.emitPrepOSSession(
      {
        id: record.id,
        startedAt: record.startedAt,
        endedAt: record.completedAt,
        durationSeconds: record.durationSeconds,
        mode: 'pomodoro',
        subjectTag: record.subjectTag,
        completedSuccessfully: true,
      },
      record.targetSystem === 'PERSONAL_INTEL_OS' ? 'UPSC_PREP_OS' : record.targetSystem
    );

    // Also dispatch rich detail event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('flocus_prep_os_sync', { detail: record }));
      window.postMessage({ source: 'FLOCUS_PREP_OS_SYNC', payload: record }, '*');
    }
  }

  /**
   * Subscribes to newly logged session records
   */
  public onSessionLogged(listener: SessionLoggedListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Retrieves all logged session records, optionally filtered
   */
  public getSessions(filter?: ExportFilter): PrepOSSessionRecord[] {
    return this.sessions.filter((s) => {
      if (filter?.targetSystem && s.targetSystem !== filter.targetSystem) return false;
      if (filter?.subjectTag && s.subjectTag !== filter.subjectTag) return false;
      if (filter?.minIntensity && s.studyIntensityRating < filter.minIntensity) return false;
      if (filter?.startDate && s.completedAt < filter.startDate) return false;
      if (filter?.endDate && s.completedAt > filter.endDate) return false;
      return true;
    });
  }

  /**
   * Calculates comprehensive syllabus study summary and topic breakdown
   */
  public getSyllabusSummary(targetSystem?: PrepOSTargetSystem): SyllabusSummary {
    const filtered = this.getSessions(targetSystem ? { targetSystem } : undefined);

    let totalMinutes = 0;
    let totalIntensitySum = 0;
    const subjectBreakdown: Record<string, { minutes: number; sessions: number }> = {};
    const moduleBreakdown: Record<string, { minutes: number; sessions: number }> = {};

    for (const session of filtered) {
      totalMinutes += session.durationMinutes;
      totalIntensitySum += session.studyIntensityRating;

      // Subject aggregate
      if (!subjectBreakdown[session.subjectTag]) {
        subjectBreakdown[session.subjectTag] = { minutes: 0, sessions: 0 };
      }
      subjectBreakdown[session.subjectTag].minutes += session.durationMinutes;
      subjectBreakdown[session.subjectTag].sessions += 1;

      // Module aggregate
      if (!moduleBreakdown[session.syllabusModule]) {
        moduleBreakdown[session.syllabusModule] = { minutes: 0, sessions: 0 };
      }
      moduleBreakdown[session.syllabusModule].minutes += session.durationMinutes;
      moduleBreakdown[session.syllabusModule].sessions += 1;
    }

    const topSubjects = Object.entries(subjectBreakdown)
      .map(([subject, data]) => ({ subject, minutes: data.minutes }))
      .sort((a, b) => b.minutes - a.minutes);

    return {
      targetSystem,
      totalSessions: filtered.length,
      totalDurationMinutes: totalMinutes,
      totalDurationHours: Math.round((totalMinutes / 60) * 10) / 10,
      averageIntensityRating: filtered.length > 0 ? Math.round((totalIntensitySum / filtered.length) * 10) / 10 : 0,
      subjectBreakdown,
      moduleBreakdown,
      topSubjects,
    };
  }

  /**
   * Exports session logs as a formatted JSON document with metadata
   */
  public exportToJSON(filter?: ExportFilter): string {
    const records = this.getSessions(filter);
    const summary = this.getSyllabusSummary(filter?.targetSystem);

    const exportData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      generator: 'Focus & Ambient Engine - PrepOSSyncService',
      filter: filter || null,
      summary,
      sessions: records,
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Exports session logs as an RFC 4180 compliant CSV string
   */
  public exportToCSV(filter?: ExportFilter): string {
    const records = this.getSessions(filter);
    const headers = [
      'sessionId',
      'targetSystem',
      'subjectTag',
      'syllabusModule',
      'topicTag',
      'durationMinutes',
      'durationSeconds',
      'studyIntensityRating',
      'startedAt',
      'completedAt',
      'isoDate',
      'taskId',
      'taskTitle',
      'notes',
    ];

    const escapeCsv = (val: any): string => {
      if (val === undefined || val === null) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = records.map((r) => [
      escapeCsv(r.id),
      escapeCsv(r.targetSystem),
      escapeCsv(r.subjectTag),
      escapeCsv(r.syllabusModule),
      escapeCsv(r.topicTag),
      escapeCsv(r.durationMinutes),
      escapeCsv(r.durationSeconds),
      escapeCsv(r.studyIntensityRating),
      escapeCsv(r.startedAt),
      escapeCsv(r.completedAt),
      escapeCsv(new Date(r.completedAt).toISOString()),
      escapeCsv(r.taskId || ''),
      escapeCsv(r.taskTitle || ''),
      escapeCsv(r.notes || ''),
    ]);

    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
  }

  /**
   * Imports session records from an exported JSON string
   */
  public importFromJSON(jsonString: string): { imported: number; errors: string[] } {
    const errors: string[] = [];
    let count = 0;

    try {
      const data = JSON.parse(jsonString);
      const items = Array.isArray(data) ? data : data.sessions;

      if (!Array.isArray(items)) {
        errors.push('Invalid JSON payload: missing sessions array');
        return { imported: 0, errors };
      }

      for (const item of items) {
        if (!item.subjectTag || typeof item.durationSeconds !== 'number') {
          errors.push(`Skipped invalid session record: id=${item.id}`);
          continue;
        }

        const record = this.logFocusSession({
          id: item.id,
          targetSystem: item.targetSystem,
          subjectTag: item.subjectTag,
          syllabusModule: item.syllabusModule,
          topicTag: item.topicTag,
          durationSeconds: item.durationSeconds,
          startedAt: item.startedAt,
          completedAt: item.completedAt,
          studyIntensityRating: item.studyIntensityRating,
          notes: item.notes,
          taskId: item.taskId,
          taskTitle: item.taskTitle,
        });

        if (record) count++;
      }
    } catch (err: any) {
      errors.push(`JSON parse failure: ${err?.message || err}`);
    }

    return { imported: count, errors };
  }

  /**
   * Clears in-memory session records
   */
  public clearHistory(): void {
    this.sessions = [];
  }
}

export const prepOSSync = PrepOSSyncService.getInstance();
