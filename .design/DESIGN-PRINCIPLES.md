# DESIGN-PRINCIPLES.md

## 1. Design Direction

The application follows a **Hand-Drawn Productivity / Digital Sketchbook** design direction.

It combines the warmth and personality of a personal handwritten notebook with the clarity, structure, and reliability of a modern productivity application.

The interface should feel:

- Human
- Warm
- Playful
- Creative
- Organized
- Personal

The design should feel handcrafted, not chaotic.

Hand-drawn elements are used as a visual language, not as a replacement for usability, structure, or clarity.

---

## 2. Product Personality

The product should feel like a thoughtful personal companion rather than a strict productivity manager.

Its personality is:

- Friendly
- Calm
- Encouraging
- Playful
- Thoughtful

### Personality Principles

- The app should guide, not command.
- The app should encourage, not pressure.
- The app should inform, not overwhelm.
- The app should be playful without becoming distracting.
- The app should acknowledge progress without excessive praise.
- The app should communicate clearly and naturally.

Personality should enhance the experience, never obstruct it.

- The interface may be expressive, but important information must always remain clear.
- The interface may be playful, but it should never become noisy.
- The app may encourage the user, but it should never create guilt or pressure.

---

## 3. Core Design Principles

1. **Clarity First:** Every visual decision must preserve or improve clarity. Task readability and interaction speed always override decoration.
2. **Handcrafted, Not Chaotic:** Imperfections must be intentional and mathematically constrained (bounded rotation, consistent stroke width).
3. **Information Hierarchy:** Distinct visual weights for Primary (Task Name), Secondary (Due Date/Status), and Tertiary (Metadata/Tags).
4. **Whitespace Is Functional:** Whitespace acts as breathing room to reduce cognitive load and simulate a clean notebook page.
5. **Progressive Disclosure:** Simple by default, powerful when needed. Secondary options remain tucked away until requested.
6. **Functional Decoration:** Scribbles, doodles, and highlighters must direct attention or communicate status, never exist merely as noise.
7. **Consistency Over Novelty:** Reuse existing component patterns before inventing new visual formats.

### Guiding Principle

The product should feel like a beautifully organized personal notebook: expressive enough to feel human, structured enough to be dependable, and quiet enough to let the user's work remain the focus.

---

## 4. Visual Language & Tiered Application

To maintain usability, hand-drawn styles are categorized into 3 strict tiers:

- **Tier 1 - Core UI (Minimal Hand-Drawn):**
  - Target: Input fields, data tables, main task rows, calendar grids.
  - Rules: Straight structural lines, 1px-1.5px ink border, static border-radius (4px–6px), maximum contrast and legibility.
- **Tier 2 - Expressive Elements (Moderate Hand-Drawn):**
  - Target: Task cards, sticky notes, tags, modals, badges.
  - Rules: Subtle organic borders (`rough border`), bounded rotation (`-1deg` to `+1deg`), hard offset shadow (`2px 2px 0px #000`).
- **Tier 3 - Decorations & Accents (High Hand-Drawn):**
  - Target: Empty state illustrations, highlighter strokes, scribble underlines, corner tape.
  - Rules: Used strictly outside dense interactive areas.

### Typography

- **UI / Body Text:** Clean sans-serif (Inter, Geist, or Plus Jakarta Sans).
- **Headings:** Solid structured sans-serif or modern serif.
- **Handwritten Accent:** Legible script font (Caveat or Patrick Hand) — restricted to short notes, sticky annotations, and small micro-copy.

---

## 5. Information Hierarchy

- **3-Second Scan:** A card must be readable top-to-bottom: Title -> Timing/State -> Context/Tag.
- **Color Balance (80/20):** 80% neutral paper canvas (Cream/Off-white or Dark Slate) and ink; 20% accent colors (highlighter yellow, ink blue, muted amber/red).
- **Visual Weight Control:** Primary actions must use solid fill or distinct border; secondary actions use outlines or subtle text buttons.

---

## 6. Intentional Imperfection

- **Rotation Constraints:** Text blocks and scrollable lists MUST stay at `0deg`. Container elements may only pick from fixed sets: `[-1deg, -0.5deg, 0deg, 0.5deg, 1deg]`.
- **Predictable Radius:** Asymmetric border-radius must follow uniform CSS variable tokens, not random inline styles.
- **Hard Shadows:** Use sharp offset shadows (`box-shadow: Xpx Ypx 0px #000`) instead of Gaussian blur to replicate physical layered paper.

---

## 7. Usability Over Decoration

- **Tactile Feedback:** Interactive elements must press down on click/tap (`active: translate(2px, 2px)` with shadow reset).
- **State Completeness:** Every interactive component must define 6 states: Default, Hover, Active/Focus, Disabled, Empty, Error.
- **Accessibility:** Minimum contrast ratio must meet WCAG AA (4.5:1 for body text) across both Light and Dark themes.

---

## 8. Cross-Platform Philosophy

- **Mobile:** Reduce expressive decoration. Prioritize touch targets (minimum 44x44px), single-column flow, and fast entry sheets.
- **Desktop:** Expand canvas to an open notebook spread. Support keyboard shortcuts, drag-and-drop interactions, and multi-panel split views (Sidebar, Board, Detail Inspector).
