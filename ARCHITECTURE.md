# System Architecture Specification: Focus & Ambient Engine

## 1. System Overview
The Focus & Ambient Engine is an original, modular, offline-first client architecture engineered for high-performance productivity, visual calm, and immersive procedural audio environments. It is completely clean-room engineered without proprietary assets or closed cloud dependencies.

```
+----------------------------------------------------------------------------------+
|                            USER INTERFACE LAYER                                  |
|  +--------------------+  +--------------------+  +----------------------------+  |
|  |  Ambient Mode View |  |  Focus Mode View   |  |  Retro Flip Clock View     |  |
|  +--------------------+  +--------------------+  +----------------------------+  |
|  +--------------------+  +--------------------+  +----------------------------+  |
|  | Soundscape Mixer   |  | Task Manager Panel |  | Analytics & Streak Modal   |  |
|  +--------------------+  +--------------------+  +----------------------------+  |
+----------------------------------------------------------------------------------+
                                        |
+----------------------------------------------------------------------------------+
|                             CORE ENGINE LAYER                                    |
|                                                                                  |
|  +----------------------------------------------------------------------------+  |
|  | 1. TIMER ENGINE                                                            |  |
|  |    Modes: Pomodoro | Countdown | Stopwatch | Animedoro | Custom Interval   |  |
|  |    Tick Provider: Dedicated Web Worker + Wall-Clock Delta Reconciler       |  |
|  |    State Machine: Idle -> Running <-> Paused -> Completed                  |  |
|  +----------------------------------------------------------------------------+  |
|                                                                                  |
|  +----------------------------------------------------------------------------+  |
|  | 2. PROCEDURAL AMBIENT AUDIO ENGINE                                         |  |
|  |    AudioContext -> Master Gain Node -> Per-Channel Gain Nodes               |  |
|  |    Generators: Pink/White Noise Filter (Rain), Resonant Oscillator (Wind), |  |
|  |                Bandpass Modulator (Waves), Crackle Synthesis (Campfire),   |  |
|  |                Biquad Filtered Low-Pass (Brown Noise), Chime Synthesizer   |  |
|  +----------------------------------------------------------------------------+  |
|                                                                                  |
|  +----------------------------------------------------------------------------+  |
|  | 3. BACKGROUND & THEME ENGINE                                               |  |
|  |    Scenes: Dynamic Canvas Particle Shaders, Atmospheric Gradients, Overlays|  |
|  |    Controls: Opacity Dimmer, Blur Filter, Prefers-Reduced-Motion Fallbacks |  |
|  +----------------------------------------------------------------------------+  |
|                                                                                  |
|  +----------------------------------------------------------------------------+  |
|  | 4. TASK MANAGEMENT ENGINE                                                  |  |
|  |    Data Model: Hierarchical Tasks, Subtasks, Priority Tags, Subject Labels |  |
|  |    Focus Priority Linker: Binds active task to ongoing focus intervals     |  |
|  +----------------------------------------------------------------------------+  |
|                                                                                  |
|  +----------------------------------------------------------------------------+  |
|  | 5. FOCUS ANALYTICS & STREAKS ENGINE                                        |  |
|  |    Aggregators: Daily minutes, Weekly intervals, Subject distributions     |  |
|  |    Streak Calculator: Midnight rollover, 24h grace, Weekend preservation   |  |
|  +----------------------------------------------------------------------------+  |
|                                                                                  |
|  +----------------------------------------------------------------------------+  |
|  | 6. SESSION PERSISTENCE & STORAGE ENGINE                                    |  |
|  |    Primary: IndexedDB (idb keyval/object store) for logs & long-term state |  |
|  |    Cache: LocalStorage synchronous cache for instant layout hydration      |  |
|  |    Debounced Auto-Save: 400ms bounded write queue prevents UI jank         |  |
|  +----------------------------------------------------------------------------+  |
|                                                                                  |
|  +----------------------------------------------------------------------------+  |
|  | 7. SETTINGS & PREFERENCES ENGINE                                           |  |
|  |    Centralized reactive config store, deep merged schema with validation   |  |
|  +----------------------------------------------------------------------------+  |
+----------------------------------------------------------------------------------+
                                        |
+----------------------------------------------------------------------------------+
|                    CROSS-PLATFORM INTEGRATION & CONTRACTS                        |
|  +------------------------+  +------------------------+  +--------------------+  |
|  | Study Flip Timer Bus   |  | UPSC / RBI Prep OS Bus |  | Android & Desktop  |  |
|  | Event & State Broadcast|  | Subject Tag & Deep Sync|  | Compose/Tauri Spec |  |
|  +------------------------+  +------------------------+  +--------------------+  |
+----------------------------------------------------------------------------------+
```

---

## 2. Engine Specifications

### 2.1 Timer Engine
- **Supported Modes:**
  - `pomodoro`: Work interval (25m default) $\to$ Short break (5m default) $\to$ Long break (15m default after 4 cycles).
  - `countdown`: Target duration countdown from specified seconds.
  - `stopwatch`: Continuous count-up tracking elapsed active seconds.
  - `animedoro`: 40-50m focus followed by 20m break block.
  - `custom`: Arbitrary user-defined intervals.
- **Drift Mitigation Architecture:**
  - Browsers throttle background tabs to $\le 1$ Hz. To prevent drift:
    1. A dedicated inline Web Worker (`Blob` URL worker) emits heartbeats at 100ms intervals.
    2. The core tick reconciler calculates elapsed time using monotonic wall-clock delta:
       $$\Delta t = \text{Date.now()} - \text{session.lastTimestamp}$$
    3. Tab visibility changes (`document.visibilitychange`) immediately trigger an instantaneous wall-clock sync.
    4. Crash recovery: If the browser is refreshed or closed during an active session, the state rehydrates from the stored `startedAt` and `targetEndTime`. If expired while closed, it triggers a `SESSION_COMPLETED_OFFLINE` transition.

### 2.2 Ambient Audio Engine (Zero-Asset Procedural Web Audio)
- **Design:** Instead of relying on copyrighted sound assets or heavy remote MP3s, this engine utilizes native Web Audio API graph synthesis.
- **Node Graph Topology:**
  ```
  [Procedural Generator (Rain/Waves/Wind/Noise/Campfire)] 
     --> [Channel BiquadFilterNode]
     --> [Channel GainNode (0.0 - 1.0)]
     --> [Master StereoPannerNode]
     --> [Master GainNode (0.0 - 1.0 + Mute)]
     --> [AudioContext.destination]
  ```
- **Procedural Synthesizers:**
  - **Rain:** White noise filtered through dual bandpass filters with randomized gain modulation simulating droplet density.
  - **Ocean Waves:** Pink noise fed through a slow LFO (Low-Frequency Oscillator, $\sim 0.08$ Hz) modulating a low-pass filter cutoff ($200\text{Hz} - 800\text{Hz}$) to mimic rising and receding tide surf.
  - **Campfire:** Brownian noise base combined with Poisson-distributed random crackle impulse bursts.
  - **Wind:** Bandpass-filtered white noise with wandering center frequency ($300\text{Hz} - 700\text{Hz}$).
  - **Deep Brown Noise:** $1/f^2$ spectral density roll-off via cascaded low-pass filters for deep cognitive focus and masking.
  - **Completion Chime:** Polyphonic sine/triangle wave synthesizer generating harmonic major-triad chime sequence ($C_5 - E_5 - G_5$) with exponential envelope decay.

### 2.3 Background & Theme Engine
- **Visual Themes:**
  1. `twilight-glow`: Warm dusky gradient with subtle ambient aura pulse.
  2. `deep-forest`: Muted organic emerald tones with floating particle dust.
  3. `rainy-window`: Cool slate ambiance with simulated droplet refraction.
  4. `starry-cosmos`: Deep space midnight navy with gently twinkling stars.
  5. `minimal-warmth`: Distraction-free clean warm parchment aesthetic.
  6. `cyber-focus`: Deep obsidian with soft violet accents.
- **Dynamic Controls:**
  - Background overlay dimming slider ($0\% - 90\%$ darkness opacity).
  - Background blur slider ($0\text{px} - 20\text{px}$).
  - Full adherence to `prefers-reduced-motion` media query, disabling active particle loops and animations when active.

### 2.4 Task Management Engine
- **Data Model:**
  ```typescript
  interface TaskItem {
    id: string; // ULID format
    title: string;
    completed: boolean;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    subjectTag?: string; // e.g. "UPSC-Polity", "RBI-Finance", "General"
    estimatedPomodoros: number;
    completedPomodoros: number;
    subtasks: Array<{ id: string; title: string; completed: boolean }>;
    createdAt: number;
    completedAt?: number;
  }
  ```
- **Focus Priority Binding:**
  - One task can be marked as `isCurrentFocus: true`.
  - Its title and progress bar automatically dock beneath the active timer in both Focus and Ambient modes.

### 2.5 Focus Analytics & Streaks Engine
- **Streak Calculation Algorithm:**
  - Persisted state: `{ currentStreak: number, longestStreak: number, lastActiveDay: string, nextCheckTimestamp: number }`.
  - When a focus session finishes:
    - Compute local day string `YYYY-MM-DD`.
    - If `lastActiveDay == today`, keep current streak.
    - If `lastActiveDay == yesterday`, increment streak.
    - If gap $> 1$ day: check if the intervening days are Saturday and Sunday. If so, weekend grace applies, streak is preserved. Otherwise, reset to 1.
- **Analytics Aggregations:**
  - Daily focused minutes over 7-day rolling window.
  - Time breakdown by Subject Tag (UPSC, RBI, Tech, Reading).
  - Clean exportable and importable JSON format (`focus-engine-backup-YYYY-MM-DD.json`).

### 2.6 Session Persistence & Storage Engine
- **Two-Tier Storage:**
  - `LocalStorage`: Holds lightweight critical state (`activeTheme`, `currentMode`, `masterVolume`, `muted`) for zero-FOUC (Flash of Unstyled Content) initial render.
  - `IndexedDB`: Handles durable storage for session log entries, completed tasks, and analytics history.
- **Debounced Commit:** Writes are debounced at 400ms to avoid UI stutter during audio slider movements or rapid task edits.

### 2.7 Accessibility and Keyboard Controls
- **WCAG 2.1 AA Compliance:** Minimum 4.5:1 contrast ratio maintained across all background opacity levels via dark backdrop scrim.
- **Shortcuts:**
  - `Space`: Toggle Start/Pause Timer.
  - `r` / `R`: Reset current interval.
  - `m` / `M`: Master Audio Mute toggle.
  - `a` / `A`: Switch to Ambient Mode.
  - `f` / `F`: Switch to Focus Mode.
  - `t` / `T`: Open / Close Task Manager.
  - `s` / `S`: Open / Close Soundscape Mixer.
  - `Escape`: Close any open modal or drawer.
- **ARIA:** `aria-live="polite"` timer announcements and labeled form controls.

### 2.8 Cross-Platform Integration Contracts
- **Contract Schema:** Standardized JSON event bus contracts allowing seamless embedding into:
  - **Study Flip Timer:** Bidirectional message bus (`START_TIMER`, `PAUSE_TIMER`, `SYNC_STATE`, `ON_INTERVAL_END`).
  - **UPSC Prep OS & RBI Prep OS:** Provides `onFocusSessionLogged(session: { subject, durationSeconds, taskId, timestamp })` dispatchers to record study hours straight into syllabus tracking models.
  - **Android Jetpack Compose & Desktop (Tauri/Electron):** Window frame messaging contracts and IPC definitions.
