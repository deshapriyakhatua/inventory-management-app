# Frontend Redesign Plan

Status: DRAFT for approval. Scope: **frontend/UI only**. Source of design principles: [design.md](design.md) (Apple design, translated for web).

---

## 0. How an AI agent must use this document

1. Read sections 1–5 fully before touching code. They are the rules.
2. Pick the lowest-numbered task whose status is `[ ]` and whose dependencies are `[x]`.
3. Do only that task. Do not "improve" unrelated things.
4. Before marking `[x]`, verify every checkbox in the task's **Acceptance** list and run the commands in section 9.
5. If a rule here conflicts with what you see in code, the rule wins. If a rule is missing, STOP and add an entry to section 11 (Open Decisions) instead of guessing.

### Hard boundaries (never do)
- Do not change anything under `app/api/**`, `models/**`, `lib/**` (except `lib/motion.js`, which is new), `utils/**`, `proxy.js`, `.env`.
- Do not change request/response shapes, state logic, validation, calculations, routes, or permissions.
- Do not rename routes or move pages.
- Do not add dependencies other than `motion` (see D-1).
- Do not convert to TypeScript or Tailwind.
- Do not touch invoice/PDF output visuals (see section 8).

---

## 1. Decisions already made (confirmed by owner)

| ID | Decision | Value |
|----|----------|-------|
| D-1 | Motion library | Add `motion` (the Framer Motion successor, import from `motion/react`). Springs for gesture/overlay motion. CSS for hover/press/color. |
| D-2 | Theme | Light + dark through semantic CSS tokens. Follows `prefers-color-scheme`, overridable with `data-theme="light\|dark"` on `<html>`. |
| D-3 | Architecture | Shared primitives in `components/ui/*` + token file. Keep CSS Modules. No new styling tech. |
| D-4 | Large pages | Restyle **and** split into folder-local sub-components. Logic/state/API calls stay as they are (moved, not rewritten). |

---

## 2. Current state (audit facts)

| Area | Finding | Evidence |
|------|---------|----------|
| Stack | Next.js 16 App Router, React 19, plain JS, CSS Modules, React Compiler on | `package.json`, `next.config.mjs` |
| Tokens | Only `--background`, `--foreground` exist | `app/globals.css` |
| Colors | 99 distinct hex values hard-coded across 28 CSS files. Top: `#334155` ×220, `#3b82f6` ×133, `#94a3b8` ×129, `#1e293b` ×112, `#0f172a` ×101 | grep |
| Theme | Dark slate hard-coded on every page. `prefers-color-scheme` only flips `--background`, which most pages ignore (they set `#0f172a` directly) | page CSS |
| Duplication | All 27 page/component CSS files re-declare container, card, button, input, modal, table, badge, spinner, header, title classes. `@keyframes spin` defined 18×, `fadeIn` ×9+ | grep |
| Typography | 4+ font stacks (Geist var, Inter, Segoe UI, system-ui, Arial on `body`). 20+ font sizes mixing px and rem. Fixed tracking | grep |
| Radius/shadow | Radii: 4/5/6/7/8/10/12/14/16/20px. 184 `box-shadow` declarations, none tokenized | grep |
| Motion | `transition: all 0.2s` ×77, `all 0.2s ease` ×59. One cubic-bezier. No springs. No `prefers-reduced-motion`/`transparency`/`contrast` queries anywhere | grep |
| Responsiveness | Sidebar has no mobile breakpoint (fixed 72/260px). Breakpoints inconsistent: 640/700/768/900/960/1024 | `Sidebar.module.css` |
| Inline styles | 191 `style={{}}` in pages. Worst: create-b2b-invoice 46, purchase-history 29, all-invoices 26, add-listing 19 | grep |
| Icons | 257 inline `<svg>` blocks copy-pasted. Same icon redefined in Sidebar and dashboard | grep |
| Feedback | Two systems: `sonner` (8 files) + custom `components/Toast` (10 files) | grep |
| Layout | `LayoutContent.js` and `app/layout.js` use inline styles. Body is `display:flex; overflow:hidden` | files |
| `!important` | Present in 12 CSS files (invoice preview 13, create-b2b-invoice 9, globals 7, custom-qr 7) | grep |
| Gradient text | Used for page titles (`app/page.module.css`, login/register) | CSS |
| Dead route | `DEFAULT_LOGIN_REDIRECT = '/dashboard'` but `app/dashboard` does not exist (dashboard is `app/page.js`). Report, do not fix (non-UI) | `lib/routes.js` |

### Page inventory (lines JS / CSS) and complexity

| Route | File | JS | CSS | Tier |
|-------|------|----|-----|------|
| `/login` | `app/login/page.js` | 119 | 159 | S |
| `/register` | `app/register/page.js` | 163 | 150 | S |
| `/` (dashboard) | `app/page.js` | 579 | 496 | M |
| `/add-inventory` | `app/add-inventory/page.js` | 456 | 476 | M |
| `/all-inventory` | `app/all-inventory/page.js` | 1058 | 1164 | L |
| `/add-listing` | `app/add-listing/page.js` | 644 | 624 | M |
| `/all-listings` | `app/all-listings/page.js` | 1172 | 1451 | L |
| `/add-purchase` | `app/add-purchase/page.js` | 707 | 782 | M |
| `/purchase-history` | `app/purchase-history/page.js` | 1556 | 1144 | XL |
| `/add-sales-log` | `app/add-sales-log/page.js` | 902 | 1152 | L |
| `/upload-sales-log` | `app/upload-sales-log/page.js` | 349 | 311 | M |
| `/sales-records` | `components/SalesRecordsView` | 567 | 597 | M |
| `/pl-summary` | `app/pl-summary/page.js` | 222 | 266 | S |
| `/create-b2b-invoice` | `app/create-b2b-invoice/page.js` | 1978 | 1563 | XL |
| `/all-invoices` | `app/all-invoices/page.js` | 1802 | 907 | XL |
| `/all-sellers` | `app/all-sellers/page.js` | 767 | 875 | L |
| `/add-seller` | `app/add-seller/page.js` | 259 | 263 | S |
| `/map-sources` | `app/map-sources/page.js` | 368 | 426 | M |
| `/custom-qr` | `app/custom-qr/page.js` | 301 | 329 | M |
| `/admin/add-vertical` | `app/admin/add-vertical/page.js` | 160 | 182 | S |
| `/admin/dashboard`, `/super-admin/dashboard` | `page.jsx` | 8 | – | stub, restyle shell only |

Shared components: `Sidebar`, `ConfirmModal`, `PaymentQrModal`, `InvoicePdfPreview`, `SalesRecordsView`, `SmoothImage`, `Toast`, `RefreshIcon`, `MarketplaceLogo`, `AuthProvider`, `LayoutContent`.

---

## 3. Target architecture and structure

```
styles/
  tokens.css            # ALL design tokens (light default + dark override)
  base.css              # reset, body, typography defaults, focus ring, scrollbars, reduced-* media queries
lib/
  motion.js             # NEW. Spring presets + helpers (only allowed new file in lib/)
components/
  ui/                   # NEW. Presentation primitives, no business logic
    Button/Button.js + Button.module.css
    IconButton/
    Input/  Select/  Textarea/  Checkbox/  FormField/
    Card/
    Badge/
    Spinner/
    Modal/              # centered dialog, scrim, spring scale-in
    Sheet/              # edge-anchored sheet/drawer, drag-to-dismiss
    Table/              # DataTable shell: sticky header, scroll-edge, empty/loading slots
    PageShell/          # page wrapper: max-width, padding, vertical rhythm
    PageHeader/         # title, subtitle, actions slot
    EmptyState/
    Skeleton/
    Tabs/ SegmentedControl/
    Icon/Icon.js        # single icon registry, one <svg> wrapper
    index.js            # barrel export
  Sidebar/ ConfirmModal/ ...   # existing, refactored in place to use ui/*
app/<route>/
  page.js               # thin: data/state orchestration + composes sub-components
  page.module.css       # ONLY page-specific layout. No re-declared primitives
  _components/          # NEW per large page. Folder-local sub-components (underscore = not routable)
    <Name>/<Name>.js + <Name>.module.css
```

Rules:
- A primitive lives in `components/ui` only if used (or clearly will be used) by 2+ pages. Otherwise it stays in that page's `_components/`.
- `components/ui/*` must not import from `app/**`, `lib/session.js`, or call `fetch`.
- Imports use the `@/` alias (configured in `jsconfig.json`). No `../../../`.

---

## 4. Naming and writing conventions (mandatory)

### 4.1 Files and folders
| Thing | Convention | Example |
|-------|-----------|---------|
| Component folder | PascalCase, 1 component per folder | `components/ui/Button/` |
| Component file | `PascalCase.js` (`.jsx` only if file already `.jsx`) | `Button.js` |
| Style file | `PascalCase.module.css`, same folder, same name. Page styles stay `page.module.css` | `Button.module.css` |
| Hook | `useCamelCase.js` in `hooks/` | `hooks/useMediaQuery.js` |
| Page-local components | `app/<route>/_components/<Name>/` | `app/all-invoices/_components/InvoiceRow/` |
| Token / base CSS | lowercase in `styles/` | `styles/tokens.css` |

### 4.2 CSS class names (CSS Modules)
- camelCase, noun-first, no BEM `__`/`--`. Root element class is `root`. Examples: `root`, `header`, `rowActive`, `cellMuted`.
- Variants/states are modifier classes toggled in JS: `.primary`, `.sizeSm`, `.isDisabled`, `.isOpen`. Never encode values in names (`.blue`, `.mt16` are forbidden).
- One selector level of nesting max. Use `data-*` attributes for state when set by libraries.
- Component CSS may only reference tokens (`var(--…)`). No raw hex, rgb(), or px color/shadow/radius literals (see 4.5).
- No `!important`. If needed to beat a lib style, increase specificity and note why in a comment. Exception list: none.
- No inline `style={{}}` except for **dynamic runtime values** (e.g. chart width %, dragged `y` via motion values). Static styling must be CSS.

### 4.3 Token names (all in `styles/tokens.css`)
Pattern: `--{category}-{role}[-{variant}]`. Semantic only: never name by color.

| Category | Tokens |
|----------|--------|
| Surface | `--color-bg`, `--color-surface`, `--color-surface-raised`, `--color-surface-sunken`, `--color-overlay-scrim` |
| Material | `--material-thin`, `--material-regular`, `--material-thick` (translucent bg), `--blur-thin/regular/thick` |
| Text | `--color-text`, `--color-text-muted`, `--color-text-subtle`, `--color-text-inverse`, `--color-text-on-accent` |
| Border | `--color-border`, `--color-border-strong`, `--color-border-focus` |
| Brand | `--color-accent`, `--color-accent-hover`, `--color-accent-pressed`, `--color-accent-subtle` (tinted bg) |
| Status | `--color-success`, `--color-warning`, `--color-danger`, `--color-info`, each with `-subtle` and `-border` |
| Space | `--space-1`…`--space-12` on 4px scale: 4,8,12,16,20,24,32,40,48,64,80,96 |
| Radius | `--radius-xs`(4) `-sm`(8) `-md`(12) `-lg`(16) `-xl`(24) `-pill`(9999) |
| Shadow | `--shadow-xs/sm/md/lg/xl` (theme-aware) |
| Type size | `--text-2xs`(11) `-xs`(12) `-sm`(13) `-md`(14) `-lg`(16) `-xl`(18) `-2xl`(22) `-3xl`(28) `-4xl`(36) as `rem` |
| Type tracking | `--tracking-tight`(-0.02em) `-snug`(-0.01em) `-normal`(0) `-wide`(0.01em) `-caps`(0.06em) |
| Leading | `--leading-tight`(1.1) `-snug`(1.3) `-normal`(1.5) |
| Weight | `--weight-regular`(400) `-medium`(500) `-semibold`(600) `-bold`(700) |
| Font | `--font-sans`, `--font-mono` |
| Motion | `--duration-instant`(100ms) `-fast`(150ms) `-base`(200ms) `-slow`(300ms); `--ease-out`, `--ease-in-out`, `--ease-emphasized` |
| Layer | `--z-sticky`(100) `--z-sidebar`(200) `--z-overlay`(1000) `--z-modal`(1100) `--z-toast`(1200) |
| Layout | `--sidebar-w-expanded`(260px) `--sidebar-w-collapsed`(72px) `--page-max-w`(1400px) `--control-h-sm/md/lg`(32/40/48px) |

### 4.4 Component API conventions
- Function components, default export, one per file. Props destructured with defaults.
- Variant props are strings from fixed sets: `variant="primary|secondary|ghost|danger"`, `size="sm|md|lg"`.
- Forward `className` (merged last), `...rest`, and `ref` (React 19 ref-as-prop).
- Interactive primitives render real elements (`button`, `a`/`Link`, `input`). Never `div onClick`.
- Every icon-only control has `aria-label`. Every input has an associated `<label>` (via `FormField`).
- Add `"use client"` only where hooks/events/motion are used.
- Class merging: tiny helper `cx(...classes)` in `components/ui/cx.js` (filters falsy, joins with space). No new dependency.
- Comment density: match existing code (sparse; comment only non-obvious "why").

### 4.5 Forbidden patterns (grep-checkable, see section 9)
- Hex/rgb/hsl color literals outside `styles/tokens.css` (and the explicit print exception in section 8).
- `transition: all`. List properties explicitly (`transition: background-color var(--duration-fast) var(--ease-out), transform …`).
- `@keyframes` redefinition in component CSS for `spin` / `fadeIn` (use shared ones in `base.css`).
- Raw `<svg>` in page files (use `<Icon name="…" />`).
- `font-family` anywhere except `base.css` and tokens.
- Media queries with arbitrary widths. Allowed breakpoints only: `640px`, `768px`, `1024px`, `1280px` (mobile-first `min-width`).
- Gradient text (`-webkit-text-fill-color: transparent`) for titles.
- Fixed `px` font sizes. Use `--text-*` (rem).

---

## 5. Design rules mapped from design.md (apply everywhere)

| # | Rule (design.md §) | Implementation requirement |
|---|--------------------|----------------------------|
| R1 | Instant press feedback (§1) | Every `Button`/`IconButton`/row-action: `:active { transform: scale(0.97) }`, 100ms. Triggered on pointer-down, not click. |
| R2 | Defaults: critically-damped springs (§4) | `lib/motion.js` exports `spring.default = {type:"spring", bounce:0, duration:0.4}`, `spring.sheet = {bounce:0.2, duration:0.3}` (bounce only if a drag/flick preceded), `spring.snappy = {bounce:0, duration:0.3}`. |
| R3 | Interruptible (§3) | Modal/Sheet/Sidebar animate via `motion`, never CSS keyframes for enter/exit. Never block input during transition. |
| R4 | Symmetric enter/exit + origin (§7) | Exit animation = reverse of enter on the same axis. Popovers/menus set `transform-origin` from trigger. |
| R5 | Materials (§12) | Sidebar, sticky page headers, Modal scrim use `--material-*` + `backdrop-filter`. Never stack two translucent layers. Large surfaces use thicker blur + `--shadow-lg`. |
| R6 | Scroll-edge effect (§12) | Sticky headers/table headers: remove 1px divider; use fade/blur mask only when content is scrolled beneath. |
| R7 | Materialize (§12) | Overlays animate blur + scale + opacity together on enter/exit. |
| R8 | Reduced motion/transparency/contrast (§14) | `base.css` + each overlay component handle all three media queries (see T-0.2, T-1.x acceptance). |
| R9 | Typography (§15) | `--font-sans` = system stack (`system-ui, -apple-system, …`) with `font-optical-sizing:auto`. Headings use negative tracking + tight leading; body tracking 0, leading 1.5. Spacing and sizes in `rem`. |
| R10 | Feedback kinds (§16) | Exactly four: status (Spinner/Skeleton), completion (toast success), warning, error (inline field error + toast). Validate inline, not only on submit. |
| R11 | Wayfinding / grouping (§16) | Every page: `PageHeader` (title + subtitle + actions), active nav item, breadcrumb-free. Controls sit next to what they affect. |
| R12 | Agency / forgiveness (§16) | `ConfirmModal` only for irreversible actions (delete, archive-permanent). Other actions get Undo via toast action where logic already supports it (UI wiring only). |
| R13 | Restraint (§16.6) | Remove decorative gradients and gradient text. One accent color. Max 2 font weights per view region. |
| R14 | Direct, specific labels (§16) | Keep existing nav labels unless unclear. Any copy change must be listed in the task and approved. Default: no copy changes. |
| R15 | Compositor-only animation (§11) | Animate only `transform` and `opacity` (plus blur on materializing surfaces). Never animate width/height/top/left. Sidebar width change uses `motion` layout or a `transform` approach. |

---

## 6. Token migration map (current → token)

Agents use this table when replacing hard-coded values. Light values are specified in T-0.1; the dark column equals the **current** look so dark mode is visually unchanged.

| Current hex | Role | Token |
|-------------|------|-------|
| `#0f172a` | page bg | `--color-bg` |
| `#1e293b` | card/surface | `--color-surface` |
| `#0f172a` inside card (input bg) | sunken | `--color-surface-sunken` |
| `#334155` | border / secondary button | `--color-border` / `--color-surface-raised` |
| `#475569`, `#64748b` | subtle text / strong border | `--color-text-subtle` / `--color-border-strong` |
| `#94a3b8`, `#cbd5e1` | muted text | `--color-text-muted` |
| `#f8fafc`, `#f1f5f9`, `#e2e8f0` | text | `--color-text` |
| `#38bdf8`, `#3b82f6`, `#60a5fa`, `#2563eb` | accent family | `--color-accent` (+ `-hover`/`-pressed`/`-subtle`). **Pick one** accent (D-5 in section 11) |
| `#10b981`, `#34d399`, `#059669` | success | `--color-success*` |
| `#ef4444`, `#f87171`, `#dc2626` | danger | `--color-danger*` |
| `#f59e0b`, `#fbbf24` | warning | `--color-warning*` |
| `#ec4899`, `#8b5cf6`, `#6366f1`, `#f97316` | chart/category | `--chart-1`…`--chart-6` |
| `rgba(0,0,0,.75)` modal scrim | scrim | `--color-overlay-scrim` |
| `#fff`, `#000` | context-dependent | text-inverse / shadow / print exception |

---

## 7. Task list

Legend: `[ ]` todo, `[x]` done. Size: S ≤ 0.5d, M ≈ 1d, L ≈ 2d. **Dep** = must be done first. Each task = one PR/commit.

### PHASE 0 — Foundations (no visual change to pages yet)

- [x] **T-0.1 Create design tokens** · M · Dep: none
  - Files: `styles/tokens.css` (new)
  - Subtasks:
    1. Define every token in section 4.3 under `:root` (light values).
    2. Add `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { … } }` and `:root[data-theme="dark"] { … }` with identical dark values (dark = today's slate look per section 6).
    3. Light palette: bg `#ffffff`/`#f5f5f7`, text `#1d1d1f`, muted `#6e6e73`, border `rgba(0,0,0,.1)`, accent `#0071e3` (final value subject to D-5).
    4. Shadows: define separately for light (soft, low alpha) and dark (higher alpha).
    5. `@media (prefers-contrast: more)`: raise border/text contrast tokens.
    6. `@media (prefers-reduced-transparency: reduce)`: set `--material-*` to opaque `--color-surface`, `--blur-*: 0px`.
  - Acceptance: file contains all sections-4.3 tokens; hex literals exist only in this file; WCAG AA (4.5:1) verified for `text`/`text-muted` on `bg` and `surface` in both themes (list ratios in PR description).

- [x] **T-0.2 Base stylesheet + font** · M · Dep: T-0.1
  - Files: `styles/base.css` (new), `app/globals.css`, `app/layout.js`
  - Subtasks:
    1. Move reset, `a`, number-input spinner hiding, scrollbar styling, and `@media print` block from `globals.css` into `base.css` (keep print rules byte-identical in behavior).
    2. `body`: `font-family: var(--font-sans)`, `font-size: var(--text-md)`, `line-height: var(--leading-normal)`, `background: var(--color-bg)`, `color: var(--color-text)`, `font-optical-sizing: auto`.
    3. Remove Geist `next/font` imports from `layout.js` (system font per R9). Remove `--font-geist-*` usages in CSS as pages migrate. Keep Geist Mono only if D-6 says so.
    4. Remove inline `style` from `<body>` in `layout.js`; move to `base.css` class/selectors.
    5. Global `:focus-visible` ring using `--color-border-focus`, 2px, offset 2px.
    6. Heading defaults: `h1–h4` use `--tracking-tight`, `--leading-tight`.
    7. Shared keyframes, defined once: `spin`, `fadeIn`. Utility class `.srOnly` (global).
    8. `@media (prefers-reduced-motion: reduce)`: set `animation-duration/transition-duration: 0.01ms !important` for decorative motion only (single allowed `!important`, documented).
    9. `globals.css` becomes only: `@import` of tokens and base.
  - Acceptance: app renders; every page still loads; `grep -n "!important" styles/base.css` ≤ 1 line (reduced-motion); no page visually regresses in dark (screenshot compare optional).

- [x] **T-0.3 Install `motion` + motion presets** · S · Dep: none
  - Files: `package.json`, `lib/motion.js` (new)
  - Subtasks:
    1. `npm i motion`.
    2. `lib/motion.js` exports: `spring` presets (R2), `fade`, `scaleIn`, `slideFrom(edge)` variants, and `useMotionPreference()` which returns reduced-motion-aware transitions (reduced → `{duration:0.15}` opacity-only, no transform).
    3. Document each preset in a one-line comment (when to use).
  - Acceptance: importing `lib/motion.js` in a client component works; no SSR errors; reduced-motion returns opacity-only variants.

- [x] **T-0.4 Icon registry** · M · Dep: none
  - Files: `components/ui/Icon/Icon.js` (+ `icons.js` map)
  - Subtasks:
    1. Extract every distinct `<svg>` from `Sidebar.js`, `app/page.js`, `RefreshIcon`, and page files into `icons.js` keyed by kebab-case name (`plus`, `box`, `file-text`, `cart`, `bar-chart`, `dollar`, `refresh`, `logout`, `download`, `qr`, …).
    2. `<Icon name size={20} />`: `stroke="currentColor"`, `strokeWidth=1.75`, `aria-hidden` unless `title` prop given.
    3. De-duplicate: same shape = one entry.
    4. Replace `RefreshIcon` with `<Icon name="refresh" />`; delete `RefreshIcon` folder when no references remain.
  - Acceptance: `grep -rn "<svg" app components --include='*.js' --include='*.jsx'` returns matches only in `components/ui/Icon/` and `MarketplaceLogo` (brand logos stay) .

- [x] **T-0.5 Lint/guard script** · S · Dep: T-0.1
  - Files: `scripts/check-ui.sh` (new), `package.json` script `"check:ui"`
  - Subtasks: implement the grep checks from section 9 as a script that exits non-zero on violation. Allow-list files for known exceptions (section 8).
  - Acceptance: script runs; currently fails (baseline) and the failure count is recorded in the PR; becomes green at T-6.1.
  - Baseline recorded 2026-10-04: 2,455 findings (2,066 colors, 161 `transition: all`, 38 `!important`, 184 static inline styles, 6 breakpoints, 0 raw SVG outside allow-listed files).

### PHASE 1 — UI primitives (`components/ui/*`)

Each primitive task includes the same Definition of Done (**DoD-P**):
- Uses only tokens; supports light + dark; has `:hover`, `:active`, `:focus-visible`, `:disabled` states.
- Handles `prefers-reduced-motion`, `-transparency`, `-contrast` where it animates/uses material.
- Keyboard accessible; correct ARIA role/labels.
- Exported from `components/ui/index.js`.
- A temporary showcase at `/_ui` route is **not** required; verify by using it in T-2.x.

- [x] **T-1.1 `cx` helper + `Button` + `IconButton`** · M · Dep: T-0.1, T-0.2, T-0.4
  - Button: variants `primary|secondary|ghost|danger`, sizes `sm|md|lg` (heights from `--control-h-*`), `loading` prop (Spinner replaces label, width stable), `leftIcon/rightIcon`, `as`/`href` renders `Link`. Press scale per R1.
  - Replaces: every `.generateBtn`, `.submitBtn`, `.primaryBtn`, etc.
  - Acceptance: DoD-P; loading state keeps width (no layout shift).

- [x] **T-1.2 `Spinner`, `Skeleton`, `EmptyState`** · S · Dep: T-1.1
  - Spinner sizes `sm|md|lg`, uses shared `spin` keyframes (reduced motion: static pulse). Skeleton: shimmer via `opacity` only. EmptyState: icon + title + description + action slot.

- [x] **T-1.3 `Input`, `Textarea`, `Select`, `Checkbox`, `FormField`** · L · Dep: T-1.1
  - FormField: label, hint, error (inline validation, R10), `required` marker, id wiring via `useId`.
  - Select: native `<select>` styled with token chevron (`mask-image`/token color, not a hard-coded `stroke='%2394a3b8'` data-URI).
  - Input supports `leading`/`trailing` slots (for the refresh/generate button pattern in add-* pages).
  - File input style (dashed dropzone) as `FileInput` variant.
  - Acceptance: DoD-P; error state uses `--color-danger`; focus ring visible in both themes; hit area ≥ `--control-h-md`.

- [x] **T-1.4 `Card`, `Badge`, `PageShell`, `PageHeader`** · M · Dep: T-0.2
  - Card: `variant="flat|raised"`, padding prop `sm|md|lg`. Badge: `tone="neutral|success|warning|danger|info|accent"` (replaces per-page status chips; wire to `lib/paymentStatus.js` values **without editing that file**).
  - PageShell: replaces `.page`/`.container` (padding `--space-8` desktop, `--space-4` mobile, `max-width: var(--page-max-w)`, vertical gap `--space-6`). `PageHeader`: `title`, `subtitle`, `actions` slot; title uses `--text-3xl`, `--tracking-tight`, no gradient (R13).

- [x] **T-1.5 `Modal` + `Sheet`** · L · Dep: T-0.3, T-1.1
  - Shared behavior: portal, focus trap, `Esc` to close, scroll lock, `aria-modal`, return focus to trigger, scrim click closes (prop to disable).
  - Modal: centered, `--material-regular` + thick shadow, spring scale+blur+opacity in/out from trigger origin if provided (R4, R7), mirrored exit.
  - Sheet: `side="right|bottom"`, drag-to-dismiss with 1:1 tracking, release velocity handoff, momentum projection, rubber-band at edge (design.md §3,5,6,9). Bottom sheet is the mobile form of Modal when `size="auto"`.
  - Never locks input during animation (R3).
  - Reduced motion → opacity cross-fade only. Reduced transparency → opaque surface, no blur.
  - Acceptance: DoD-P; manually interrupt open/close mid-animation without jump; tab order trapped; works in light+dark.

- [x] **T-1.6 `Table` (DataTable shell), `Tabs`, `SegmentedControl`** · L · Dep: T-1.2, T-1.4
  - Table: semantic `<table>`; props via composition (`Table.Head/Row/Cell`), sticky header with scroll-edge effect (R6), row hover token, `loading` (Skeleton rows) and `empty` slots, horizontal scroll container with edge fade, numeric cells right-aligned with tabular numbers (`font-variant-numeric: tabular-nums`).
  - Tabs/SegmentedControl: sliding indicator via `motion` `layoutId`, keyboard arrows.
  - Acceptance: DoD-P; header stays visible on vertical scroll; no `position: sticky` z-index fights with Sidebar.

- [x] **T-1.7 Feedback unification (toasts)** · S · Dep: T-1.1
  - Standardize on **Sonner** (already mounted in `LayoutContent`). Create `lib`-free wrapper `components/ui/Toaster/Toaster.js` with token styling (`toastOptions.classNames`), position `top-right` desktop / `top-center` mobile, material surface.
  - Replace every `import Toast from "…/Toast"` usage with `toast.success/error/warning` calls. Delete `components/Toast/` when no references remain.
  - Acceptance: `grep -rn "components/Toast" app components` returns nothing; same message text as before.

### PHASE 2 — App shell and shared components

- [x] **T-2.1 `LayoutContent` + `layout.js` cleanup** · S · Dep: T-0.2
  - Remove all inline styles; create `components/LayoutContent.module.css`. Authenticated shell = Sidebar + scrollable `main` using `--color-bg`. Respect `100dvh` (not `100vh`) for mobile browsers.
  - Replace `AuthProvider` loading UI inline styles with `Spinner` + CSS module.

- [x] **T-2.2 Sidebar redesign** · L · Dep: T-0.3, T-0.4, T-1.4, T-2.1
  - Subtasks:
    1. Material surface (R5), token colors, `Icon` registry, grouped sections with `categoryTitle` using `--tracking-caps`.
    2. Active item: filled `--color-accent-subtle` pill with accent text (no heavy left border). Sliding active indicator via `motion` `layoutId`.
    3. Collapse/expand animates via `motion` (spring `default`); labels fade with `opacity`, no `display:none` flicker. Persist state in `localStorage` (try/catch) — UI preference only.
    4. **Mobile (<768px):** sidebar becomes a left `Sheet` opened by a top-bar menu button (`PageShell`-level `MobileTopBar` component in `components/Sidebar/`). Close on route change.
    5. Keyboard: `aria-current="page"`, visible focus, `Esc` closes mobile sheet.
    6. Logout button = `Button variant="ghost"`; user info block (name/role from `useAuth`) at bottom.
    7. Respect reduced motion/transparency/contrast.
  - Acceptance: DoD-P; no horizontal scroll at 360px; collapse is interruptible; navigation items and routes unchanged.

- [x] **T-2.3 `ConfirmModal` → built on `Modal`** · S · Dep: T-1.5
  - Keep its public props unchanged. Replace internals with `Modal`, `Button`, `Icon`. Tones `danger|warning|info` map to `Badge`-tone tokens. Delete `@keyframes` copies.

- [x] **T-2.4 `PaymentQrModal`, `SmoothImage`, `MarketplaceLogo`** · M · Dep: T-1.5
  - PaymentQrModal → `Modal`. Keep QR rendering logic and any white QR background (print/scan exception, section 8). SmoothImage: tokenized placeholder, opacity fade only. MarketplaceLogo: keep brand colors (exception), remove inline styles where static.

- [x] **T-2.5 Chart theming helper** · S · Dep: T-0.1
  - `components/ui/chartTheme.js` exporting `useChartColors()` reading `--chart-1…6`, axis/grid/tooltip colors from tokens via `getComputedStyle` (re-reads on theme change). Replace hard-coded `CHART_COLORS` in `app/page.js` and any recharts usage in `pl-summary`.

### PHASE 3 — Small pages (tier S)

For **every page task** the checklist **DoD-PG** applies:
1. All primitives replaced with `components/ui/*` equivalents; page CSS keeps only page-specific layout.
2. Zero hex/rgb literals, zero `transition: all`, zero `!important`, zero raw `<svg>`, zero static inline styles in the touched files.
3. Page CSS line count reduced (record before/after in PR). Target ≥ 50% reduction.
4. Light and dark both verified; keyboard path works; verified at 360, 768, 1280 px widths.
5. Behavior identical: same API calls, same validation, same text, same routes. Functional smoke test of the main action performed and listed in the PR.
6. Loading uses `Spinner`/`Skeleton`, empty uses `EmptyState`, errors inline + toast (R10).

- [x] **T-3.1 `/login`, `/register`** · M · Dep: Phase 1
  - Centered `Card` on `--color-bg`, no gradient background/title (R13). Inline field validation (R10). Submit `Button loading`. Respect Enter-to-submit.
- [x] **T-3.2 `/pl-summary`** · S · Dep: T-2.5
  - Stat tiles via `Card`, tabular numbers, recharts themed via T-2.5, table via `Table`.
- [x] **T-3.3 `/add-seller`, `/admin/add-vertical`** · M · Dep: Phase 1
  - Standard "form page" pattern (see 7.1).
- [x] **T-3.4 `/admin/dashboard`, `/super-admin/dashboard`** · S · Dep: T-1.4
  - Wrap in `PageShell` + `PageHeader` + `EmptyState`. No new features.

### PHASE 4 — Medium pages (tier M)

- [x] **T-4.1 Dashboard `/` (`app/page.js`)** · L · Dep: T-2.5, Phase 1
  - Remove gradient title. `NAV_CARDS` become a responsive grid of `Card variant="raised"` links (press feedback R1, hover lift via `transform`). Move static card color to tokens (`--chart-*`/status), not inline hex. Stat cards + 3 charts themed; range select → `SegmentedControl`/`Select`. Skeletons for loading.
  - Split: `app/_components/` → `StatCard`, `NavCardGrid`, `RevenueChart`, etc. only if `page.js` > 400 lines after cleanup.
- [x] **T-4.2 `/add-inventory`, `/add-listing`, `/add-purchase`** · L · Dep: Phase 1
  - Form page pattern (7.1). Two-column field grids collapse to one column < 768px. `add-listing` has 19 inline styles → move to CSS. Split sections into `_components/` per form section when file > 400 lines.
- [ ] **T-4.3 `/upload-sales-log`, `/map-sources`, `/custom-qr`** · L · Dep: Phase 1
  - Dropzone via `FileInput`; progress/status via `Badge` + `Spinner`. `/custom-qr` keeps white QR canvas background (exception 8.3).
- [ ] **T-4.4 `/sales-records` (`SalesRecordsView`)** · M · Dep: T-1.6
  - Table + filters + toolbar migration. Component keeps its props (`title`, `archivedTitle`). Split `_components/` if > 400 lines.

### PHASE 5 — Large pages (tier L/XL): restyle + split (D-4)

Additional rules for splitting (**DoD-SPLIT**):
- Move JSX blocks into `app/<route>/_components/<Name>/<Name>.js` with props; **move** (do not rewrite) handlers and state. Page-level state stays in `page.js`; sub-components are presentational + receive callbacks.
- No sub-component file > 300 lines. `page.js` target ≤ 400 lines.
- Commit in two steps per page: (a) pure split with no visual change, (b) restyle. This keeps diffs reviewable and bugs attributable.
- Extract repeated row/card JSX into one component, not copies.
- Do not change memoization/effects dependencies, since React Compiler is on.

Standard "list page" pattern (7.2) applies to all.

- [ ] **T-5.1 `/all-inventory`** · L · Dep: T-1.6, T-1.5
- [ ] **T-5.2 `/all-listings`** · L · Dep: T-1.6, T-1.5
- [ ] **T-5.3 `/all-sellers`** · L · Dep: T-1.6, T-1.5
- [ ] **T-5.4 `/add-sales-log`** · L · Dep: Phase 1
- [ ] **T-5.5 `/purchase-history`** · XL · Dep: T-1.6, T-1.5 — split into 2 PRs: (a) table/filters/toolbar, (b) detail modals/download/export.
- [ ] **T-5.6 `/all-invoices`** · XL · Dep: T-1.6, T-1.5, T-2.4 — split into 2 PRs: (a) list/toolbar/actions, (b) modals (payment QR, preview, download). Invoice **document** visuals untouched (8.1).
- [ ] **T-5.7 `/create-b2b-invoice`** · XL · Dep: Phase 1, T-2.4 — 46 inline styles → CSS. Split into sections: `PartyDetails`, `LineItemsTable`, `TaxSummary`, `PaymentSection`, `PreviewPane`. Invoice **document** visuals untouched (8.1).
  - Per-page subtask template for T-5.x: (1) inventory of inline styles and primitives, (2) step (a) split, (3) step (b) restyle, (4) DoD-PG + DoD-SPLIT, (5) mobile layout for tables (horizontal scroll with edge fade or card-row layout < 768px), (6) before/after line counts.

### PHASE 6 — Polish, accessibility, cleanup

- [ ] **T-6.1 Cleanup + guard green** · M · Dep: all of Phases 3–5
  - Delete unused CSS classes (verify with grep per file), unused `components/Toast`, `RefreshIcon`, duplicated keyframes. `npm run check:ui` passes with zero violations apart from the allow-list.
- [ ] **T-6.2 Motion pass** · M · Dep: T-6.1
  - Audit every interactive element for R1 (press feedback), R3 (no input lock), R4 (symmetric paths), R15 (compositor-only). Slow-motion review of Modal/Sheet/Sidebar.
- [ ] **T-6.3 Accessibility pass** · M · Dep: T-6.1
  - Contrast AA both themes, focus order, ARIA labels on icon buttons, table semantics, form label association, `aria-live` for toasts, 200% text zoom without layout break (rem spacing), `prefers-*` queries tested with browser emulation.
- [ ] **T-6.4 Responsive pass** · M · Dep: T-6.1
  - Verify every route at 360/768/1024/1280 px: no horizontal page scroll, touch targets ≥ 44px on mobile, sidebar sheet works.
- [ ] **T-6.5 Docs** · S · Dep: T-6.1
  - Replace default `README.md` content with a UI section: structure (section 3), conventions (section 4), how to add a primitive/page. Keep this plan as `REDESIGN_PLAN.md` with all boxes ticked.

### 7.1 Standard "form page" pattern
```
<PageShell>
  <PageHeader title subtitle actions? />
  <Card padding="lg">
    <form>                      // sections separated by --space-6, grouped by FormField
      <FormField label hint error><Input .../></FormField>
      ...
      <div className={styles.actions}>  // right-aligned, Button secondary + primary(loading)
    </form>
  </Card>
</PageShell>
```
Max form width 640px (single column) or 960px (two-column grid ≥ 768px). Submit disabled only while loading, not while invalid (show inline errors instead).

### 7.2 Standard "list page" pattern
```
<PageShell>
  <PageHeader title subtitle actions={<Button primary>…}/>
  <Toolbar>                     // search Input, filters Select/SegmentedControl, bulk actions (page-local, uses tokens)
  <Table loading empty> ... </Table>
  <Pagination?>                 // only where pagination exists today
  <Modal|Sheet> row actions / details </…>
</PageShell>
```
Row actions: `IconButton` ghost with `aria-label`; destructive ones go through `ConfirmModal`.

---

## 8. Exceptions (do NOT apply tokens/theme here)

1. **Invoice document and PDF output** (`components/InvoicePdfPreview/*`, `utils/generatePdf.js` output, anything rendered via `html2canvas`/`jsPDF`): must stay a fixed light, print-safe palette independent of theme. Keep its own CSS file and the existing `@media print` rules. Hard-coded colors allowed **only** in `InvoicePdfPreview.module.css`, with a header comment explaining why. The surrounding preview chrome (modal, toolbar) is redesigned normally.
2. **Brand assets**: `MarketplaceLogo` brand colors.
3. **QR codes**: QR canvas/background stays white-on-black for scannability (`PaymentQrModal`, `/custom-qr`).
4. **`@media print` blocks** keep their behavior.

---

## 9. Verification commands (run before marking any task done)

```bash
npm run lint
npm run build                       # must pass
npm run check:ui                    # T-0.5 guard script
# Spot checks (should return 0 lines in touched files, except allow-listed):
grep -nE "#[0-9a-fA-F]{3,8}\b|rgba?\(" <touched .css files>        # color literals
grep -n "transition: *all" <touched .css files>
grep -n "!important" <touched .css files>
grep -n "<svg" <touched .js/.jsx files>
grep -n "style={{" <touched .js/.jsx files>                         # only dynamic values allowed
grep -nE "@media[^{]*(max|min)-width: *[0-9]+px" <touched .css>     # only 640/768/1024/1280
```
Manual: `npm run dev`; open the touched route in light and dark (`data-theme` toggle in devtools + OS emulation), at 360/768/1280 px, with reduced-motion and reduced-transparency emulated; exercise the page's primary action end-to-end.

---

## 10. Definition of Done (whole project)

- [ ] `grep` for color literals in `app/**` and `components/**` (excluding allow-list in section 8) returns nothing.
- [ ] No page CSS re-declares button/input/card/modal/table/spinner/badge primitives.
- [ ] Every route works in light and dark, at 360–1280px, with reduced-motion/transparency/contrast emulated.
- [ ] No page file > 400 lines; no component file > 300 lines.
- [ ] Single toast system (Sonner), single icon system (`Icon`), single font stack.
- [ ] `npm run lint` and `npm run build` pass. No functional regression (APIs, routes, validation untouched).

---

## 11. Open decisions (owner to answer; defaults used until answered)

| ID | Question | Default if unanswered |
|----|----------|-----------------------|
| D-5 | Single accent color: current app mixes sky `#38bdf8` and blue `#3b82f6`. Which becomes `--color-accent`? | Blue `#0071e3` (light) / `#0a84ff` (dark), Apple-style. |
| D-6 | Font: design.md §15 says system font by default. OK to remove Geist (`next/font/google`)? Keep Geist Mono for IDs/SKUs? | Remove Geist Sans; use `ui-monospace` stack for IDs/SKUs. |
| D-7 | Theme toggle UI: follow OS only, or add a manual light/dark/system switch (in Sidebar footer)? | OS-follow only; manual toggle out of scope. |
| D-8 | Should the invoice/PDF preview follow the app theme? | No, stays light (section 8.1). |
| D-9 | Visual verification: are screenshots (before/after) required per page PR? | Yes for L/XL pages, optional otherwise. |
| D-10 | Browser support floor (`backdrop-filter`, `:has()`, CSS `color-mix` usage). | Last 2 versions of Chrome, Safari, Firefox, Edge. |
| D-11 | Non-UI defect found: `DEFAULT_LOGIN_REDIRECT='/dashboard'` has no matching route (dashboard is `/`). | Report only; not fixed in this project. |
| D-12 | Copy/label changes (R14). | None allowed without approval. |
| D-13 | T-0.1 says hex literals exist only in `styles/tokens.css`, while Phase 0 explicitly leaves existing pages visually unchanged. Is that criterion repository-wide at T-0.1? | Treat `styles/tokens.css` as the only source for new design-token literals; verify repository-wide removal after page migrations at T-6.1. |
| D-14 | T-0.2's `!important` limit conflicts with preserving the existing print overrides; current `LayoutContent` also has inline sizing that the print rules override. | Keep the print rules behavior-identical through T-0.2; revisit their `!important` usage after T-2.1 removes shell inline styles. |
| D-15 | T-0.2 references scrollbar styling, but `app/globals.css` contains none. | Do not invent scrollbar styling; no scrollbar rules are moved in T-0.2. |

---

## 12. Suggested execution order

`T-0.1 → T-0.2 → T-0.3 → T-0.4 → T-0.5` → `T-1.1 → T-1.2/T-1.3/T-1.4 (parallel) → T-1.5 → T-1.6 → T-1.7` → `T-2.1 → T-2.2 → T-2.3 → T-2.4 → T-2.5` → Phase 3 → Phase 4 → Phase 5 → Phase 6.

Between Phase 0 and Phase 3 the app is mixed old/new. That is acceptable because tokens `dark` values equal today's colors. Un-migrated pages must keep working unchanged; **the sidebar (T-2.2) and `body` font change (T-0.2) are the only global visual changes before page migrations**.
