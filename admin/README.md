# Neighbours backoffice

Web backoffice for community administrators, built with Vite, React, TypeScript,
and Tailwind CSS. It uses the same Supabase project, schema types, and design
tokens as the resident app, but it is a separate project with its own
dependencies, lint, tests, and build.

## Run

```sh
cd admin
npm ci
cp .env.example .env.local   # add the publishable key
npm run dev
```

Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` belong in the
environment. Vite exposes every `VITE_*` value to the browser: never add a
secret or service role key.

## Access

Sign-in uses Supabase email/password. Only accounts with at least one
`community_members` row whose `role` is `admin` get past the login; resident
accounts see a "no administration permissions" screen. To grant access, add or
update that membership in the Supabase dashboard.

## Features

- **Communities**: the communities the account administers.
- **Incidents** (per community): list with status filters, detail with the
  description, the private photo (short-lived signed URL) and the update history,
  and a reply form that can also change the status. Replies go through
  `admin_add_incident_update` (migration `20261109100000_admin_incident_updates`);
  until that migration is applied to the Supabase project, publishing a reply
  fails with an error and nothing is written. Residents see the reply in the app.

- **Calendar, board, directory** (per community): list, create, edit, and delete
  events, board posts (including scheduled publication), and provider contacts.
  Requires migration `20261109110000_admin_community_content`.

- **Documents and receipts** (per community): upload private PDFs (up to 20 MB)
  for community documents and per-unit receipts, replace or remove them, and
  open them through short-lived links. Requires migration
  `20261109120000_admin_documents_receipts`.

Routes are client-side (`/communities/:id/incidents`, `/events`, `/board`, `/directory`, `/documents`, `/receipts`). When hosting
the built `dist/`, serve `index.html` for unknown paths so deep links work.

## Verify

```sh
npm run validate   # ESLint, TypeScript, Vitest, production build
```

## Boundaries with the resident app

- No imports from the app's `src/` except the type-only `@shared/database`
  alias (`src/data/database.types.ts`), which is erased at build time.
- The app's TypeScript, Jest, ESLint, and Metro configurations exclude `admin/`.
  The root Prettier check still formats it with the shared style.
- Design tokens in `src/index.css` mirror `../tailwind.config.js`; keep both in
  sync when a token changes.
