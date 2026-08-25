# DESIGN-PRINCIPLES.md

## 1. Design Direction

The application follows a **Hand-Drawn Productivity / Digital Sketchbook** design direction.

It combines the warmth and personality of a personal handwritten notebook with the clarity, structure, and reliability of a modern productivity application.

The interface should feel:

- **Human:** Natural lines, subtle organic tilts, ink-strike completion effects.
- **Warm:** Warm paper canvas (`#FBF9F4`), muted notebook highlighter accents.
- **Calm & Encouraging:** Clear tactile buttons, zero stressful visual noise.
- **Dependable:** Fast response, offline-first sync, crisp type hierarchy.

---

## 2. Core Design Principles

1. **Clarity First:** Every visual decision must preserve or improve clarity. Task readability and interaction speed always override decoration.
2. **Handcrafted, Not Chaotic:** Imperfections must be intentional and mathematically constrained (bounded rotation: `-1deg` to `+1deg`, consistent `1.5px` ink borders).
3. **Mobile Ergonomics & Bottom Sheet:** Modals on mobile slide naturally from the bottom as warm sheets with rounded tops (`rounded-t-[22px]`) and tactile grab handles.
4. **Progressive Disclosure:** Simple by default, powerful when needed. Advanced filtering options remain neatly tucked away in an expandable command drawer.
5. **Zero-Flash Startup (0ms Splash):** App must load instantly with no 1-second white flashes using embedded root splash placeholders and native Android 12+ SplashScreen API.
6. **Tactile Feedback:** Every clickable button, card, and checkbox responds physically with a 1.5px offset press and hard shadow collapse.
7. **Single Source of Truth:** Versions, tokens, and data contracts are defined centrally to avoid divergent implementations.

---

## 3. Visual Language & Tiered Application

To maintain peak usability and aesthetic coherence, UI elements belong to 3 strict tiers:

- **Tier 1 - Core UI (Minimal Hand-Drawn):**
  - *Target:* Input fields, data tables, main task rows, calendar grids, search bars.
  - *Rules:* Straight structural lines, `1.5px` ink border (`#262626`), `rotate-0`, radius `4px–6px`, high contrast and optimal legibility.
- **Tier 2 - Expressive Elements (Moderate Hand-Drawn):**
  - *Target:* Task cards, sticky notes, priority badges, bottom sheets, filter drawers.
  - *Rules:* Bounded tilt (`-1deg` to `+1deg`), hard offset shadow (`shadow-[2px_2px_0px_#262626]`), ink-pressed active state.
- **Tier 3 - Decorations & Accents (High Hand-Drawn):**
  - *Target:* Empty state doodles, ink strike-through lines, highlighter underlines, habit streak badges.
  - *Rules:* Placed strictly outside dense interaction zones.

---

## 4. Typography Hierarchy

- **UI / Body Text:** Clean sans-serif (Inter / Plus Jakarta Sans) for task titles, forms, and tables.
- **Code / Time / Dates:** Crisp Monospace (`font-mono`) for exact deadlines, time pickers, and version badges.
- **Handwritten Accent:** Script font (`--font-hand` - Caveat / Patrick Hand) restricted to Sticky Notes, personal reflections, and small micro-copy tags.

---

## 5. Negative Constraints (Anti-Slop Directives)

- ❌ Never use generic AI gradients (`from-purple-500 to-indigo-500`).
- ❌ Never use soft Gaussian blur shadows (`shadow-xl`). Always use **Hard Offset Shadows** (`shadow-[2px_2px_0px_#262626]`).
- ❌ Never rotate inputs, tables, scrollable containers, or calendar matrices.
- ❌ Never display desktop-only shortcut hints (e.g., "Press ESC to close") on mobile screens.
