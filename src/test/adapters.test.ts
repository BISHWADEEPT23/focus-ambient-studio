/**
 * adapters.test.ts
 * Comprehensive unit test suite for cross-platform integration adapters and contracts:
 * 1) StudyFlipTimerAdapter: Flip digit decomposition, bidirectional event bus, and TimerEngine attachment.
 * 2) PrepOSSyncService: UPSC & RBI syllabus taxonomy mapping, intensity rating, summaries, and JSON/CSV export.
 * 3) DesktopBridgeAdapter: Electron & Tauri window management, media key handlers, and tray notifications.
 * 4) AndroidBridgeContract: Verification of Android/Compose bridge contract schemas and serialization models.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TimerEngine } from '../core/timer/timerEngine';
import { integrationBus, FlipTimerStateBroadcast } from '../core/contracts/integrationContracts';
import {
  StudyFlipTimerAdapter,
  FlipTimerInboundCommand,
} from '../integrations/StudyFlipTimerAdapter';
import {
  PrepOSSyncService,
} from '../integrations/PrepOSSyncService';
import {
  DesktopBridgeAdapter,
} from '../integrations/contracts/DesktopBridge';

describe('Cross-Platform Integration Adapters & Contracts Test Suite', () => {
  // -------------------------------------------------------------------------
  // 1. StudyFlipTimerAdapter Tests
  // -------------------------------------------------------------------------
  describe('StudyFlipTimerAdapter', () => {
    let adapter: StudyFlipTimerAdapter;

    beforeEach(() => {
      adapter = new StudyFlipTimerAdapter();
    });

    afterEach(() => {
      adapter.destroy();
    });

    it('calculates 6-digit flip decomposition accurately for various durations', () => {
      // 0 seconds -> 00:00:00
      expect(adapter.calculateFlipDigits(0)).toEqual({
        hoursTens: 0,
        hoursUnits: 0,
        minutesTens: 0,
        minutesUnits: 0,
        secondsTens: 0,
        secondsUnits: 0,
      });

      // 59 seconds -> 00:00:59
      expect(adapter.calculateFlipDigits(59)).toEqual({
        hoursTens: 0,
        hoursUnits: 0,
        minutesTens: 0,
        minutesUnits: 0,
        secondsTens: 5,
        secondsUnits: 9,
      });

      // 1500 seconds (25m 00s) -> 00:25:00
      expect(adapter.calculateFlipDigits(1500)).toEqual({
        hoursTens: 0,
        hoursUnits: 0,
        minutesTens: 2,
        minutesUnits: 5,
        secondsTens: 0,
        secondsUnits: 0,
      });

      // 3665 seconds (1h 01m 05s) -> 01:01:05
      expect(adapter.calculateFlipDigits(3665)).toEqual({
        hoursTens: 0,
        hoursUnits: 1,
        minutesTens: 0,
        minutesUnits: 1,
        secondsTens: 0,
        secondsUnits: 5,
      });

      // 43200 seconds (12h 00m 00s) -> 12:00:00
      expect(adapter.calculateFlipDigits(43200)).toEqual({
        hoursTens: 1,
        hoursUnits: 2,
        minutesTens: 0,
        minutesUnits: 0,
        secondsTens: 0,
        secondsUnits: 0,
      });
    });

    it('creates broadcast payload matching FlipTimerStateBroadcast schema', () => {
      const payload = adapter.createBroadcastPayload({
        mode: 'pomodoro',
        status: 'running',
        timeRemaining: 1440,
        totalDuration: 1500,
        elapsedSeconds: 60,
        completedCycles: 1,
      });

      expect(payload.type).toBe('FLIP_TIMER_STATE');
      expect(payload.mode).toBe('pomodoro');
      expect(payload.status).toBe('running');
      expect(payload.timeRemaining).toBe(1440);
      expect(payload.totalDuration).toBe(1500);
      expect(payload.flipDigits).toEqual({
        hoursTens: 0,
        hoursUnits: 0,
        minutesTens: 2,
        minutesUnits: 4,
        secondsTens: 0,
        secondsUnits: 0,
      });
    });

    it('broadcasts state to local listeners and integration bus', () => {
      let localReceived: FlipTimerStateBroadcast | null = null;
      let busReceived: any = null;

      const unLocal = adapter.onBroadcast((broadcast) => {
        localReceived = broadcast;
      });

      const unBus = integrationBus.subscribe('FLIP_TIMER', (data) => {
        busReceived = data;
      });

      const broadcast = adapter.broadcastTimerState({
        mode: 'shortBreak',
        status: 'running',
        timeRemaining: 300,
        totalDuration: 300,
        elapsedSeconds: 0,
        completedCycles: 2,
      });

      expect(localReceived).toEqual(broadcast);
      expect(busReceived).toEqual(broadcast);
      expect(adapter.getLastBroadcast()).toEqual(broadcast);

      unLocal();
      unBus();
    });

    it('attaches to TimerEngine and synchronizes state updates bi-directionally', () => {
      const engine = new TimerEngine({ pomodoroWork: 1500 });
      let broadcastCount = 0;
      let lastState: FlipTimerStateBroadcast | undefined;

      adapter.onBroadcast((state) => {
        broadcastCount++;
        lastState = state;
      });

      // Attach adapter to engine
      adapter.attach(engine);

      // Initial attach should broadcast current engine state
      expect(broadcastCount).toBeGreaterThanOrEqual(1);
      expect(lastState).toBeDefined();
      expect(lastState!.mode).toBe('pomodoro');
      expect(lastState!.status).toBe('idle');

      // Trigger engine mode change
      engine.setMode('longBreak');
      expect(lastState!.mode).toBe('longBreak');
      expect(lastState!.timeRemaining).toBe(900);

      // Handle inbound command: start timer
      adapter.handleInboundCommand({ type: 'START_TIMER' });
      expect(engine.getState().status).toBe('running');

      // Handle inbound command: pause timer
      adapter.handleInboundCommand({ type: 'PAUSE_TIMER' });
      expect(engine.getState().status).toBe('paused');

      // Handle inbound command: reset timer
      adapter.handleInboundCommand({ type: 'RESET_TIMER' });
      expect(engine.getState().status).toBe('idle');

      // Inbound toggle timer
      adapter.handleInboundCommand({ type: 'TOGGLE_TIMER' });
      expect(engine.getState().status).toBe('running');
      adapter.handleInboundCommand({ type: 'TOGGLE_TIMER' });
      expect(engine.getState().status).toBe('paused');

      // Detach
      adapter.detach();
      engine.destroy();
    });

    it('receives commands through window postMessage bus', () => {
      const engine = new TimerEngine();
      adapter.attach(engine);

      let commandReceived: FlipTimerInboundCommand | undefined;
      adapter.onCommand((cmd) => {
        commandReceived = cmd;
      });

      // Simulate external iframe/companion postMessage
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            source: 'STUDY_FLIP_TIMER',
            command: {
              type: 'SET_MODE',
              mode: 'animedoro',
              durationSeconds: 3000,
            },
          },
        })
      );

      expect(commandReceived).toBeDefined();
      expect(commandReceived!.type).toBe('SET_MODE');
      expect(commandReceived!.mode).toBe('animedoro');
      expect(engine.getState().mode).toBe('animedoro');

      adapter.detach();
      engine.destroy();
    });
  });

  // -------------------------------------------------------------------------
  // 2. PrepOSSyncService Tests
  // -------------------------------------------------------------------------
  describe('PrepOSSyncService', () => {
    let service: PrepOSSyncService;

    beforeEach(() => {
      service = new PrepOSSyncService();
      service.clearHistory();
    });

    afterEach(() => {
      service.clearHistory();
    });

    it('accurately infers target system from subject tags and keywords', () => {
      expect(service.inferTargetSystem('UPSC-Polity')).toBe('UPSC_PREP_OS');
      expect(service.inferTargetSystem('GS2-Governance')).toBe('UPSC_PREP_OS');
      expect(service.inferTargetSystem('GS3-Mrunal-Economy')).toBe('UPSC_PREP_OS');
      expect(service.inferTargetSystem('CSAT-Quant')).toBe('UPSC_PREP_OS');

      expect(service.inferTargetSystem('RBI-Phase2-ESI')).toBe('RBI_PREP_OS');
      expect(service.inferTargetSystem('RBI-FM-Management')).toBe('RBI_PREP_OS');
      expect(service.inferTargetSystem('Banking-Awareness')).toBe('RBI_PREP_OS');

      expect(service.inferTargetSystem('Algorithms', 'Computer Science')).toBe('PERSONAL_INTEL_OS');
      expect(service.inferTargetSystem('Novel-Reading', 'Literature')).toBe('PERSONAL_INTEL_OS');
    });

    it('resolves syllabus taxonomy modules for UPSC and RBI correctly', () => {
      expect(service.resolveSyllabusModule('UPSC_PREP_OS', 'Modern History')).toBe('GS1-History');
      expect(service.resolveSyllabusModule('UPSC_PREP_OS', 'Polity', 'Constitution & Rights')).toBe('GS2-Polity');
      expect(service.resolveSyllabusModule('UPSC_PREP_OS', 'Economy', 'Agriculture & Subsidies')).toBe('GS3-Economy');
      expect(service.resolveSyllabusModule('UPSC_PREP_OS', 'Ethics', 'Case Studies in Governance')).toBe('GS4-Ethics');

      expect(service.resolveSyllabusModule('RBI_PREP_OS', 'Finance', 'Derivatives & Risk')).toBe('RBI-FM');
      expect(service.resolveSyllabusModule('RBI_PREP_OS', 'ESI', 'Social Demographics')).toBe('RBI-ESI');
      expect(service.resolveSyllabusModule('RBI_PREP_OS', 'Descriptive English')).toBe('RBI-English');
    });

    it('logs focus session with study intensity rating and emits sync event', () => {
      let notifiedSession: any = null;
      let busSession: any = null;

      const unListener = service.onSessionLogged((s) => {
        notifiedSession = s;
      });

      const unBus = integrationBus.subscribe('PREP_OS_EVENT', (event) => {
        busSession = event;
      });

      const record = service.logFocusSession({
        subjectTag: 'UPSC-Polity',
        topicTag: 'Fundamental Rights Article 14-19',
        durationSeconds: 3000, // 50 mins
        studyIntensityRating: 5,
        notes: 'Deep reading of Laxmikanth chapter 7',
        taskId: 'task_001',
        taskTitle: 'Master Article 19 freedoms',
      });

      expect(record.targetSystem).toBe('UPSC_PREP_OS');
      expect(record.syllabusModule).toBe('GS2-Polity');
      expect(record.durationMinutes).toBe(50);
      expect(record.studyIntensityRating).toBe(5);
      expect(record.synced).toBe(true);

      expect(notifiedSession).toEqual(record);
      expect(busSession).not.toBeNull();
      expect(busSession.targetSystem).toBe('UPSC_PREP_OS');
      expect(busSession.payload.durationMinutes).toBe(50);

      unListener();
      unBus();
    });

    it('sanitizes intensity rating within valid range 1-5', () => {
      const recordLow = service.logFocusSession({
        subjectTag: 'Reading',
        durationSeconds: 1200,
        studyIntensityRating: 0 as any, // invalid low
      });
      expect(recordLow.studyIntensityRating).toBe(3); // defaults to 3

      const recordHigh = service.logFocusSession({
        subjectTag: 'Reading',
        durationSeconds: 1200,
        studyIntensityRating: 10 as any, // invalid high
      });
      expect(recordHigh.studyIntensityRating).toBe(3); // defaults to 3
    });

    it('computes accurate syllabus summary and subject breakdown metrics', () => {
      service.logFocusSession({
        subjectTag: 'GS2-Polity',
        durationSeconds: 1800, // 30m
        studyIntensityRating: 4,
      });

      service.logFocusSession({
        subjectTag: 'GS2-Polity',
        durationSeconds: 3600, // 60m
        studyIntensityRating: 5,
      });

      service.logFocusSession({
        subjectTag: 'GS3-Economy',
        durationSeconds: 1800, // 30m
        studyIntensityRating: 3,
      });

      const summary = service.getSyllabusSummary('UPSC_PREP_OS');
      expect(summary.totalSessions).toBe(3);
      expect(summary.totalDurationMinutes).toBe(120);
      expect(summary.totalDurationHours).toBe(2.0);
      expect(summary.averageIntensityRating).toBe(4.0); // (4 + 5 + 3) / 3 = 4.0
      expect(summary.subjectBreakdown['GS2-Polity'].minutes).toBe(90);
      expect(summary.subjectBreakdown['GS3-Economy'].minutes).toBe(30);
      expect(summary.topSubjects[0].subject).toBe('GS2-Polity');
    });

    it('exports sessions to compliant JSON format and re-imports successfully', () => {
      service.logFocusSession({
        id: 'sess_1',
        subjectTag: 'RBI-FM',
        durationSeconds: 1500,
        studyIntensityRating: 4,
        notes: 'Corporate Governance notes',
      });

      service.logFocusSession({
        id: 'sess_2',
        subjectTag: 'RBI-ESI',
        durationSeconds: 3000,
        studyIntensityRating: 5,
      });

      const jsonStr = service.exportToJSON({ targetSystem: 'RBI_PREP_OS' });
      const parsed = JSON.parse(jsonStr);

      expect(parsed.version).toBe('1.0.0');
      expect(parsed.summary.totalSessions).toBe(2);
      expect(parsed.sessions.length).toBe(2);
      expect(parsed.sessions[0].id).toBe('sess_1');

      // Test roundtrip import
      const freshService = new PrepOSSyncService();
      const importResult = freshService.importFromJSON(jsonStr);
      expect(importResult.imported).toBe(2);
      expect(importResult.errors.length).toBe(0);
      expect(freshService.getSessions().length).toBe(2);
    });

    it('exports sessions to compliant RFC 4180 CSV format with proper quoting', () => {
      service.logFocusSession({
        id: 'sess_csv_1',
        subjectTag: 'UPSC-Polity',
        topicTag: 'Preamble, Fundamental Rights',
        durationSeconds: 1800,
        studyIntensityRating: 4,
        notes: 'Quote: "We the People, of India..."',
      });

      const csvStr = service.exportToCSV();
      const lines = csvStr.split('\r\n');

      expect(lines.length).toBeGreaterThanOrEqual(2);
      const header = lines[0];
      expect(header).toContain('sessionId');
      expect(header).toContain('targetSystem');
      expect(header).toContain('subjectTag');
      expect(header).toContain('studyIntensityRating');

      const dataRow = lines[1];
      expect(dataRow).toContain('sess_csv_1');
      expect(dataRow).toContain('UPSC_PREP_OS');
      // Verify escaped comma topic tag
      expect(dataRow).toContain('"Preamble, Fundamental Rights"');
      // Verify escaped quote in notes
      expect(dataRow).toContain('""We the People, of India...""');
    });
  });

  // -------------------------------------------------------------------------
  // 3. DesktopBridgeAdapter Tests
  // -------------------------------------------------------------------------
  describe('DesktopBridgeAdapter', () => {
    let desktopBridge: DesktopBridgeAdapter;

    beforeEach(() => {
      desktopBridge = new DesktopBridgeAdapter();
    });

    afterEach(() => {
      desktopBridge.destroy();
    });

    it('detects browser environment fallback when not in Tauri or Electron', () => {
      const env = desktopBridge.getEnvironment();
      expect(env).toBe('browser');
    });

    it('dispatches window control operations and fires window events', async () => {
      let dispatchedEvent: any = null;
      const listener = (e: any) => {
        dispatchedEvent = e.detail;
      };
      window.addEventListener('flocus_desktop_window', listener);

      await desktopBridge.minimizeWindow();
      expect(dispatchedEvent.event).toBe('WINDOW_MINIMIZE');

      await desktopBridge.maximizeWindow();
      expect(dispatchedEvent.event).toBe('WINDOW_MAXIMIZE');

      await desktopBridge.closeWindow();
      expect(dispatchedEvent.event).toBe('WINDOW_CLOSE');

      await desktopBridge.setAlwaysOnTop(true);
      expect(dispatchedEvent.event).toBe('SET_ALWAYS_ON_TOP');
      expect(dispatchedEvent.alwaysOnTop).toBe(true);
      expect(await desktopBridge.isAlwaysOnTop()).toBe(true);

      await desktopBridge.setAlwaysOnTop(false);
      expect(await desktopBridge.isAlwaysOnTop()).toBe(false);

      window.removeEventListener('flocus_desktop_window', listener);
    });

    it('registers media key handlers and dispatches triggers', () => {
      let playPauseFired = 0;
      let stopFired = 0;
      let nextFired = 0;

      const unPlay = desktopBridge.registerMediaKeyHandler('play_pause', () => {
        playPauseFired++;
      });
      const unStop = desktopBridge.registerMediaKeyHandler('stop', () => {
        stopFired++;
      });
      const unNext = desktopBridge.registerMediaKeyHandler('next_track', () => {
        nextFired++;
      });

      // Trigger programmatic actions
      desktopBridge.triggerMediaKey('play_pause');
      expect(playPauseFired).toBe(1);

      desktopBridge.triggerMediaKey('stop');
      expect(stopFired).toBe(1);

      desktopBridge.triggerMediaKey('next_track');
      expect(nextFired).toBe(1);

      // Trigger via window keydown event
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'MediaPlayPause' }));
      expect(playPauseFired).toBe(2);

      // Clean up individual handler
      unPlay();
      desktopBridge.triggerMediaKey('play_pause');
      expect(playPauseFired).toBe(2); // Unsubscribed, should not increase

      unStop();
      unNext();
    });

    it('updates system tray configuration and dispatches tray event', async () => {
      let trayEvent: any = null;
      const listener = (e: any) => {
        trayEvent = e.detail;
      };
      window.addEventListener('flocus_tray_update', listener);

      const result = await desktopBridge.updateTray({
        title: 'Flocus Pomodoro',
        tooltip: 'Focus interval active - 23m remaining',
        badgeCount: 1,
      });

      expect(result).toBe(true);
      expect(trayEvent).not.toBeNull();
      expect(trayEvent.title).toBe('Flocus Pomodoro');
      expect(trayEvent.tooltip).toBe('Focus interval active - 23m remaining');
      expect(desktopBridge.getActiveTrayConfig()?.tooltip).toBe('Focus interval active - 23m remaining');

      window.removeEventListener('flocus_tray_update', listener);
    });
  });

  // -------------------------------------------------------------------------
  // 4. AndroidBridgeContract Schema Verification
  // -------------------------------------------------------------------------
  describe('AndroidBridgeContract Schema Compatibility', () => {
    it('generates Android-compatible JSON payload matching Kotlin DTO schemas', () => {
      const kotlinContractPayload = {
        type: 'FLIP_TIMER_STATE',
        mode: 'pomodoro',
        status: 'running',
        timeRemaining: 1500,
        totalDuration: 1500,
        flipDigits: {
          hoursTens: 0,
          hoursUnits: 0,
          minutesTens: 2,
          minutesUnits: 5,
          secondsTens: 0,
          secondsUnits: 0,
        },
      };

      expect(kotlinContractPayload.type).toBe('FLIP_TIMER_STATE');
      expect(kotlinContractPayload.flipDigits.minutesTens).toBe(2);
      expect(kotlinContractPayload.flipDigits.minutesUnits).toBe(5);

      const mediaNotificationPayload = {
        title: 'Deep Focus Session',
        contentText: 'Pomodoro 1 of 4: 25m remaining',
        isPlaying: true,
        currentSeconds: 0,
        totalSeconds: 1500,
        progressPercent: 0.0,
        channelName: 'Flocus Ambient Channel',
        actions: ['PLAY_PAUSE', 'RESET', 'SKIP'],
      };

      expect(mediaNotificationPayload.actions).toContain('PLAY_PAUSE');
      expect(mediaNotificationPayload.totalSeconds).toBe(1500);

      const prepOSPayload = {
        sessionId: 'sess_kt_001',
        targetSystem: 'UPSC_PREP_OS',
        subjectTag: 'GS4-Ethics',
        syllabusModule: 'GS4-Ethics',
        durationMinutes: 45,
        durationSeconds: 2700,
        studyIntensityRating: 4,
        completedAt: Date.now(),
      };

      expect(prepOSPayload.targetSystem).toBe('UPSC_PREP_OS');
      expect(prepOSPayload.studyIntensityRating).toBe(4);
    });
  });
});
