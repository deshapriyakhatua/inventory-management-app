# Inventory Management App

Next.js 16 (App Router, React 19, plain JavaScript, CSS Modules, React Compiler on) app for inventory, listings, sales, purchases and B2B invoicing.

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

| Script | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build (must pass before merging) |
| `npm run lint` | ESLint (kept at zero errors and zero warnings) |
| `npm run check:ui` | UI guard: colour literals, `transition: all`, `!important`, raw `<svg>`, static inline styles, non-standard breakpoints |

## UI system

The UI follows [design.md](design.md) (Apple-style design principles for the web). The full migration plan, rules and history live in [REDESIGN_PLAN.md](REDESIGN_PLAN.md).

### Structure

```
styles/
  tokens.css        # every design token: colours, space, radius, type, motion, layers, layout
  base.css          # reset, body/type defaults, focus ring, shared keyframes, prefers-* handling
lib/motion.js       # spring presets (spring.default/sheet/snappy), fade, scaleIn, slideFrom, useMotionPreference
hooks/useOverlayAccessibility.js   # focus trap, Esc, scroll lock for Modal/Sheet (topmost overlay only)
components/
  ui/               # presentation primitives, no business logic, no fetch
    Button IconButton Input Textarea Select Checkbox FormField
    Card Badge Spinner Skeleton EmptyState
    Modal Sheet Table Tabs SegmentedControl Toaster
    PageShell PageHeader Icon
    chartTheme.js   # useChartColors() for recharts, reads --chart-* tokens
    cx.js           # className joiner
    index.js        # barrel export
  Sidebar/ ConfirmModal/ PaymentQrModal/ SalesRecordsView/ ...   # shared app components built on ui/*
app/<route>/
  page.js           # state, effects, API calls, handlers; composes sub-components
  page.module.css   # page-specific layout only
  _components/<Name>/<Name>.js + <Name>.module.css   # presentational pieces for that route
```

A primitive belongs in `components/ui` only when two or more pages use it; otherwise keep it in the route's `_components/`. `components/ui/*` never imports from `app/**`, never calls `fetch`. Use the `@/` import alias.

### Theme and tokens

- Light is the default. Dark applies via `prefers-color-scheme` or `data-theme="dark"` on `<html>` (`data-theme="light"` forces light).
- Tokens are semantic: `--color-{bg,surface,surface-raised,surface-sunken,text,text-muted,text-subtle,border,accent,success,warning,danger,info}`, `--space-1…12`, `--radius-*`, `--shadow-*`, `--text-*` (rem), `--duration-*`, `--ease-*`, `--z-*`, `--control-h-*`.
- Solid fills with white text use the `*-fill` tokens (`--color-accent-fill`, `--color-danger-fill`, `--color-success-fill`) so both themes meet WCAG AA.
- Readable text uses `--color-text` or `--color-text-muted`. `--color-text-subtle` is for icons, separators and chevrons only.
- Shared keyframes are referenced through variables, because CSS Modules rename bare keyframe names: `animation: var(--keyframes-spin) var(--duration-spin) linear infinite;`

### Conventions

- Files: one component per folder, `PascalCase.js` + `PascalCase.module.css`. Hooks: `useCamelCase.js`.
- Classes: camelCase, root class `root`, state as modifier classes (`isOpen`, `sizeSm`), max one nesting level.
- CSS uses tokens only. No hex/rgb/hsl, no `!important`, no `transition: all` (list properties), no `font-family`, no px font sizes, no gradients.
- Media queries are mobile-first `min-width` at `640px`, `768px`, `1024px` or `1280px`, plus `prefers-*`, `pointer` and `print`.
- No static `style={{}}`; inline styles only for runtime values (e.g. tooltip position).
- No raw `<svg>`; use `<Icon name="…" />`. Icon-only controls use `IconButton` with `aria-label`.
- Interactive elements are real `<button>`/`<a>`, never `div onClick`. Inputs are wrapped in `FormField` so labels are associated.
- Animate only `transform` and `opacity` (plus blur on overlays). Overlays animate with `motion` springs; hover, press and colour changes use CSS.
- Feedback: loading uses `Spinner`/`Skeleton` or a primitive's `loading` prop, empty uses `EmptyState`, errors show inline (`FormField error`) and as a Sonner toast.
- Effects that should not re-run when handlers change identity use React 19.2 `useEffectEvent`; don't add handler functions to dependency arrays (React Compiler is on).
- Size limits: page files ≤ 400 lines, component files ≤ 300 lines.

### Exceptions (do not theme)

1. Invoice document and PDF output: `components/InvoicePdfPreview/*` and anything captured by `html2canvas`/`jsPDF` keep a fixed light, print-safe palette. Keep the `<InvoicePdfPreview>` element and its `ref` untouched.
2. Brand colours in `MarketplaceLogo`.
3. QR codes stay black on white for scannability (`PaymentQrModal`, the `/custom-qr` export card).
4. `@media print` blocks keep their behaviour; `check:ui` skips their contents.

### Adding a primitive

1. Confirm two or more pages need it; otherwise build it in the route's `_components/`.
2. Create `components/ui/<Name>/<Name>.js` + `<Name>.module.css`. Destructure props with defaults, forward `className` (merged last with `cx`), `...rest` and `ref`.
3. Use fixed variant/size sets (`variant="primary|secondary|ghost|danger"`, `size="sm|md|lg"`).
4. Cover `:hover`, `:active` (`transform: scale(0.97)`), `:focus-visible`, `:disabled`, and `prefers-reduced-motion` / `-transparency` / `-contrast` where it animates or uses a material surface.
5. Export it from `components/ui/index.js`.

### Adding a page

1. Start from the pattern that fits:
   - Form page: `PageShell` → `PageHeader` → `Card padding="lg"` → `<form noValidate>` with `FormField` grids (1 column, 2 from 768px) → right-aligned actions (secondary + primary with `loading`).
   - List page: `PageShell` → `PageHeader` (actions) → toolbar (search `Input` with `leading` icon, `Select`/`SegmentedControl` filters) → `Table` with `loading`/`empty` → pagination → `Modal` for details, `ConfirmModal` for destructive actions.
2. Keep state, effects and API calls in `page.js`; move presentational blocks to `_components/` once the page grows.
3. Run the checks below before committing.

### Before committing

```bash
npm run lint
npm run check:ui
npm run build
```

Then check the route in a browser: light and dark, 360/768/1280px, and with reduced motion and reduced transparency emulated.
