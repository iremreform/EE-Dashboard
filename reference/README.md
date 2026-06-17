# Wireframe reference

Static HTML wireframes for the Energetic Exotics driver and admin portal. **Not served by the Next.js app** — kept in-repo so agents and developers can read user flows, page structure, and content hierarchy while building in `src/`.

Visual styling comes from `docs/design-system.md` and `src/styles/tokens.css`, not these wireframes.

## Contents

| Path | Description |
|------|-------------|
| `wireframes/` | Screen wireframes + `wireframes.css` (layout prototype only) |
| `userflow.html` | Driver and admin journey diagram |
| `type-scale.css` | Wireframe typographic scale (reference HTML only) |
| `../public/company-logo.svg` | Logo (shared with the Next.js app) |

## Key entry points

- **Portal hub:** `index.html`
- **User flow diagram:** `userflow.html`
- **Driver portal:** `wireframes/driver-login.html` → dashboard → forms
- **Admin portal:** `wireframes/admin-login.html` → dashboard → drivers / submissions

Do not edit these for production features — implement changes in `src/`.
