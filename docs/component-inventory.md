# Component Inventory

> Components discovered from the live website, Figma Internal UI library, and dashboard wireframes.  
> **Visual styling:** website + Figma. **Layout / flows:** wireframes.

**Implementation map:** `src/components/ui/`, `src/components/layout/`, `src/components/auth/`.  
**Copy:** `src/content/portal.ts`. **Tokens:** `src/styles/tokens.css`.

---

## Legend

| Source | Meaning |
|--------|---------|
| **Web** | Implemented on energeticexotics.com |
| **Figma** | In Internal UI Figma file (Relume-based) |
| **Wire** | In `reference/wireframes/` (layout prototype) |
| **Dash** | Required for dashboard, not yet on website |

---

## Actions & Buttons

| Component | Source | Variants | Notes |
|-----------|--------|----------|-------|
| Primary Button | Web, Figma | Default, hover, focus, disabled, loading | Solid pill, white on dark UI |
| Secondary Button | Web, Figma | Default, hover, focus, disabled | Outline pill, white border |
| Tertiary / Link Button | Web, Figma | Text only, `← Text`, `Text →` | `Button variant="link"` — Figma `4179:8987`; separate from pill `.button` base |
| Icon Button | Web, Figma | Icon left, icon right, icon only (circle) | `.button.is-icon` |
| Button Group | Web | Horizontal, wrapping | `gap: 1rem` |
| Ghost Button | Wire | Back nav, secondary actions | Maps to Secondary/Tertiary in production |
| Radio Group | Wire, Dash | Yes / No active states | Custom 18px leather/white radio styling for condition fields |
| Menu Button | Wire, Dash | Admin sidebar toggle | White hamburger icon on mobile/tablet |

---

## Form Controls

| Component | Source | Variants | Notes |
|-----------|--------|----------|-------|
| Text Input | Web, Figma | Default, error, disabled | Dark bg `#1a1a1a`, 8px radius |
| Text Input — Left Icon | Figma | Search, credit card | Icon color leather |
| Text Input — Right Icon | Figma | Help circle | Tooltip trigger |
| Text Input — Two Icons | Figma | Left + right icons | |
| Text Input — Prefix Select | Figma | USD + field | Split control |
| Text Input — URL Prefix | Figma | `http://` + field | Split control |
| Select | Web, Figma | Default, error, disabled | Matches input styling |
| Textarea | Web, Wire | Default, error | Multi-line notes fields |
| Checkbox | Web, Dash | Default, checked, disabled | Custom 18px checklist/confirmation control |
| Radio | Web, Dash | Default, selected | Custom circular yes/no control |
| Label | Web, Wire | Default, required | Small caps / uppercase |
| Field Group | Wire | 1-col, 2-col, 3-col grid | Responsive collapse |
| Signature Pad | Wire, Dash | Empty, captured, clear | Canvas guest signature persists in the submission payload and renders in admin detail/PDF |
| File Upload | Wire, Dash | Default, uploading, preview, remove, error | Live capture + gallery fallback, direct staging upload, progress/limits; production R2 migration pending |

---

## Data Display

| Component | Source | Variants | Notes |
|-----------|--------|----------|-------|
| Tag / Badge | Web, Figma, Wire | Default, active | Leather border, uppercase, pill shape |
| Tagline | Web, Figma | Default | Editor's Note italic accent above headings |
| Data List Row | Wire, Dash | Default, hover, linked | Submissions, drivers lists |
| List Heading | Wire | With meta + tags | |
| List Meta | Wire | Timestamp, ID, status | Secondary text |
| Detail Grid | Wire | 2-column key-value | Submission detail |
| Data Table | Figma, Dash | Header, row, empty | Desktop admin views |
| Status Badge | Wire, Dash | Delivery, Pickup, Active, Disabled | Color-coded tags |
| Media Thumbnail | Wire | Placeholder, image, video | Vehicle photos; admin image thumbnails use click-to-zoom preview |
| Empty State | Figma, Dash | Heading, copy, CTA | Dynamic lists use inline empty states; no standalone shared primitive yet |
| Stat Card | Dash | Number + label | Admin dashboard metrics |

---

## Layout & Structure

| Component | Source | Variants | Notes |
|-----------|--------|----------|-------|
| Page Shell | Wire | Driver, admin | `PageShell` — top bar, main, `SiteFooter` |
| Page Intro | Wire | Default, centered | `PageIntro` + `PageIntro.module.css` |
| Page Back Link | Wire | `← Parent` | `Button variant="link" arrow="left"` in top bar |
| Content Layout | Wire | Default, wide, login | `PageShell` width props; shared form/page styles in `PageContent.module.css` |
| Site Footer | Dash | Copyright + credit | `SiteFooter` — see `ui-decisions.md` D19 |
| Dashboard Placeholder | Dash | Legacy | Unused scaffold retained for now; current dashboard routes use real data/layouts |
| Card | Web, Wire | Default, success, spaced | Primary content container |
| Choice Card | Wire | Delivery, Pickup | Dashboard hub options |
| Toolbar | Wire | Filters + actions | Above lists/forms |
| Grid (2-col) | Wire | Form fields, media | Responsive |
| Grid (3-col) | Wire | Form fields | Collapses on mobile |
| Section | Web | With heading | Semantic page sections |
| Divider | Web | Horizontal | `1px` border tertiary |

---

## Navigation

| Component | Source | Variants | Notes |
|-----------|--------|----------|-------|
| Marketing Navbar | Web | Desktop, mobile drawer | Not used in dashboard |
| Logo | Web, Wire | Full, compact mobile | `public/company-logo.svg` and `public/ee logo small.png` via `<Logo>` |
| Driver Top Bar | Wire | Logo + actions | Simple header |
| Admin Sidebar | Wire, Figma | Expanded, mobile drawer | 288px desktop, drawer mobile, compact mobile logo |
| Admin Top Bar | Wire | Menu, alerts, mobile logo | Sticky header, alert dropdown |
| Admin Nav Link | Wire | Default, active, muted | Dashboard, drivers, reservations, submissions, logout |
| Sidebar Close Button | Wire | `×` | Mobile drawer |
| Sidebar Overlay | Wire | Scrim | Mobile only |
| Portal Selector | Wire, Dash | Driver / Admin cards | Entry point (`/`) |
| Breadcrumb | Dash | Parent → current | Via back links |

---

## Feedback & Overlays

| Component | Source | Variants | Notes |
|-----------|--------|----------|-------|
| Notification Banner | Wire | Info, dismissible | Removed from dashboard; alerts live in topbar bell |
| Alert Badge | Wire | Count indicator | Bell badge appears only when unread alerts exist |
| Click Zoom Image | Dash | Trigger, lightbox, Escape/backdrop/scroll close | `ClickZoomImage`; used by admin submission photo/license previews |
| Toast | Figma, Dash | Success, error, info | Form submission feedback |
| Modal | Figma, Dash | Driver reset/disable confirmation | Implemented for driver account actions |
| Modal Footer | Figma | Action buttons | |
| Loading Spinner | Dash | Inline, page-level | Buttons use descriptive loading labels; no shared spinner is required yet |
| Skeleton | Dash | List, card, form | |
| Error Banner | Dash | Login errors, form errors | |
| Success Screen | Wire | Checkmark + meta | Submission complete |
| Secure Notice | Wire | Removed | “Authorized staff/drivers only” copy was intentionally removed from login pages |

---

## Filters & Search

| Component | Source | Variants | Notes |
|-----------|--------|----------|-------|
| Filter Bar | Wire | 1–4 column grid | Submissions list |
| Filter Sidebar | Figma | Collapsible sections | 288px — adapt for admin |
| Search Input | Figma | Left icon | Filter drivers/submissions |
| Sort Modal | Figma | Dropdown options | |
| Filter Modal | Figma | Multi-field | Mobile filter drawer |

---

## Domain-Specific (Dashboard)

| Component | Source | Screen | Notes |
|-----------|--------|--------|-------|
| Login Card | Wire | Driver, admin login | Centered card form |
| Password Help | Wire | Driver login | Admin-reset copy, no email form |
| Password Recovery | Dash | Admin login | Resend email request, token confirmation, recovery password update |
| Dashboard Greeting | Wire | Driver, admin | "Hello, {name}" + lead |
| Hub List | Wire | Portal index | Numbered page links (reference only) |
| Delivery Form | Wire | Driver | Multi-section vehicle check-in |
| Pickup Form | Wire | Driver | Multi-section vehicle check-out |
| Vehicle Details (read-only) | Wire | Pickup form | Auto-filled reservation data |
| Guest Info (read-only) | Wire | Forms | Auto-filled from reservation |
| License Capture | Wire | Delivery form | Front/back upload |
| Walkaround Video | Wire | Forms | Video upload area |
| Submission Detail | Wire | Admin | Read-only form review |
| Create Driver Form | Wire | Admin | Name, email, phone, status |
| Manage Drivers List | Wire | Admin | Active/disabled drivers |
| Submissions List | Wire | Admin | Filterable delivery/pickup records |
| Download PDF | Wire, Dash | Admin detail | Branded server PDF with report data, photos, and guest signature |
| Notification Settings | Wire | Admin (removed) | Email/Zapier/Slack — **removed per client** |

---

## Figma Component Library (not all needed for dashboard)

These exist in the Figma file but are primarily for the marketing site. Include only if dashboard pages need them.

| Component | Figma node | Dashboard relevance |
|-----------|-----------|---------------------|
| Header / 5 / | `13344:29031` | Low — marketing hero |
| Header / 69 / | `13565:36319` | Low |
| Blog Post Header | `13501:35584` | None |
| Filter Sidebar | `11512:6527` | Medium — adapt for admin |
| Modal — Info | `13599:36834` | High — confirmations |
| Modal — Filters | `13567:36397` | Medium |
| Modal — Sorting | `13565:36332` | Medium |
| Tag | Various | High |
| Tagline Wrapper | Various | High |
| Community / Blog cards | Various | None |
| Cookie consent | Web | None |

---

## Component Priority for Implementation

### Phase 1 — Foundation ✅ (in repo)
1. Design tokens (`tokens.css`)
2. Button (primary, secondary, link/tertiary, icon)
3. Text Input, Select, Textarea, Label (`form-controls.module.css`)
4. Card
5. Tag / Badge
6. Logo

### Phase 2 — Layout ✅
7. Page Shell + Site Footer
8. Page Intro + ChoiceGrid / PageGrid
9. Driver Top Bar (logo + back link in `PageShell`)
10. Admin Sidebar + Top Bar + Overlay ✅
11. Content layout (`PageContent.module.css`)

### Phase 3 — Dashboard screens ✅ (Supabase-backed where dynamic)
12. Login Card (`LoginForm`) ✅
13. Choice Card (`ChoiceCard` on `/`) ✅
14. Data List Row ✅
15. Filter Bar ✅
16. Detail Grid ✅
17. File Upload / Media Thumbnail ✅ (live capture + gallery fallback with local previews; Supabase upload wired)
18. Notification Bell / Alert Menu ✅
19. Success Screen ✅
20. Empty states in dynamic list pages ✅ (inline implementations)
21. Driver dashboard hub (delivery/pickup cards) ✅

### Phase 4 — Backend/functionality polish
21. Driver action modal ✅
22. Form/login success and error feedback ✅
23. Descriptive button loading states ✅; shared skeletons are not currently needed
24. Error banners and field errors ✅
25. Signature Pad ✅ (submission payload + admin/PDF rendering)
26. Validation, persistence, auth, file upload, alerts, audit history, and PDF export ✅
27. Production Google Sheet sync, R2 media storage, storage monitoring, and launch hardening — pending

---

## Wireframe → Production Mapping

| Wireframe class | Production component |
|----------------|-------------------|
| `.wf-btn-primary` | `<Button variant="primary">` |
| `.wf-btn-ghost` | `<Button variant="secondary">` |
| `.wf-btn-link` / back nav | `<Button variant="link" arrow="left">` |
| `.wf-accent` | `<Tagline>` |
| `.wf-page-title` | `<Heading level={1}>` |
| `.wf-card` | `<Card>` |
| `.wf-input` | `<Input>` |
| `.wf-select` | `<Select>` |
| `.wf-textarea` | `<Textarea>` |
| `.wf-tag` | `<Tag>` |
| `.wf-list-row` | `<ListRow>` |
| `.wf-admin-sidebar` | `<AdminSidebar>` |
| `.wf-admin-topbar` | `<AdminTopBar>` |
| `.wf-notification-banner` | Replaced by admin topbar alert menu |
| `.wf-upload` | `<FileUpload>` |
| `.wf-choice-card` | `<ChoiceCard>` |

---

## Accessibility Requirements (all components)

- Minimum touch target: `44×44px`
- Color contrast: WCAG AA (4.5:1 body, 3:1 large text)
- Focus visible on all interactive elements
- Form labels associated with inputs
- Error messages linked via `aria-describedby`
- Sidebar: `aria-expanded`, `aria-controls`, focus trap in mobile drawer
- Images: meaningful `alt` text
- Loading states: `aria-busy`, `aria-live` for toasts
