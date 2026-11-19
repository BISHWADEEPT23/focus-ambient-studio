# Clean-Room Reverse Engineering Findings: Flocus (app.flocus.com)

**Target URL:** https://app.flocus.com/ambient/settings  
**Investigation Date:** 2026-11-19  
**Methodology:** Clean-room black-box network inspection, bundle signature analysis, and public web documentation research without accessing proprietary repositories, private user credentials, or copyrighted media.

---

## 1. UI Hierarchy, Layout and Navigation

- **Dashboard Modes [VERIFIED]:**
  - Flocus provides distinct dashboard operational modes controlled via `document.body.dataset.dashboardMode`:
    1. `focus` mode: Centered large timer (standard or flip display), high-emphasis productivity layout with task list directly visible.
    2. `ambient` mode: Visuals-first layout where the focus timer is shrunk and pinned as an unobtrusive mini-widget in the corner (usually bottom or top corner), with background ambient scenes taking visual precedence.
    3. Mode switching is accessible via a bottom corner switcher toggle.
- **Top Bar / Corner Controls [VERIFIED]:**
  - Left / Top: Greeting header, dynamic motivational quote (`greeting`, `currentQuote`, `currentFocusQuote`).
  - Right / Top: Settings modal trigger, fullscreen toggle, user account / upgrade indicator.
  - Bottom Bar: Dashboard mode switcher, ambient soundscape quick-toggle, audio volume popover trigger, streak counter pill (`flocus_streaks`).
- **Modal Panels [VERIFIED]:**
  - Settings Modal contains modular sub-panels:
    - Pomodoro Timer Settings (`#settModal-tab`)
    - Themes & Backgrounds (mode-specific themes)
    - Soundscapes / Audio Mixer (`flocus_sounds_settings`)
    - Task / Priority Settings
    - Account / Flocus Plus status
- **Responsive Adaptability [VERIFIED]:**
  - Supports viewport configurations from mobile screen widths (320px–428px) up to ultra-wide displays (2732px+).
  - On compact/mobile viewports, side panels collapse into full-screen overlay sheets or drawer modals. Mini-timer in ambient mode anchors to safe-area insets.

---

## 2. Timer Modes and Interactions

- **Timer Sub-modes [VERIFIED]:**
  - **Pomodoro:** Classic cyclical work (default 25m), short break (default 5m), and long break (default 15m) with interval cycle counters.
  - **Countdown:** Single target countdown timer with user-defined target duration.
  - **Stopwatch:** Count-up timer tracking total focused time with pause and lap support.
  - **Animedoro:** Specialized interval mode geared towards longer focus blocks (typically 40–50 minutes) followed by a media-length break (typically 20 minutes).
- **Display Variations [VERIFIED]:**
  - Standard digital countdown font (`HH:MM:SS` or `MM:SS`).
  - Retro Flip Clock style (`useFlip: true`, `timerStyle: "flip"`).
- **Lifecycle & Drift Handling [INFERRED / VERIFIED]:**
  - In background tabs, `setInterval` is throttled by modern browsers down to 1Hz or lower. Flocus mitigates drift by storing absolute timestamps (`startTime`, `targetEndTime`, `lastTickTime`) and reconciling on RAF/tab visibility change (`document.visibilityState`).
- **Audio Chimes & Notifications [VERIFIED]:**
  - Audio alert chimes play upon session completion.
  - Browser Notification API is invoked if user grants notification permissions.

---

## 3. Ambient Backgrounds and Themes

- **Curated Theme Library [VERIFIED]:**
  - Includes static aesthetic photographs, dynamic gradients, and looped video/animated backgrounds (e.g., Cozy Cafe, Rainy Window, Starry Sky, Forest Dusk).
  - Opacity and dimming sliders: Background overlay layer with adjustable dark/light opacity to ensure WCAG text legibility against complex scenes.
- **Custom Uploads & YouTube Integration [VERIFIED]:**
  - Flocus Plus allows custom image uploads (JPG, PNG, WEBP up to 5MB) or embedding YouTube video ambient backdrops.
- **Motion Reduction [INFERRED]:**
  - Animated scenes must respect `prefers-reduced-motion: reduce`, falling back to static poster representations to prevent vestibular discomfort.

---

## 4. Soundscape Mixing and Playback

- **Architecture [VERIFIED]:**
  - Powered by Web Audio / `Howler.js` runtime.
  - Multi-track parallel channel mixer. Each sound channel operates independently with its own gain/volume node.
- **Channel Allocation [VERIFIED]:**
  - Stored in `localStorage` under `flocus_sounds_settings`:
    ```json
    { "active": [{ "id": "rain", "volume": 0.6 }, { "id": "lofi", "volume": 0.4 }] }
    ```
  - Maximum concurrent active sounds: capped at 5 channels to prevent audio clutter and browser resource exhaustion.
  - Per-channel volume: continuous float `0.0` to `1.0` (default `0.5`).
  - State persistence is debounced by 400ms (`soundsPersistTimer`) to prevent thrashing storage on rapid slider drags.
- **Procedural & Atmospheric Sounds [VERIFIED]:**
  - Built-in atmospheric tracks include Rain, Nature/Forest, Wind, Night/Crickets, Cafe, Campfire, Clock ticking.
  - External music integration supports Spotify embed, Apple Music, and curated playlists.

---

## 5. Task Management

- **Task Hierarchy [VERIFIED]:**
  - Top-level tasks and nested subtasks using ULID identifiers.
  - Reordering and drag demote threshold (`DEMOTE_THRESHOLD: 28px` offset indicating gesture-based nesting/indentation).
  - Settings flags:
    - `taskBreak: boolean` (automatic or manual break when a task finishes)
    - `taskBreakLength: number` (seconds, default 300s = 5m)
    - `taskAutoBreak: boolean`
    - `taskProgress: boolean` (completion ratio indicator)
    - `showTaskCount: boolean`
    - `hideTasks: boolean`
- **Focus Priority Linking [VERIFIED]:**
  - The user can designate an active "Focus Priority" task, which docks alongside the active timer so the current goal is always visible during work intervals.
- **Quick Notes / Notepad [VERIFIED]:**
  - Dedicated scratchpad area persisted under `notepad` key.

---

## 6. Focus Statistics and Streaks

- **Streak Logic [VERIFIED]:**
  - Persisted under `flocus_streaks`:
    ```json
    {
      "streakLength": 3,
      "nextCheck": 1700438400000,
      "maxStreak": 7,
      "cloud": false
    }
    ```
  - `nextCheck` set to next midnight (`(new Date).setHours(24, 0, 0, 0)`).
  - If the gap since `nextCheck` exceeds 86,400,000 ms (24 hours), the streak resets, EXCEPT when the missed days fall on a weekend (`getDay() === 0 || getDay() === 6`), providing weekend grace protection.
- **Session History & Analytics [INFERRED / UNKNOWN]:**
  - Basic metrics track daily completed focus intervals and aggregate minutes. Detailed long-term analytics in Flocus cloud require authenticated account sync (`statsUpload`, `gfUserAccount`).
  - Offline-first clean-room engine must provide robust local analytics with daily, weekly, and subject breakdowns without requiring external cloud servers.

---

## 7. Storage and Persistence

- **Primary Client Storage [VERIFIED]:**
  - Extensively uses `localStorage` for immediate key-value lookup.
  - Key schema detected:
    - `flocus_pomodorotimer_settings`
    - `flocus_sounds_settings`
    - `flocus_homeTheme_settings`
    - `flocus_taskData`
    - `flocus_priorities_settings`
    - `flocus_streaks`
    - `notepad`
- **Limitations of Flocus Storage Approach [VERIFIED]:**
  - Relying exclusively on synchronous `localStorage` risks data loss on quota overflow, lacks relational queries, and cannot store binary audio cache or large analytics datasets.
  - **Clean-room Enhancement:** Our engine will utilize a dual-tier storage strategy: IndexedDB (as primary transactional and historical store) with synchronous localStorage caching for instantaneous hydration and zero layout shifts.

---

## 8. Technology Stack and Bundler Indicators

- **Technology Indicators [VERIFIED]:**
  - Framework: Custom element web components paired with React runtime structures.
  - Audio Engine: `Howler.js` (Web Audio API wrapper with HTML5 Audio fallback).
  - Build Tool: Modern Webpack with runtime chunks, chunk hashing, defer scripts.
  - Styling: Embedded scoped CSS and utility classes.
- **Network Metadata [VERIFIED]:**
  - Edge Delivery: Cloudflare CDN, strict HTTPS, PWA manifest, dynamic caching.
  - API sync endpoints: Restricted to authenticated users (`/api/...`).
- **Public API Documentation [UNKNOWN]:**
  - Flocus does not publish a public REST or OpenAPI specification for third-party developers. All client-server communication is proprietary and session-cookie/token protected.
  - Consequently, our architecture will provide a standardized, typed OpenAPI / JSON-RPC export and local integration contract.

---

## 9. Summary of Clean-Room Architecture Opportunities

1. **Procedural Web Audio Engine:** Instead of serving heavy static MP3/WAV files for noise profiles (rain, ocean, white/brown noise, wind), use procedural Web Audio synthesis (BiquadFilterNode, AudioBufferSourceNode, GainNode, StereoPannerNode) which operates 100% offline, requires 0 bytes of copyrighted audio assets, and produces infinite non-repeating natural soundscapes.
2. **Web Worker Background Timer:** Run timer cadence inside a dedicated Web Worker that cannot be throttled by browser background tab optimizations, with timestamp delta reconciliation.
3. **Structured IndexedDB Analytics:** Offer robust, privacy-respecting daily/weekly/monthly charts and topic tagging (UPSC, RBI, Coding, Reading) with instantaneous JSON export/import.
4. **First-Class OS Integration Contracts:** Native event contracts for Study Flip Timer, UPSC Prep OS, and RBI Prep OS.
