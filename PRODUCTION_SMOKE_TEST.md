# Focus & Ambient Studio — Production Smoke Test Specification

## 1. Test Objective
Verify the operational integrity, PWA installation, offline capabilities, audio synthesis, and persistence of Focus & Ambient Studio when deployed to GitHub Pages or served under the `/focus-ambient-studio/` subpath.

---

## 2. Test Execution Matrix

| Test Case | Verification Steps | Expected Result | Verified Result |
| :--- | :--- | :--- | :---: |
| **TC-01: Asset Resolution & HTTP 200** | Navigate to `https://bishwadeept23.github.io/focus-ambient-studio/`. Inspect Network tab. | Status 200 OK. CSS and JS bundles load from `/focus-ambient-studio/assets/` without 404s. | **PASS** (Preview verified) |
| **TC-02: Initial Timer UI Display** | Verify digital timer display on first load. | Timer displays initial 25:00 in Pomodoro mode with Start, Skip, Mode switch buttons. | **PASS** |
| **TC-03: Timer State Transitions** | Click Start, wait 2s, click Pause, click Reset. | State moves running $\to$ paused $\to$ idle; high-precision delta timing tracks elapsed seconds. | **PASS** |
| **TC-04: Audio Mixer & Synthesis** | Open soundscape mixer, toggle "Gentle Rain" and "Ocean Waves", adjust Master Volume, click completion chime, click mute. | AudioContext resumes; procedural web audio synthesis runs without external media errors; mute silences output. | **PASS** |
| **TC-05: Task Creation & Persistence** | Open Tasks drawer, enter a task name ("Prelims Polity Revision"), assign priority, click Add. | Task is added to UI, rendered in list, and persisted to LocalStorage debounced store. | **PASS** |
| **TC-06: Theme & Settings Storage** | Open Settings modal, select "Emerald Forest" theme, close modal, reload page. | Background color changes immediately; stored theme preference survives reload. | **PASS** |
| **TC-07: Service Worker Registration** | Inspect `navigator.serviceWorker.controller` and Application > Service Workers tab in DevTools. | Service worker registered at `/focus-ambient-studio/` scope; status is activated and running. | **PASS** |
| **TC-08: Offline-First Operation** | In DevTools Network tab, check "Offline" (or via Playwright `context.setOffline(true)`). Reload page. | Application shell loads completely from cache; timer starts/pauses offline; tasks can be created offline. | **PASS** |
| **TC-09: Responsive Mobile Layout** | Emulate mobile viewport (390 × 844). | UI wraps responsively; controls remain accessible; touch targets exceed 44×44px. | **PASS** |
| **TC-10: Browser Console Health** | Open Console drawer in DevTools. | 0 unhandled promise rejections, 0 uncaught exceptions, 0 Content Security Policy violations. | **PASS** |

---

## 3. Automated Smoke Test Script
The automated Playwright smoke test can be executed against the live deployed URL using:
```bash
npx playwright test --config=playwright.config.ts
```
Or pointing directly to the production URL:
```bash
URL=https://bishwadeept23.github.io/focus-ambient-studio/ npx playwright test e2e/offline_pwa.spec.ts
```
