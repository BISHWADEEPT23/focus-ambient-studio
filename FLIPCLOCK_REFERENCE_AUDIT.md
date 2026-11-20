# FlipClock.us — Read-Only Frontend Source Inspection & Reference Audit

**Target URL:** `https://flipclock.us/#/c/0h2m0s`  
**Inspection Date:** 2026-11-21  
**Auditor:** Antigravity AI  
**Repository Working Copy:** `C:\Users\bethm\OneDrive\Desktop\REV IDea\Flocus`  
**Reference Directory:** `reference-research/flipclock-us/`  

---

## 1. Executive Summary

A comprehensive, read-only technical inspection was conducted on the publicly accessible web application at `https://flipclock.us/#/c/0h2m0s`. The site delivers a split-flap retro digital flip clock and countdown timer.

### Key Technical Findings:
1. **Public Asset & Source Map Availability:** The production deployment serves an unminified, public JavaScript bundle `package.js` alongside an active source map `package.js.map`. This allowed complete reconstruction and auditing of all 18 original ES6 module source files.
2. **Architecture:** The application is built using standard ES6 JavaScript modules bundled via NobleModules/Rollup, using jQuery 2.1.0 for DOM manipulation and Twig.js for client-side modal dialog rendering. It relies on the HTML5 Application Cache (`cache.manifest` v39) for offline persistence.
3. **Flip Mechanics:** The 3D split-flap effect relies on a dual-card DOM architecture per digit tile (a static background card and an active 3D card). The active card utilizes `preserve-3d`, rotating -180 degrees around its horizontal midline via `rotateX(-180deg)`. A subtle text offset (`top: -100%`) in the bottom inner container produces seamless top/bottom digit splits.
4. **Timing & Synchronization:** The countdown route `#/c/0h2m0s` parses the hash string to `{ hours: 0, minutes: 2, seconds: 0 }`. It computes target time as `Date.now() + duration + 100ms` (a 100ms padding buffer ensures the initial tick renders the full starting duration). When remaining hours reach zero, the 4 digits dynamically switch from displaying `HH : MM` to `MM : SS`. The CSS animation duration is 750ms with an 850ms JavaScript DOM cleanup timeout, providing a 150ms buffer before the subsequent 1000ms tick.

---

## 2. Resource Inventory & Download Manifest

All publicly served frontend assets were downloaded directly into `reference-research/flipclock-us/` via standard HTTP GET requests without bypassing any access controls or modifying application source code.

| Local Relative Path | Remote Origin URL | Size (Bytes) | Content Type / Description |
| :--- | :--- | :--- | :--- |
| `index.html` | `https://flipclock.us/` | 2,249 | HTML5 Entrypoint Document |
| `cache.manifest` | `https://flipclock.us/cache.manifest` | 541 | HTML5 Application Cache manifest (v39) |
| `package.js` | `https://flipclock.us/package.js` | 295,402 | Compiled application script bundle |
| `package.js.map` | `https://flipclock.us/package.js.map` | 688,576 | Full Source Map with `sourcesContent` |
| `init.js` | `https://flipclock.us/init.js` | 269 | Bootstrap module invoking `boot()` |
| `css/app.css` | `https://flipclock.us/css/app.css` | 17,597 | Primary CSS stylesheet & animations |
| `css/font/font.css` | `https://flipclock.us/css/font/font.css` | 58,527 | Base64 embedded `@font-face` definitions |
| `templates/countdown.twig` | `https://flipclock.us/templates/countdown.twig` | 1,693 | Twig template for countdown duration modal |
| `templates/options.twig` | `https://flipclock.us/templates/options.twig` | 1,247 | Twig template for configuration settings |
| `templates/dialog.twig` | `https://flipclock.us/templates/dialog.twig` | 345 | Twig template for modal dialog wrapper |
| `templates/about.twig` | `https://flipclock.us/templates/about.twig` | 205 | Twig template for application info |
| `vendor/nobleModules.js` | `https://flipclock.us/vendor/nobleModules.js` | 24 | Module loader helper |

### Extracted Original Source Files (from `package.js.map`):
The source map contains complete unminified source code for 18 files, extracted into `reference-research/flipclock-us/extracted-src/`:
- `app.js` (7,891 chars) — Main router, resize handler, toolbar controller
- `init.js` (269 chars) — Bootloader
- `lib/config.js` (1,339 chars) — Configuration store
- `lib/utils.js` (675 chars) — Route and time parameter parser
- `lib/clock/flipclock.js` (3,410 chars) — Core `FlipClock.Digit` and `FlipClock.Layout` classes
- `lib/clock/countdown.js` (1,991 chars) — Countdown initializer and completion blinks
- `lib/clock/layout/countdown.js` (2,345 chars) — Countdown layout math & digit updates
- `lib/clock/layout/flipclock.js` (1,646 chars) — 12-hour/24-hour clock layout (HH:MM AM/PM)
- `lib/clock/layout/flipclockSeconds.js` (1,895 chars) — Clock layout with seconds
- `lib/ui/blinker.js` (811 chars) — Background flash controller on countdown zero
- `lib/ui/buttons.js` (2,885 chars) — Toolbar UI button actions
- `lib/ui/dialog.js` (1,815 chars) — Twig modal dialog manager
- `lib/ui/toggle.js` (980 chars) — Option switches
- `lib/core/environment.js` (2,121 chars) — Fullscreen and platform detection
- `lib/core/storage.js` (590 chars) — `localStorage` wrapper
- `vendor/jquery.js` (89,741 chars) — jQuery 2.1.0
- `vendor/twig.js` (163,053 chars) — Twig.js client template engine
- `vendor/spin.js` (8,883 chars) — Loading spinner

---

## 3. DOM Structure & Card Hierarchy

### 3.1 Digit Tile Markup
Each digit is an absolute container (`<div class="digit">`) holding two `.card` layers:

```html
<div class="digit time left_1" number="0" from="1">
  <!-- 1. STATIC BACKGROUND CARD (Permanent underlayer) -->
  <div class="card back">
    <div class="top">0</div>
    <div class="bottom">
      <div class="inner">0</div>
    </div>
  </div>

  <!-- 2. ACTIVE 3D ROTATING CARD (Transforms during flip) -->
  <div class="card active transform flipped">
    <div class="front">
      <div class="top">1</div>
    </div>
    <div class="back">
      <div class="bottom">
        <div class="inner">0</div>
      </div>
    </div>
  </div>
</div>
```

### 3.2 Anatomy of the Halves
- **Top Half (`.top`)**:
  - Occupies `height: 50%; width: 100%; top: 0;` with `overflow: hidden;`.
  - Border radius: `border-top-left-radius: 10px; border-top-right-radius: 10px;`.
  - Border bottom: `1px solid black;` (upper half of the center hinge).
  - Background: `linear-gradient(to bottom, #222222, #333333); color: #ffffff;`.
  - Text alignment: `line-height: 310px; font-size: 320px; text-align: center;`.
  - Clipping: The character glyph is naturally clipped at 50% height by `overflow: hidden`.

- **Bottom Half (`.bottom`)**:
  - Occupies `height: 50%; width: 100%; top: 50%;` with `overflow: hidden;`.
  - Border radius: `border-bottom-left-radius: 10px; border-bottom-right-radius: 10px;`.
  - Border top: `1px solid black;` (lower half of the center hinge).
  - Background: `linear-gradient(to bottom, #222222, #111111); color: #cccccc;`.
  - Contains `.inner`: `position: absolute; width: 100%; height: 100%; top: -100%;`.
  - **The `-100%` Offset Trick**: Because `.bottom` has `height: 50%` of the card and `overflow: hidden`, shifting `.inner` up by `top: -100%` (which equals -150px) perfectly shifts the glyph upward by half the card's height, aligning the lower half of the 310px glyph exactly at the hinge seam!

- **The Center Hinge**:
  - Created by the juxtaposition of `border-bottom: 1px solid black` on `.top` and `border-top: 1px solid black` on `.bottom`.
  - Forms a crisp 2px dark separation groove running across the exact horizontal center line.

---

## 4. 3D Perspective, CSS Transforms & Keyframes

### 4.1 3D Perspective & Stacking Context
```css
.digit {
  position: absolute;
  display: block;
  width: 150px;
  height: 300px;
  perspective: 1000px;
  -webkit-perspective: 1000px;
  cursor: default;
}

.digit .card {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
```

### 4.2 The 3D Flap Mechanism (`.card.active`)
Unlike implementations that animate separate top and bottom flaps independently, FlipClock.us rotates **the entire 100% height card**:
1. Pivot / Transform Origin: Default `transform-origin: 50% 50% 0` (the geometric center of the 300px card, exactly at 150px / 50% height where the hinge sits).
2. 3D Context:
   ```css
   .digit .active {
     transform-style: preserve-3d;
     -webkit-transform-style: preserve-3d;
   }
   ```
3. Front and Back Faces:
   ```css
   .digit .active .front,
   .digit .active .back {
     margin: 0;
     display: block;
     position: absolute;
     width: 100%;
     height: 100%;
     backface-visibility: hidden;
     -webkit-backface-visibility: hidden;
   }
   
   /* Back face starts pre-rotated 180 degrees so it faces inward/away */
   .digit .active .back {
     transform: rotateX(180deg);
     -webkit-transform: rotateX(180deg);
   }
   ```
4. Flipping Transition:
   ```css
   .digit .transform {
     transition: transform 0.75s ease;
     -webkit-transition: -webkit-transform 0.75s ease;
   }

   .digit .active.flipped {
     transform: rotateX(-180deg);
     -webkit-transform: rotateX(-180deg);
   }
   ```

### 4.3 WebKit / Chromium Z-Fighting & Flickering Fixes
To prevent the classic WebKit glitch where `backface-visibility: hidden` causes flickering or bleed-through mid-rotation:
1. **GPU Layer Promotion**:
   ```css
   .digit .active .front div,
   .digit .active .back div {
     transform: translate3d(0, 0, 0);
     -webkit-transform: translate3d(0, 0, 0);
     backface-visibility: hidden;
     -webkit-backface-visibility: hidden;
   }
   ```
2. **Delayed Opacity Trigger**:
   ```css
   .chrome-browser .digit .active .back {
     opacity: 0;
   }
   .chrome-browser .digit .transform .back {
     transition-property: opacity;
     transition-duration: 0s;
     transition-timing-function: linear;
     transition-delay: 0.25s; /* Switches opacity to 1 after passing the 90-degree threshold */
   }
   .chrome-browser .digit .active.flipped .back {
     opacity: 1;
   }
   ```

---

## 5. Countdown Mechanics & State Synchronization

### 5.1 Route Parsing (`lib/utils.js`)
When navigating to `https://flipclock.us/#/c/0h2m0s`:
1. `app.js` listens to `window.onhashchange`.
2. Path segment `c` indicates countdown mode with data `0h2m0s`.
3. `parseTimeOutOfParams("0h2m0s")` parses characters into:
   ```javascript
   { hours: 0, minutes: 2, seconds: 0 }
   ```

### 5.2 Countdown Layout (`lib/clock/layout/countdown.js`)
```javascript
const padding_time = 100;

export const layout = {
  cls: 'countdown_box layout_countdown',
  refreshTime: 1000,
  init: function(params) {
    var ms_time = Date.now();
    if (params.seconds) ms_time += params.seconds * 1000;
    if (params.minutes) ms_time += params.minutes * 60000;
    if (params.hours) ms_time += params.hours * 3600000;

    // 100ms padding buffer ensures the first tick displays the exact starting time
    this.date = new Date(ms_time + padding_time);

    this.left1 = new FlipClock.Digit({ cls: 'time left_1', transition_duration: 850 });
    this.left2 = new FlipClock.Digit({ cls: 'time left_2', transition_duration: 850 });
    this.right1 = new FlipClock.Digit({ cls: 'time right_1', transition_duration: 850 });
    this.right2 = new FlipClock.Digit({ cls: 'time right_2', transition_duration: 850 });
    this.items = [this.left1, this.left2, this.right1, this.right2];
  },
  update: function() {
    var targetMs = this.date.getTime(),
        nowMs = Date.now(),
        differenceMs = targetMs - nowMs;

    if (differenceMs <= 0) {
      differenceMs = 0;
      this.done = true;
    }

    var hours = Math.floor(differenceMs / 3600000);
    differenceMs %= 3600000;
    var minutes = Math.floor(differenceMs / 60000);
    differenceMs %= 60000;
    var seconds = Math.floor(differenceMs / 1000);

    var h_tens = Math.floor(hours / 10), h_ones = hours % 10;
    var m_tens = Math.floor(minutes / 10), m_ones = minutes % 10;
    var s_tens = Math.floor(seconds / 10), s_ones = seconds % 10;

    // Dynamic unit shifting:
    if (hours > 0) {
      this.left1.flip(h_tens);
      this.left2.flip(h_ones);
      this.right1.flip(m_tens);
      this.right2.flip(m_ones);
    } else {
      // When hours == 0, left is minutes and right is seconds!
      this.left1.flip(m_tens);
      this.left2.flip(m_ones);
      this.right1.flip(s_tens);
      this.right2.flip(s_ones);
    }
  }
};
```

### 5.3 Flip Lifecycle & Animation Synchronization (`FlipClock.Digit.prototype.flip`)
```javascript
FlipClock.Digit.prototype.flip = function(number) {
  var digit = this,
      tile = this.tile,
      from = tile.attr("number"),
      transition_duration = this.params.transition_duration || 1000;

  if (number == from) return;

  tile.attr("from", from);
  tile.attr("number", number);

  // 1. Reveal the new number on the stationary top half behind the falling flap
  digit.$back_top.html(number);

  // 2. Set the new number on the back of the falling flap
  $(".inner", digit.$active_bottom).html(number);

  // 3. Trigger 3D rotation
  $(".active", tile).addClass("transform").addClass("flipped");

  // 4. Clean up after CSS transition ends (850ms)
  setTimeout(function() {
    digit.$active_top.html(number);
    $(".inner", digit.$back_bottom).html(number);

    // Instant reset without transition:
    $(".active", tile).removeClass("transform").removeClass("flipped");
  }, transition_duration);
};
```

#### Timeline for a 1-Second Tick:
```
t = 0ms     : Tick fires. flip(number) called.
              - Static back_top updated to new value.
              - Flipping active_bottom updated to new value.
              - Classes 'transform' and 'flipped' added.
              - CSS transition begins: rotateX(-180deg) over 750ms ease.
t = 250ms   : Chrome transition delay threshold passed; back flap opacity set to 1.
t = 375ms   : Flap reaches -90deg (edge-on to viewer, perpendicular).
              Front flap rotates out of view; back flap rotates into view.
t = 750ms   : CSS transition finishes. Flap rests at -180deg (flat bottom).
t = 850ms   : JS setTimeout fires (850ms).
              - Static back_bottom and active_top updated to new number.
              - Classes 'transform' and 'flipped' removed simultaneously.
              - Rotation snaps back from -180deg to 0deg with 0s duration (invisible to user).
t = 1000ms  : Next clock tick occurs cleanly.
```

---

## 6. Typography & Responsive Design

### 6.1 Typography (`css/font/font.css`)
- **Default Font:** `franchiseregular` (Franchise Bold).
  - Embedded as Base64 WOFF directly in `font.css`.
  - Properties: `font-size: 320px; line-height: 310px; font-family: 'franchiseregular'; text-align: center;`.
  - Tall, compressed condensed sans-serif with bold geometry, optimal for rectangular split flaps.
- **Secondary Font:** `sahararegular` (Sahara).
  - Properties: `font-size: 279px; text-indent: 10px;`.
- **System Fallback:** `liberation_sansbold`.

### 6.2 Responsive Layout & Scaling (`css/app.css`)
1. **Container Dimensions:**
   ```css
   .time_box, .countdown_box {
     position: absolute;
     width: 94%;
     height: 100%;
     max-height: 300px;
     max-width: 950px;
     margin: auto;
   }
   ```
2. **Digit Positioning (Desktop 1x4 horizontal):**
   - Left 1 (tens): `left: 7%;`
   - Left 2 (ones): `left: 28%;`
   - Right 1 (tens): `left: 52%;`
   - Right 2 (ones): `left: 73%;`
   - Centering is achieved dynamically in JavaScript via `center(element)` which sets explicit `top` and `left` pixel styles based on `window_width` and `window_height`.
3. **Tablet / Medium Screens (`@media (max-width: 800px), (max-height: 300px)`):**
   - Container scaled to `max-width: 480px; max-height: 150px;`.
   - Digits scaled to `max-width: 95px; font-size: 150px; line-height: 150px;`.
   - Card border radiuses reduced from 10px to 5px.
4. **Mobile Screens (`@media (max-width: 400px)`):**
   - Switches to a **2x2 stacked matrix layout**:
     - Left 1 & 2 (top row): `top: -2%; left: 21% / 52%;`
     - Right 1 & 2 (bottom row): `top: 52%; left: 21% / 52%;`
     - Allows digits to remain legible and large even on narrow 320px–390px mobile viewports.

---

## 7. Clean-Room Implementation Specification for React

To incorporate the elegance and robustness of FlipClock.us into a modern React application (such as Focus & Ambient Studio) **without copying proprietary code or assets**:

### 7.1 React State Model
Instead of manual DOM manipulation with jQuery, a declarative React component can manage the flip cycle using an internal state machine:

```typescript
interface FlipDigitProps {
  digit: string | number;
  label?: string;
}

interface FlipState {
  current: string | number;
  previous: string | number;
  isFlipping: boolean;
}
```

### 7.2 Key Architectural Takeaways for React
1. **Full-Card Rotation vs Half-Flap Rotation:**
   - *FlipClock.us Pattern:* Rotates a full-height card around `transform-origin: 50% 50%`. The front face contains the top half; the back face contains the bottom half pre-rotated by 180deg.
   - *Advantage:* A single CSS transition (`rotateX(-180deg)`) handles the entire flip motion without needing two coordinated animations.
2. **Inner Container Clipping:**
   - Upper half: `height: 50%; overflow: hidden;` containing unshifted text.
   - Lower half: `height: 50%; overflow: hidden;` containing an inner div with `transform: translateY(-50%)` or `top: -100%`.
3. **Timing Harmony:**
   - Animation duration: `700ms`–`750ms`.
   - State transition / cleanup: `800ms`–`850ms`.
   - Clock tick: `1000ms`.
   - This prevents race conditions where rapid state updates interrupt in-flight flips.
4. **Dynamic Countdown Unit Switch:**
   - Automatically display `HH : MM` when hours > 0, and smoothly transition to `MM : SS` when hours == 0.
5. **Stacking on Mobile:**
   - On narrow mobile viewports (< 480px), stacking HH on top and MM on bottom (or MM on top, SS on bottom) maintains massive digit legibility without horizontal clipping.

---

## 8. Compliance & Constraint Audit

- [x] **Read-Only Access:** All inspection operations were performed strictly via read-only HTTP GET requests to publicly available endpoints.
- [x] **No Access Control Bypass:** No headers were spoofed, and no authentication or rate limits were bypassed.
- [x] **No Proprietary Code Copied:** No source code, CSS, or font files from FlipClock.us were injected or copied into the Focus & Ambient Studio codebase (`src/`).
- [x] **No Modification to Application:** The local Git repository working tree for Focus & Ambient Studio remains on commit `026bd0b` on branch `master` with no untracked application changes.
- [x] **Asset Isolation:** All downloaded files and extracted sources are strictly confined to `reference-research/flipclock-us/`.

---
*Report generated and verified against local reference archive in `reference-research/flipclock-us/`.*
