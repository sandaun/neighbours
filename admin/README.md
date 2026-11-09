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

This first step is read-only: it lists the communities the account administers.
Administrative writes still require new RLS policies (planned next) and remain
denied by the database until then.

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
