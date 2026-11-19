# Flocus Clean-Room Autonomous Engineering Mission

## 1. Mission Overview
To autonomously analyze publicly observable behavior, functional characteristics, and user experience of Flocus (specifically Ambient Mode, Pomodoro/Focus engines, Soundscapes, and Tasks), and build an original, high-performance, offline-first Focus & Ambient Engine in TypeScript and React.

## 2. Core Execution Principles
- **Clean-Room Isolation:** Zero extraction or inclusion of proprietary code, copyrighted media, private keys, or trademarks. All logic, components, and sound synthesis are developed from clean specifications.
- **Autonomous Progress:** Execute sequential phases without pausing for routine operations; checkpoint state after every milestone.
- **Resilience & Drift Recovery:** Background tab persistence, crash recovery, and offline capability as foundational requirements.
- **Rigorous Verification:** Unit and integration testing with automated pass/fail assertions.

## 3. Mission Phases
- [x] **Phase 1: Reconnaissance & Analysis** — Black-box analysis of public bundles, network requests, storage keys, and documentation. Documented in `FINDINGS.md`.
- [x] **Phase 2: Functional Specification & Architecture** — Comprehensive system design for all 9 engines and cross-platform contracts. Documented in `ARCHITECTURE.md`.
- [ ] **Phase 3: Project Scaffolding & Tooling** — Vite, React 19 / TypeScript, Tailwind CSS, Lucide icons, Vitest, Playwright setup.
- [ ] **Phase 4: Core Engine Implementation**
  - Timer Engine (Worker + drift recovery + modes + interval engine)
  - Ambient Audio Engine (Web Audio procedural synthesis: Rain, Waves, Wind, Campfire, Brown Noise, Cafe, Chimes)
  - Background & Theme Engine (Ambient visual scenes, opacity controls, motion accessibility)
  - Task Management Engine (ULID tasks, subtasks, priority focus linking)
  - Focus Analytics Engine (Daily/Weekly aggregation, streak engine with weekend grace)
  - Storage & Persistence Engine (IndexedDB + localStorage dual-layer)
- [ ] **Phase 5: User Interface & Experience**
  - Ambient Mode View (Mini-timer, immersive scene, subtle controls)
  - Focus Mode View (Hero timer, flip display, active task bar)
  - Soundscape Audio Mixer Drawer / Modal
  - Task Manager Drawer
  - Focus Analytics & Streak Modal
  - Settings Modal & Shortcuts Guide
- [ ] **Phase 6: Cross-Platform Integration Contracts**
  - Study Flip Timer Contract & Adapter
  - UPSC Prep OS & RBI Prep OS Sync Interfaces
  - Android Jetpack Compose & Tauri/Electron Desktop spec
- [ ] **Phase 7: Automated Testing & Verification**
  - Vitest unit tests for Timer, Audio nodes, Streaks, Storage, Analytics
  - Type checking (`tsc`) and build validation (`vite build`)
- [ ] **Phase 8: Final Audit & Delivery**
  - `TEST_REPORT.md`, `FINAL_AUDIT.md`, local Git milestone commits.
