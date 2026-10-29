# MVP implementation contract

Scope: resident app, managed Supabase backend, and manual operation through the
Supabase dashboard. No administrator website, push delivery, bookings, voting,
or door integrations in this iteration. The community board and provider directory
are operator-maintained, read-only resident modules. Preserve the existing visual system.
Emergency contacts are a local demonstration in both data modes: four services,
an active `112` phone link, and three disabled placeholder numbers. They do not
use the provider directory or introduce backend writes.
The accounts screen includes a labeled local community-expense demonstration
before the resident's balance and receipts. Its five categories contain twelve
months of integer-cent amounts for 2026; annual values sum the same monthly
amounts. This chart is available in both data modes, uses the existing SVG
dependency, and does not derive community expenses from resident receipts or
change live financial records.

## Runtime

- `EXPO_PUBLIC_DATA_MODE=demo|supabase`. Default to `demo` only if neither Supabase
  URL nor key is supplied; incomplete/invalid live configuration must fail visibly.
- `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are public
  client configuration. Never put a secret/service role key in the app.
- Live mode uses email/password sign-in for manually provisioned Auth users with
  a preassigned membership. No public signup or client membership writes.
  Sessions persist securely on mobile; password sign-in does not send email.
- One active community/unit per resident for this MVP. Select the earliest
  membership deterministically; do not silently aggregate different communities.
- Auth client is `getSupabase()` from `@/lib/supabase`; returns a configured typed
  Supabase client or throws. `isDemoMode` is exported from `@/lib/app-config`.
- Auth UI exports `AuthProvider`, `useAuth` from `@/features/auth/AuthProvider`.
  Auth state includes `session`, `membership`, `status` (`loading`, `signed-out`,
  `ready`, `no-membership`, `error`), `error`, `retry`, `signOut`.

## Public data interfaces

Keep existing screen-facing types. Extend `Incident` via `IncidentDetail` with
`description`, `category`, optional `photoUrl`, and `updates` (`id`, `body`,
`createdAt`, `authorName`, optional `status`). Category is `plumbing`, `electrical`,
`elevator`, or `other`. Create input has `title`, `description`, `location`,
`category`, and optional `photo: { base64: string; mimeType: string }`.
`IncidentDetail.photoAsset?: number` supports a bundled image in local demo data.
Live photos continue to use private signed `photoUrl` values.

Add `getIncident(id): Promise<IncidentDetail>`,
`createIncident(input): Promise<IncidentDetail>`,
`getDocumentUrl(id): Promise<string>`, and `getReceiptUrl(id): Promise<string>`
to `AppDataSource`. Export `appDataSource` through `@/data` as before. Private file
URLs must be short lived. `Receipt.hasFile?: boolean` and `CommunityDocument.hasFile?: boolean` control PDF actions.
Document metadata may exist before its private attachment is uploaded.
`AccountsData.nextChargeAt` and `nextChargeCents` are nullable when unscheduled.

## Database contract

UUID primary keys except `community_members`, whose primary key is
`(community_id, user_id)`. All timestamp fields are `timestamptz`; money is integer
cents. Clients cannot assign membership, role, community, or receipt ownership.

- `communities`: `id`, `name`, `created_at`.
- `units`: `id`, `community_id`, `label`, `balance_cents`, nullable
  `next_charge_at` (date), nullable `next_charge_cents`, `created_at`.
- `community_members`: `community_id`, `user_id` (auth.users), nullable `unit_id`,
  `display_name`, `role` (`resident` or `admin`), `created_at`.
- `incidents`: `id`, `community_id`, `reporter_id`, `title`, `description`,
  `location`, `category`, `status` (`received`, `in-progress`, `resolved`),
  nullable `photo_path`, `reported_at`.
- `incident_updates`: `id`, `incident_id`, `body`, `author_name`, optional
  `status`, `created_at`. Dashboard operated, client read only.
- `documents`: `id`, `community_id`, `title`, `category`
  (`minutes`, `insurance`, `rules`), `file_size_bytes`, nullable `storage_path`, `updated_at`.
- `receipts`: `id`, `community_id`, `unit_id`, `concept`, `amount_cents`,
  `issued_at` (date), `period`, `status` (`paid`, `scheduled`), nullable `storage_path`.
- `community_events`: `id`, `community_id`, `title`, `location`, `starts_at`,
  nullable `ends_at`.

- `board_posts`: `id`, `community_id`, `title`, `body`, `author_name`, `topic`,
  `published_at`. Members read published posts; all client writes are denied.
- `directory_contacts`: `id`, `community_id`, `name`, `service`, nullable `phone`,
  `email`, `hours`, and `sort_order`. Member-only reads; operator-managed writes.

Private buckets: `incident-photos` and `community-documents`. Photo paths are
`community_id/incident_id/filename`; document/receipt paths begin with
`community_id/`. Document reads require a corresponding authorized row; receipt
reads additionally require unit ownership (or community administrator role).
All exposed tables and storage objects need explicit RLS and grants. Use foreign
keys to prevent linking a unit from a different community. Membership checks must
not recurse through their own RLS. No client status edits or administrative writes.

## Ownership during parallel work

- Backend agent: `supabase/`, `src/data/database.types.ts`,
  `src/data/supabase-data-source.ts`, adapter tests, `docs/backend-setup.md`.
- Auth agent: `src/lib/`, `src/features/auth/`, `src/app/login.tsx`, root layout,
  profile/language UI and auth locale files. Do not change data contracts.
- Incidents agent: incidents routes/components/tests and incident locale files.
- Coordinator: shared data contracts, mock adapter, data-source selection,
  data-loading hooks, document/receipt screens, shared locale registration,
  environment templates, dependencies, and integration.

Each agent uses its own worktree/branch and commits its changes. Only the
coordinator changes the remote project or applies migrations.
