# Miora — Frontend Design Audit

**Date:** 13 Nov 2026  
**Scope:** Landing page, Login / Create Account, Clinician Dashboard, Patient Portal  
**Stack:** React 19, Vite, react-router-dom, vanilla CSS (+ 1 legacy `main.js` entry)

---

## Executive Summary

The landing page has been well-refactored into presentational components and is in good shape. The clinician dashboard (`dashboard.css`) is consistent and polished. The **patient portal is the weakest area**: five patient pages import CSS files that do not exist on disk, the patient sidebar exists in two conflicting implementations, and there are lint errors that will break strict builds.

Below are all findings grouped by severity.

---

## 🔴 Critical — Will break rendering / build

### C1. Missing patient CSS files (5 files)

Five patient page components import stylesheets that do **not exist** on disk. Only `ai-assistant.css` and `patientSidebar.css` exist in `src/patient/styles/`.

| Page | Import line | Missing file |
|------|-------------|--------------|
| `PatientReportsPage.jsx` | `src/patient/pages/PatientReportsPage.jsx:5` | `./reports.css` |
| `CareSuggestionsPage.jsx` | `src/patient/pages/CareSuggestionsPage.jsx:5` | `./care-suggestions.css` |
| `MedicalHistoryScreen.jsx` | `src/patient/pages/MedicalHistoryScreen.jsx:4` | `./medicalHistory.css` |
| `PatientScreeningPage.jsx` | `src/patient/pages/PatientScreeningPage.jsx:4` | `./screening.css` |
| `ScreeningResultsPage.jsx` | `src/patient/pages/ScreeningResultsPage.jsx:7` | `./screening-results.css` |

**Impact:** Those patient pages render with no custom styling (fall back to global `styles.css` / browser defaults), producing a broken, unstyled patient experience.

**Fix:** Create the five missing CSS files in `src/patient/styles/`, or remove the imports if the pages are intentionally unstyled.

---

## 🟠 High — Lint errors (6 errors, 4 warnings)

The eslint config at `eslint.config.js` is missing browser globals (`localStorage`, `alert`), causing `no-undef` errors.

### C2. `localStorage` not defined — 3 errors
- `src/patient/context/PatientContext.jsx:169, 186`
- `src/patient/pages/MedicalHistoryScreen.jsx:24, 39, 159`

### C3. `alert` not defined — 1 error
- `src/patient/pages/AiAssistantScreen.jsx:336`

### C4. Unused variables — 4 warnings
| File | Line | Unused var |
|------|------|------------|
| `CreateAccountScreen.jsx` | 136 | `isPreAuthorized` |
| `PatientContext.jsx` | 242 | `err` |
| `AiAssistantScreen.jsx` | 265 | `navigate` |
| `PatientScreeningPage.jsx` | 14 | `setProgress` |

**Fix:** Add `localStorage: 'readonly'` and `alert: 'readonly'` to the `globals` in `eslint.config.js`; remove or use the unused variables.

---

## 🟡 Medium — Code quality / duplication

### C5. Duplicate `switch` cases in `PatientIcons.jsx`

The build emits repeated warnings: *"This case clause will never be evaluated because it duplicates an earlier case clause"*:

| Duplicate pair | First occurrence | Duplicate occurrence |
|----------------|------------------|----------------------|
| `case 'reports'` / `case 'folder'` | line 68–77 | line 100–106 |
| `case 'care-suggestions'` / `case 'heart'` | line 60–67 | line 107–113 |
| `case 'bar-chart'` / `case 'overview'` | line 49–59 | line 137–145 |

**Impact:** The second block is dead code; the wrong icon may render for those names.  
**Fix:** Remove the duplicate `case` blocks (keep the first occurrence of each).

---

## 🟢 Low — Design consistency & accessibility

### D1. Two conflicting patient sidebars

The patient portal has **two different sidebar implementations** with different markup, classes, styling, and nav items:

1. `src/patient/components/PatientSidebar.jsx` + `src/patient/styles/patientSidebar.css` (`.miora-unified-sidebar`, 6 tabs, "Miora" brand)
2. `PatientReportsPage.jsx` inline sidebar (`.miora-reports-sidebar`, 7 tabs, different active-state styling, hardcodes `is-active` on "My Reports" instead of using `NavLink`'s `isActive`)

**Impact:** Inconsistent navigation look/behavior across patient screens; brand font differs ("Newsreader" fallthrough vs. page-specific styling).

**Fix:** Consolidate into a single `PatientSidebar` component used by all patient pages; remove the inline sidebar from `PatientReportsPage.jsx`.

### D2. Inline styles bypass focus-visible / theme tokens

`LoginScreen.jsx` and `CreateAccountScreen.jsx` use inline `style={{ ... }}` on the "Try Demo" buttons and bottom links (e.g. lines 434–468, 591–596). Inline styles cannot be overridden by the CSS `:focus-visible` rules and duplicate token values already defined in CSS.

**Fix:** Move these to CSS classes (e.g. `.login-demo-btn`, `.login-bottom-link`) and remove inline `style` props.

### D3. Dashboard mobile nav button is non-functional

In `dashboard.css`, `.dash-mobile-menu-btn` (line 161) and `.dash-mobile-drawer` (line 173) are both `display: none` at all breakpoints. `TopNav.jsx` renders the mobile toggle button (line 283) and drawer (line 295), but they never appear, so on mobile there is no way to open the navigation menu.

**Fix:** Add a `@media (max-width: ~768px)` rule that shows `.dash-mobile-menu-btn` and `.dash-mobile-drawer` (or hides the desktop nav links and shows the drawer).

### D4. Stale `AUDIT_FIXES.md`

`AUDIT_FIXES.md` documents issues against the old monolithic `src/main.js` (template literal UI, `.desktop-only` `<br>`, missing skip link, etc.). That file has since been refactored into `src/components/*.js`, and many listed fixes are already in place (skip link, `:focus-visible`, `scroll-margin-top`, optimized hero image, favicons, OG tags, JSON-LD, `font-display=swap`).

**Impact:** The doc is misleading; it lists "open" bugs that are already fixed and misses the real current issues (missing patient CSS, lint errors, duplicate icon cases).

**Fix:** Archive `AUDIT_FIXES.md` and replace with this audit.

---

## ✅ Already fixed (do not re-open)

These items from `AUDIT_FIXES.md` are already resolved in the current codebase:

| Issue | Status | Location |
|-------|--------|----------|
| Skip-to-content link | Fixed | `src/main.js:17`, `.skip-link` in `styles.css:93` |
| `:focus-visible` outlines | Fixed | `styles.css:126–134` |
| Anchor scroll behind sticky header | Fixed | `styles.css:137–142` (`scroll-margin-top`) |
| Hero image: WebP/AVIF + `loading="eager"` + dimensions | Fixed | `src/components/Hero.js:18–28` |
| Decorative spans `aria-hidden="true"` | Fixed | `Hero.js`, `Footer.js`, etc. |
| Social link labels | Fixed | Landing footer uses brand wordmark only; dashboard uses icons |
| Favicon / apple-touch-icon / manifest | Fixed | `index.html:14–18`, `public/` |
| Canonical + OG / Twitter tags + JSON-LD | Fixed | `index.html:11–61` |
| Google Fonts `display=swap` + preconnect | Fixed | `index.html:35–37` |
| Modularized UI (no monolithic template literal) | Fixed | `src/main.js` imports components |

---

## 📦 Performance notes

- Main JS chunk is **1,206 kB** (302 kB gzip), over the 500 kB warning threshold. The dashboard pulls in all patient pages at bundle time. Consider route-based code-splitting (`React.lazy` / dynamic `import()`) for patient and dashboard routes.
- `public/assets/` contains many `reference-*.png` and comparison images that appear to be visual-regression fixtures, not product assets. Verify whether they're referenced anywhere; if not, remove them from the repo to reduce clone size.

---

## Recommended fix order

1. **Create the 5 missing patient CSS files** (or remove imports) — unblocks styled patient pages.
2. **Fix lint errors** — add `localStorage`/`alert` to eslint globals; remove unused vars.
3. **Remove duplicate icon switch cases** in `PatientIcons.jsx`.
4. **Consolidate patient sidebars** into one component.
5. **Fix dashboard mobile nav visibility**.
6. **Archive `AUDIT_FIXES.md`**; keep this audit as the living document.
7. **Consider code-splitting** for the oversized main chunk.
