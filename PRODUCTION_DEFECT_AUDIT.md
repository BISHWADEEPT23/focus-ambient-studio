# Focus & Ambient Studio — Production Defect Audit (Phase 1)

**Audit Date:** 2026-11-20  
**Project Path:** `C:\Users\bethm\OneDrive\Desktop\REV IDea\Flocus`  
**Live Production URL:** `https://bishwadeept23.github.io/focus-ambient-studio/`  
**Audit Target:** User-Reported Production Defects (Flip Clock, Ambient Audio, Themes)

---

## 1. Executive Summary

A comprehensive forensic audit of the Focus & Ambient Studio codebase and production build was performed across desktop and mobile configurations. All three user-reported defects were successfully reproduced and traced to concrete architectural gaps in the UI and engine layers.

| Defect ID | Feature | Status | Root Cause Category | Severity |
| :--- | :--- | :---: | :--- | :---: |
| **DEF-01** | **Flip Clock Display** | **BROKEN / INCOMPLETE** | Missing 3D flip animation mechanics; static component rendering single container instead of split digit cards. | **P0** |
| **DEF-02** | **Ambient Audio Synthesis** | **BROKEN / INCOMPLETE** | Missing Forest Birds generator; un-awaited `AudioContext.resume()` state race; low gain staging; decoupled React mute/volume synchronization. | **P0** |
| **DEF-03** | **Theme System** | **BROKEN / INCOMPLETE** | Hardcoded Tailwind color palette (`primary-*`); absence of CSS custom property variables; themes only changed outer background gradient leaving all UI controls purple. | **P0** |

---

## 2. Detailed Defect Analysis & Root Causes

### Defect 1: Flip Clock Not Working
- **Intended Behavior:** When the user switches to Flip style (`timerStyle === 'flip'`), each digit (or pair of digits for Hours, Minutes, Seconds) displays on a split-flap card. When the timer counts down, the card executes a realistic 3D downward flip animation with upper and lower flaps, synchronized with timer ticks and respecting reduced-motion preferences.
- **Actual Production Behavior:**
  1. The display shows a static dark rectangle with a white text span (`{formatted}`).
  2. Numbers simply jump from one value to the next with zero animation.
  3. The clock displays composite numbers (e.g., "25") in a single card rather than split flap units.
- **Root Cause & Code References:**
  - `src/components/FlipCard.tsx` (lines 8–32): The component renders a static `<div>` and `<span className="font-mono text-5xl...">{formatted}</span>`. There is no top/bottom flap separation, no previous digit state tracking, and no 3D transform animation.
  - `src/components/TimerHero.tsx` (lines 68–80): Renders `<FlipCard digit={minutes} />` and `<FlipCard digit={seconds} />`, treating entire 2-digit minutes/seconds as a single value.
  - `src/index.css` (lines 40–48): Stubs `.flip-card-container` and `.flip-card` without keyframes, rotateX transforms, or perspective styling.

---

### Defect 2: Ambient Sounds Not Working
- **Intended Behavior:** Opening the soundscape mixer and activating any channel (Rain, Ocean Waves, Forest Birds, Wind, Hearth, Brown Noise) should immediately produce audible, rich, multi-channel procedural audio through the Web Audio API, controlled by master volume and channel volume sliders, with instant mute/unmute.
- **Actual Production Behavior:**
  1. Clicking sound channels often produces no audible sound in modern browsers (Chrome/Safari) because `AudioContext.resume()` was not awaited during user gesture.
  2. "Forest Birds" was completely absent from the sound channel list and generators.
  3. Gain levels for procedural noise buffers were heavily attenuated (0.4 × 0.5 × 0.8 = ~0.16), making rain and waves almost imperceptible on standard device speakers.
  4. In `App.tsx`, the `onStateChange` callback did not update React's `isMuted` and `masterVolume` states, causing the UI mixer to desynchronize from the actual AudioContext graph.
- **Root Cause & Code References:**
  - `src/core/audio/ambientAudioEngine.ts` (lines 41–55, 116–147): `initAudioContext()` calls `ctx.resume().catch(() => {})` without awaiting completion before starting source nodes.
  - `src/core/audio/ambientAudioEngine.ts` (lines 12–18): `DEFAULT_SOUND_CHANNELS` omits the `birds` channel.
  - `src/core/audio/proceduralGenerators.ts`: Lacks `startForestBirdsSound()` synthesis function. Existing buffer generators loop short segments without gain compensation.
  - `src/App.tsx` (lines 124–134): `setMasterVolume` and `setIsMuted` were omitted from the engine state change subscriber.

---

### Defect 3: Themes Not Working
- **Intended Behavior:** Selecting any of the preset themes (Twilight Glow, Emerald Forest, Rainy Window, Starry Cosmos, Minimal Warmth, Obsidian Violet) must visibly transform the application interface — updating the primary accent colors, button gradients, borders, badge backgrounds, and ambient canvas particle colors.
- **Actual Production Behavior:**
  1. Selecting a theme in the Settings modal only changes the subtle background gradient of the root div.
  2. All buttons, timer mode pills, task checkboxes, slider accents, modal headers, and badges remain permanently purple (`#7c3aed` / `#8b5cf6`).
  3. The user observes no meaningful visual change across 90% of the screen.
- **Root Cause & Code References:**
  - `tailwind.config.js` (lines 10–23): `colors.primary` is hardcoded to static purple hex values (`#f5f3ff` to `#4c1d95`).
  - `src/core/themes/themeEngine.ts` (lines 3–50, 87–108): Themes only define a background gradient and scene type, with no color tokens for primary, accent, surface, border, or text.
  - `src/index.css`: Missing CSS custom properties (`--color-primary`, `--color-primary-hover`, `--color-primary-rgb`, `--color-surface`, `--color-border`).
  - `src/components/AmbientCanvas.tsx` (lines 102–105): Particle colors are hardcoded to purple `rgba(167, 139, 250, ...)` regardless of whether "Emerald Forest" (green) or "Rainy Window" (cyan/blue) is selected.

---

## 3. Repair Roadmap

1. **Phase 2 (Flip Clock):**
   - Create a true 3D split-flap flip digit component (`FlipDigit.tsx`) with upper and lower card halves, 3D perspective, `rotateX` transform flip animation, digit transition queue, and reduced-motion fallback.
   - Update `FlipCard.tsx` and `TimerHero.tsx` to support individual tens and units digits for Hours, Minutes, and Seconds.
2. **Phase 3 (Ambient Audio):**
   - Implement `startForestBirdsSound` with procedural chirp synthesis (frequency modulation + randomized burst envelopes).
   - Ensure `AudioContext.resume()` is properly awaited on all user interactions.
   - Recalibrate gain staging and dynamic range compression for rich, crisp, audible soundscapes.
   - Wire complete two-way reactive state in `App.tsx` for master volume, channel volume, and mute.
3. **Phase 4 (Theme System):**
   - Define dynamic CSS variables in `:root` and update `tailwind.config.js` to reference CSS variables.
   - Enhance `PRESET_THEMES` with full color palettes (Primary, Primary Light, Primary Dark, Accent, Card Background, Border, Canvas Particle Colors) for all themes:
     - *Twilight Glow:* Deep Violet / Indigo
     - *Emerald Forest:* Jade / Emerald Green
     - *Rainy Window:* Steel Blue / Cyan
     - *Starry Cosmos:* Midnight Navy / Electric Blue
     - *Minimal Warmth:* Amber / Golden Sand
     - *Obsidian Violet:* Deep Cyber Purple
   - Dynamically inject theme CSS variables onto document element upon selection and on hydration.
   - Update `AmbientCanvas` to draw particle colors corresponding to the active theme.
4. **Phase 5 & 6:** Regression tests, quality gates, and live production deployment.
