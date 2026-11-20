# Focus & Ambient Studio — Phase 7: Clean-Room FlipClock.us-Informed Integration Plan

**Document Version:** 1.0.0  
**Status:** Approved for Implementation  
**Baseline Checkpoint:** `46ac448` (`phase7-baseline`)  
**Target Application:** Focus & Ambient Studio (Web / PWA)  
**Live Production URL:** `https://bishwadeept23.github.io/focus-ambient-studio/`  
**Reference Research Audit:** `FLIPCLOCK_REFERENCE_AUDIT.md`  

---

## 1. Executive Mission & Clean-Room Boundaries

### 1.1 Objective
Upgrade the existing Focus & Ambient Studio flip clock component to achieve the visual elegance, depth, mechanical realism, and synchronization reliability observed on FlipClock.us, while maintaining an **independently authored, clean-room React TypeScript architecture**.

### 1.2 Strict Clean-Room Constraints
- **Zero Asset Transplantation:** No proprietary code, vendor libraries (jQuery, Twig.js), stylesheets, fonts (`franchiseregular`, `sahararegular`), or icons from FlipClock.us will be introduced into the project.
- **Strictly Declarative React:** The implementation will replace legacy DOM-manipulation patterns with a typed, declarative React state machine (`IDLE` -> `FLIPPING` -> `COMMIT` -> `IDLE`).
- **Preservation of Core Logic:** The existing timer engine, study session adapters, audio engine, task management, theme engine, and PWA capabilities remain intact and unaffected.
- **Local Isolation:** Reference resources remain strictly in `reference-research/flipclock-us/`.

---

## 2. Architectural Design: The Single 3D Rotating Flap Model

### 2.1 Why the Previous Flap Model Had Discontinuities
The previous implementation utilized **four separate elements**:
1. Static upper background half
2. Static lower background half
3. Animated upper flap (`rotateX(0deg -> -90deg)` over 250ms)
4. Animated lower flap (`rotateX(90deg -> 0deg)` over 250ms with a 250ms delay)

While functionally split, two sequential CSS animations controlled by a generic `setTimeout(520ms)` are vulnerable to:
- Seam flickering or micro-gaps at the 90-degree handoff between the folding top flap and unfolding bottom flap.
- Desynchronization when browser frame rates drop or tabs are backgrounded.
- Color and theme inconsistency between the independent animated flaps and background cards.

### 2.2 The FlipClock.us-Informed Architecture
Instead of two independently animated half-flaps, FlipClock.us employs a **single 3D rotating card** that turns a full -180 degrees around the center hinge line:

```
[Outer Tile Container (.digit)] (perspective: 1000px, overflow: hidden, theme-aware surface)
  ├── 1. Static Underlayer (.card-static)
  │     ├── Upper Half (.top) -> Displays INCOMING digit (revealed as front flap drops)
  │     └── Lower Half (.bottom) -> Displays OUTGOING digit (covered as back flap lands)
  │
  ├── 2. Active 3D Rotating Card (.card-active) (transform-style: preserve-3d, center pivot)
  │     ├── Front Face (.front) -> Displays OUTGOING upper digit (backface-visibility: hidden)
  │     └── Rear Face (.back) -> Displays INCOMING lower digit (rotateX(180deg), backface-visibility: hidden)
  │
  └── 3. Center Hinge & Metal Pin Accents (z-index: 40)
```

### 2.3 Mathematical Coordinate & Glyph Alignment
To ensure digits are seamlessly severed and never clipped or misaligned:
- Outer Digit Tile: Responsive width and height (e.g. `w-11 h-18 sm:w-16 sm:h-24 md:w-20 md:h-32`).
- Each Half: Exact `height: 50%; overflow: hidden;`.
- Inner Container: Exact `height: 200%` (relative to the half, which equals 100% of the entire card).
- Upper Inner Half: `top: 0;` (places the upper 50% of the centered glyph in view).
- Lower Inner Half: `bottom: 0;` or `top: -100%;` (places the lower 50% of the centered glyph in view).
- Center Hinge: 1px bottom border on upper half + 1px top border on lower half + 2px dark depth divider.

---

## 3. Animation Synchronization & State Machine

### 3.1 State Diagram
```
       ┌───────────┐
       │   IDLE    │◄─────────────────────────────┐
       └─────┬─────┘                              │
             │ (digit changes & !reducedMotion)   │
             ▼                                    │
       ┌───────────┐                              │
       │ FLIPPING  │                              │
       └─────┬─────┘                              │
             │ (750ms transitionend or fallback)  │
             ▼                                    │
       ┌───────────┐                              │
       │  COMMIT   │──────────────────────────────┘
       └───────────┘
```

### 3.2 State Machine Rules
1. **Transition Timing:** Reference animation duration of **750ms** using cubic-bezier easing (`cubic-bezier(0.4, 0.0, 0.2, 1)` or `ease-in-out`).
2. **Guarded Commit:** Transition completion uses an event listener (`onTransitionEnd`) coupled with a guaranteed fallback timeout (`800ms`) to eliminate hangs if the browser throttles CSS events.
3. **Timer Engine Truth:** The timer engine remains the authoritative source of truth. If a rapid tick or tab recovery occurs while `isFlipping` is true:
   - The pending digit is immediately buffered.
   - The active animation snaps to commit without ghost frames.
   - The new flip commences cleanly.
4. **Reset & Mode Switching:** Calling `onReset()` or switching modes immediately terminates active flips and sets both previous and current digits to the target state synchronously.
5. **Reduced-Motion Preference:** If `reducedMotion` is active (either via prop or `prefers-reduced-motion: reduce`), the component skips transitions completely and updates state instantaneously.

---

## 4. Countdown Presentation & Mode Compatibility

The flip clock must operate seamlessly across all 6 supported timer modes without altering business logic or duration calculations:
- **Pomodoro:** Default 25:00 countdown (`MM:SS`).
- **Short Break:** Default 05:00 countdown (`MM:SS`).
- **Long Break:** Default 15:00 countdown (`MM:SS`).
- **Countdown Mode:** Custom user-specified duration (`MM:SS` or `HH:MM:SS` if > 59m).
- **Stopwatch Mode:** Elapsed time count-up (`MM:SS` or `HH:MM:SS` when >= 1 hr).
- **Animedoro Mode:** Anime study interval (e.g. 40:00 / 20:00).

When `hours > 0`, the flip clock renders three two-digit cards (`HH : MM : SS`). When `hours === 0`, it renders two two-digit cards (`MM : SS`), maintaining a compact and elegant presentation.

---

## 5. Theme & Accessibility Integration

### 5.1 Dynamic Theme Variables
Card backgrounds, borders, and lighting gradients will dynamically consume the CSS variables set by `ThemeEngine`:
- Surface: `var(--theme-surface, #0d0b18)` with dark linear gradient overlay.
- Border: `var(--theme-border, rgba(139, 92, 246, 0.25))`.
- Text / Digit Color: High contrast `#ffffff` with subtle bottom-half shading (`#d4d4d8` / `text-neutral-300`).
- Top-Half Highlight: `linear-gradient(to bottom, rgba(255,255,255,0.06), transparent)`.
- Bottom-Half Shadow: `linear-gradient(to top, rgba(0,0,0,0.5), transparent)`.

### 5.2 Accessibility
- ARIA: `data-testid="flip-digit-card"` and `aria-label="<label> <digit>"` updated on commit.
- Container: `aria-live="polite"` on parent timer display.
- Contrast: Verified WCAG AA compliant (> 7:1 contrast ratio between digits and cards).

---

## 6. Implementation Stages & Verification Gates

1. **Stage 1: CSS Framework & 3D Keyframes (`src/index.css`)**
   - Implement `.flip-digit-card`, `.flip-card-static`, `.flip-card-active`, `.flip-card-front`, `.flip-card-back`.
   - Add perspective, 3D transform rules, and hardware acceleration tags.

2. **Stage 2: Component Re-Authoring (`src/components/FlipDigit.tsx` & `FlipCard.tsx`)**
   - Re-implement `FlipDigit` with the single 3D rotating card model and state machine.
   - Ensure props, refs, and timer guards are robust.

3. **Stage 3: Vitest Test Suite Enhancement (`src/test/flipClock.test.tsx`)**
   - Add tests for initial render, 9->0, 0->9, 750ms lifecycle, reset during flip, rapid ticks, reduced motion.

4. **Stage 4: Playwright Visual & E2E Verification (`e2e/flip_clock_clean_room.spec.ts`)**
   - Test across 390px, 768px, 1366px, 1920px viewports.
   - Capture idle, mid-transition, and completed animation screenshots.
   - Verify all timer modes, theme switching, and regression-free sound mixer & task functions.

5. **Stage 5: Quality Gates & Live Deployment**
   - Typecheck, full Vitest, full Playwright.
   - Commit, push to GitHub, verify GitHub Actions run.
   - Run live production verification suite against GitHub Pages.
   - Deliver `FLIPCLOCK_IMPLEMENTATION_REPORT.md`, `FLIPCLOCK_VISUAL_COMPARISON.md`, and `FLIPCLOCK_PRODUCTION_VERIFICATION.md`.
