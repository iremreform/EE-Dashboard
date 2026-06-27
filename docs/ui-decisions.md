# UI Decisions & Assumptions

> Documented conflicts, resolutions, and open questions between the live website, Figma Internal UI, and dashboard wireframes.

---

## Source priority (confirmed)

1. **Live website CSS** — colors, typography, buttons, inputs, interaction states
2. **Figma Internal UI** — layout patterns, component structure, dashboard-adjacent patterns
3. **Wireframes (`reference/`)** — user flows, page structure, content hierarchy only

Wireframes intentionally use a grayscale prototype aesthetic. They must **not** define the dashboard visual design.

---

## Decision log

### D1 — Dashboard uses dark theme

**Conflict:** Figma style guide shows both light (pearl background) and dark (black background) component variants. The website homepage is predominantly dark.

**Decision:** Dashboard uses the **dark theme** throughout — `#121212` page background, `#1a1a1a` cards/inputs, pearl/white text, leather accents. This matches the primary brand experience visitors see on energeticexotics.com.

**Rationale:** Admin and driver portals are internal tools used by staff who associate the brand with the dark luxury aesthetic. Light theme variants remain available for future settings pages if needed.

---

### D2 — Replace wireframe tokens in `src/styles/tokens.css` ✅

**Conflict:** Early `tokens.css` used wireframe grayscale tokens (`--black: #000`, `--white: #fff`, Helvetica only). This was carried over from the wireframe phase.

**Decision:** Replace entirely with website brand tokens documented in `design-system.md`. Wireframe tokens remain in `reference/type-scale.css` for reference HTML only.

**Status:** Implemented — `src/styles/tokens.css` is the production token file.

**Rationale:** User instruction: "Do not invent a new design language." The wireframe palette is not on-brand.

---

### D3 — Typography: website fluid scale over wireframe scale

**Conflict:** Wireframes use a custom scale (mobile base `1.1875rem` × 1.1, desktop base `1.3125rem` × 1.333). Figma specifies fixed pixel steps (12/14/16/18/20). Website uses fluid `clamp()` for headings.

**Decision:**
- **Headings:** Website fluid scale (PP Monument Extended, uppercase)
- **Body/UI:** Figma fixed scale (16px base, 150% line-height) — matches website form elements
- **Subheadings/accent:** Editor's Note italic (leather color)

**Rationale:** Heading scale values are identical between wireframe and website (same base/ratio). Body text on the website forms is 16px, matching Figma. Wireframe `--text-*` tokens were layout-tuning tools, not brand definitions.

---

### D4 — Form input height: 44px (website) vs 48px (Figma)

**Conflict:** Website `.form-input` min-height is `2.75rem` (44px). Figma text inputs are `48px`.

**Decision:** Use **48px** min-height for dashboard inputs.

**Rationale:** 48px meets accessibility touch-target guidelines without conflicting significantly with the website. Border, radius (8px), colors, and typography match the website exactly. The 4px difference is imperceptible in context.

---

### D5 — Form input background: dark, not Figma light gray

**Conflict:** Figma default input background is `#eee` (light theme). Website dark forms use `#1a1a1a`.

**Decision:** Use `#1a1a1a` background with website border/focus/placeholder colors.

**Rationale:** Follows D1 (dark theme). Figma light gray is for the light-theme variant of the component library.

---

### D6 — Button hover: leather, not opacity shift

**Conflict:** Figma shows subtle opacity change on hover. Website `.button:hover` changes background to `var(--button--primary-bg-hover)` which resolves to leather (`#bfa384`).

**Decision:** Primary button hover → **leather background**, white text. Secondary hover → border/text brightening.

**Rationale:** Leather hover is a distinctive brand interaction visible across the marketing site.

---

### D7 — No box shadows on cards

**Conflict:** Many dashboard UI patterns (Material, Tailwind defaults) use elevation shadows. Figma modals have minimal shadow.

**Decision:** **No box shadows** on cards, lists, or panels. Use borders and background color for hierarchy.

**Rationale:** Website aesthetic is flat and luxury-minimal. Shadows would feel foreign to the brand.

---

### D8 — Wireframe layout patterns adopted; wireframe chrome is not

**Conflict:** Wireframes define admin sidebar, topbar, list rows, form sections, and page flows. Visual styling is grayscale boxes.

**Decision:** Adopt wireframe **information architecture** and **component boundaries** (see `component-inventory.md`). Restyle every element with brand tokens.

**Screens mapped from wireframes:**
- `/` — Portal selector
- `/driver/login` — Login
- `/driver/forgot-password` → Password Help (no email form)
- `/driver/dashboard` — Choice cards (delivery/pickup)
- `/driver/delivery` — Delivery form
- `/driver/pickup` — Pickup form
- `/driver/complete` — Submission success
- `/admin/login` — Admin login
- `/admin/dashboard` — Dashboard + alert bell/recent submissions
- `/admin/drivers` — Manage drivers
- `/admin/drivers/new` — Create driver
- `/admin/submissions` — Submissions list
- `/admin/submissions/[id]` — Submission detail

---

### D9 — Figma file has no dedicated dashboard screens

**Conflict:** The linked Figma file (`8202:82`) is the full Internal UI / marketing component library (~26,000 nodes). It does not contain driver/admin portal mockups.

**Decision:** Use Figma for **atomic components** (buttons, inputs, tags, modals, sidebar pattern). Use wireframes for **page layout and flows**.

**Rationale:** No conflict to resolve — sources complement each other.

---

### D10 — Admin sidebar width: 288px

**Conflict:** Wireframes don't specify sidebar width. Figma "Filter sidebar" component is 288px.

**Decision:** Admin sidebar = **288px** fixed on desktop.

**Rationale:** Figma sidebar is the closest designed reference. 288px accommodates nav labels without consuming too much content area.

---

### D11 — Tags: website style (leather border) over wireframe style (black border)

**Conflict:** Wireframe `.wf-tag` uses black border, gray text, uppercase. Website `.tag` uses leather border, leather text, heading font, pill radius.

**Decision:** Use **website tag style**.

**Rationale:** Tags on submission detail ("Delivery", "Res #1042") should feel on-brand.

---

### D12 — Link buttons for navigation, not ghost buttons

**Conflict:** Wireframes use `.wf-btn-ghost` (outlined rectangle) for back navigation. Website uses `.button.is-link` (Editor's Note italic, leather, no border) for text navigation.

**Decision:**
- **Back links** → Tertiary/link button (`← Submissions`)
- **Secondary actions** → Secondary outline pill
- **Destructive / low emphasis** → Tertiary link

**Rationale:** Back navigation is wayfinding, not a primary action. Link style matches the website's editorial feel.

---

### D13 — Notification settings card removed

**Conflict:** Wireframe admin dashboard included Email/Zapier/Slack notification settings. Client requested removal.

**Decision:** **Do not implement** notification channel settings in v1. Admin alerts are exposed through the topbar bell/dropdown and recent submissions, not a dashboard notification settings card.

---

### D14 — Password help, not forgot-password flow

**Conflict:** Standard SaaS pattern is email-based password reset. Client workflow has admins reset passwords manually.

**Decision:** `/driver/forgot-password` is a **Password Help** page with contact-admin copy. No email input form.

---

### D15 — Font loading strategy

**Conflict:** PP Monument Extended and Editor's Note are custom licensed fonts on Webflow. They may not be freely available for self-hosting.

**Decision (v1):**
- Load fonts via `@font-face` if licensed files are provided
- Fallback: Arial for headings, Georgia italic for subheadings, Helvetica/Arial for body
- Document font requirements for client

**Open:** Confirm font licensing with client before production deployment.

---

### D16 — CSS modules + tokens (no Tailwind)

**Conflict:** Tailwind v4 was initially installed. Design system is CSS-variable based (matching Webflow/Relume).

**Decision:** Define tokens in `src/styles/tokens.css`. Components use **CSS modules** referencing tokens — no Tailwind utility classes. Tailwind was removed; a minimal global reset in `globals.css` replaces Preflight (`box-sizing`, form `font` inheritance).

**Rationale:** User requirement: "No hardcoded styles repeated across pages." CSS variables allow global theme updates without a utility framework.

---

### D17 — Responsive breakpoints align with website

**Decision:** Use website breakpoints: `768px`, `1024px`, `1280px`, `1440px`. Admin sidebar collapses to drawer below `1024px` (wireframe behavior). Form grids collapse below `768px`.

---

### D18 — Lists over tables on mobile

**Conflict:** Admin submissions/drivers could use HTML tables or list rows.

**Decision:** **List rows** on all breakpoints. Table-style column headers appear at `≥900px` but rows remain flex/grid — not `<table>`.

**Rationale:** Wireframe pattern, better mobile UX, matches website's card-based content style.

---

### D19 — Minimal site footer on portal pages (not a marketing footer)

**Context:** Portals and dashboards often omit footers or keep them very small. Full marketing footers (legal sitemap, social, etc.) are unnecessary on task-focused internal tools.

**Decision:** Use a **thin, two-column footer** via `SiteFooter` in `PageShell`:
- **Left:** `© 2026 Energetic Exotics. All rights reserved.`
- **Right:** `Portal by` + linked **Reform Digital®** (`https://www.reform.digital/`)
- **No** Privacy / Terms / Cookies links in v1 (legal lives on the public marketing site if needed later)

**Implementation:**
- Component: `src/components/layout/SiteFooter.tsx`
- Copy: `footer` object in `src/content/portal.ts`
- Footer link style: **white/pearl** (`--text-primary`), underlined — **not** leather (`--text-subheading`)

**Scope (v1):** Rendered on every `PageShell` page (portal selector, login, early dashboards).

**Future guidance for agents:** As admin/driver UIs grow (sidebar shell, long forms, data tables), consider **hiding or removing the footer** on dense authenticated screens. Keep it on **public/auth** pages (portal selector, login, password help). If needed, add `showFooter?: boolean` to `PageShell` (default `true` for now) or move footer to a dedicated auth/public layout only.

**Rationale:** Matches current early-stage portal scope and agency credit requirement without consuming vertical space or duplicating marketing-site legal chrome.

---

### D20 — `reference/` is in-repo only (not served)

**Decision:** Wireframes live in `reference/` at the project root. They are **not** copied or symlinked into `public/` and are **not** linked from production UI. Agents and developers read them for flows and page structure.

**Logo:** Single asset at `public/company-logo.svg`. Reference HTML points to `../public/company-logo.svg` (or `../../public/…` from `wireframes/`).

---

### D21 — Primary buttons match ChoiceCard; tertiary is standalone

**Decision:**
- **Primary** pill buttons use explicit border + padding tokens shared with `ChoiceCard` action labels (white fill, leather hover, dark text on hover).
- **Tertiary** (`<Button variant="link">`) does **not** inherit `.button` pill base styles. It matches Figma node `4179:8987`: Editor's Note italic, `24px`, leather, `12px × 24px` padding, optional `arrow="left"` / `arrow="right"`.

**Implementation:** `Button.module.css` — separate `.link` class; `Button.tsx` applies `.link` only for tertiary variant.

---

### D22 — Reservation source: Google Calendar

**Client answer:** Reservation information is kept on **Google Calendar**.

**Decision:** Treat Google Calendar as the reservation source for v1. The backend should normalize reservation data into the app database so submitted reports remain stable even if calendar events are edited later.

**Required form data:** reservation number, date(s), guest name, guest phone number, drop-off location, pickup location.

---

### D23 — Delivery/pickup forms auto-fill reservation data

**Client answer:** Forms should auto-fill.

**Decision:** Driver delivery and pickup forms should search/select a reservation and auto-fill guest, reservation, location, and vehicle fields where available. Manual entry can be kept for admin corrections or fallback, but the main workflow is reservation-driven.

---

### D24 — Auth direction: username/password for now

**Client answer:** Drivers/admins should use username and passwords. Admin access is needed for roughly **2 admins**.

**Decision:** Backend auth planning should use username/password unless the client later reverses course to Google OAuth. Keep separate driver and admin authorization.

**Implementation status:** `/driver/login` and `/admin/login` use Supabase Auth and verify linked active `drivers` / `admin_users` rows. Driver and admin dashboard/workflow routes are protected, and logout is real for both portals.

**Impact:** `/driver/forgot-password` remains a password help page for now; no self-serve email reset flow is required unless requested later.

---

### D25 — Submission edit rules

**Client answer:** Drivers can only make notes after submitting. Admins can edit submitted reports.

**Decision:** Submitted reports are locked for drivers except driver notes. Admins can edit report fields and statuses. Every edit/note should be audit logged.

---

### D26 — Submission statuses

**Client answer:** Statuses should be **Submitted**, **Completed**, and **Archived**.

**Decision:** Use these as the primary report lifecycle statuses. Keep issue/alert flags separate from lifecycle status so a report can be Submitted + alert flagged without inventing another status.

---

### D27 — Audit trail required

**Client answer:** Yes, audit trail is required with date/time stamps.

**Decision:** Add audit events for report submission, viewing, editing, note additions, status changes, PDF export, archive, and admin account changes.

---

### D28 — Pickup reports link to delivery reports

**Client answer:** Pickup/return is always tied to an earlier delivery report for the same reservation. Mileage and fuel should be compared automatically.

**Decision:** Pickup reports must reference the matching delivery report. The system should compare return mileage/fuel against delivery mileage/fuel and surface differences for admin review.

**Exception handling:** If no match is found, flag as needs review. If pickup location differs from drop-off/location details, note it on the original report and alert admins.

---

### D29 — Media capture and retention

**Client answer:** Live photo capture is preferred; gallery upload should be available as backup. Files should also be saved to Google Drive. Retention is now decided as keep indefinitely, with a storage-capacity alert before storage is close to full.

**Decision:** Implement live capture where browser support allows it, with upload fallback. Store originals securely in app storage, copy files to Google Drive, do not automatically delete reports/media/signatures, and alert admins before storage is close to full.

---

### D30 — Payments use Square invoices

**Client answer:** Payments are handled through Square invoice links sent to customers by email/text.

**Decision:** Show `Payment verified: Yes / No` only for now. Do not add PCI-sensitive payment fields, Square invoice links, Square references, or live Square status in the first backend pass.

---

## Open questions for client

| # | Question | Impact |
|---|----------|--------|
| Q1 | Are PP Monument Extended and Editor's Note licensed for self-hosting in the dashboard? | Font implementation |
| Q2 | Should admin dashboard show real-time metrics or static greeting (as wireframed)? | Admin dashboard scope |
| Q3 | What is the Google Calendar event format, and which calendar(s) should the portal read from? | Reservation integration |
| Q4 | What Google Drive folder structure and file naming convention should be used for report copies? | File export workflow |
| Q5 | PDF download on submission detail — what template/data should generate the PDF? | Backend integration |
| Q6 | Should the portal selector (`/`) remain public, or redirect authenticated users to their dashboard? | Routing/auth |
| Q7 | Light theme toggle for admin users? | Theme system scope |

---

## Conflicts resolved summary

| Area | Website | Figma | Wireframe | Winner |
|------|---------|-------|-----------|--------|
| Colors | Dark luxury palette | Both themes | Grayscale | **Website** (dark) |
| Typography | Fluid headings + Helvetica | Fixed scale + same fonts | Helvetica only | **Website + Figma** |
| Buttons | Pill, leather hover | Matches | Rectangle outline | **Website** |
| Inputs | Dark `#1a1a1a` | Light `#eee` / dark variant | Gray box | **Website** (dark) |
| Tags | Leather pill | Similar | Black border | **Website** |
| Shadows | None | Minimal | None | **Website** |
| Page layouts | N/A | Marketing pages | Full dashboard | **Wireframes** |
| Sidebar | N/A | 288px filter sidebar | Drawer pattern | **Wireframes + Figma** |
| Flows | N/A | N/A | Complete | **Wireframes** |

---

## Implementation status (June 2026)

### Done
- Brand tokens in `src/styles/tokens.css`
- Phase 1 UI: `Button`, `Input`, `Select`, `Textarea`, `Field`, `Card`, `Tag`, `Tagline`, `Heading`, `Logo`, `ChoiceCard`, `ArrowIcon`, `Checkbox`, `DotLottieAnimation`
- Layout: `PageShell`, `PageIntro`, `PageContent` styles, `SiteFooter`, `DashboardPlaceholder`, `LoginForm`, `AdminShell`
- Pages: portal selector, driver/admin login, password help, driver dashboard, delivery form, pickup form, completion screen, admin dashboard, manage drivers, create driver, submissions list, submission detail
- Copy centralized in `src/content/portal.ts`
- Global CSS reset (post-Tailwind removal)
- Supabase foundation: schema/seed applied in dashboard, server helpers added, admin dashboard/submissions/drivers reads wired
- Driver creation: `/admin/drivers/new` creates `drivers` records and Supabase Auth users
- Driver/admin login/protection/logout: `/driver/login` and `/admin/login` validate with Supabase Auth and active account status; driver/admin workflow routes are protected

### Not started / backend-functional
- Pickup submission persistence
- Delivery media upload persistence
- Real reservation auto-fill from Google Calendar
- Real photo/video upload and Google Drive copy
- Admin edit actions, driver disable/reset actions, and audit trail
- PDF export, notifications, modals, toasts, loading/error states

---

## Next implementation steps

1. ~~Rewrite `src/styles/tokens.css` with brand tokens from `design-system.md`~~ ✅
2. Add font files or document fallbacks in `src/app/layout.tsx` (D15 — still open)
3. ~~Build Phase 1 components (see `component-inventory.md`)~~ ✅
4. ~~Rebuild stub pages (`/`, `/driver/login`, `/admin/login`) with branded components~~ ✅
5. ~~Build driver dashboard delivery/pickup choice cards~~ ✅
6. ~~Implement remaining planned wireframe frontend screens~~ ✅
7. Connect pickup submissions, reservation auto-fill, media, notifications, admin audit trail views, and PDF export
9. Visual QA against energeticexotics.com side-by-side
