# Neighbours

Resident community app built with Expo SDK 57, React Native, TypeScript, and the
existing NativeWind design system. The MVP covers manually provisioned email/password access,
incidents, private documents, receipts, a read-only calendar, profile, and language.
Administration is manual through Supabase; there is no administrator website.

## Run

Use Node.js 22.13 or newer and npm:

```sh
npm ci
cp .env.example .env.local
npm start
```

Open the app with an Expo SDK 57 compatible client, or use `npm run web`.
After changing public environment variables, restart Metro. Native permission
configuration changes take effect in a new native build.

## Data modes

- `EXPO_PUBLIC_DATA_MODE=demo` opens the offline preview with a visible demo label.
  Incident creation works in memory and resets when the app reloads. Demo document
  metadata contains no PDF files; its file actions are disabled.
- `EXPO_PUBLIC_DATA_MODE=supabase` requires the project URL and modern publishable
  key. The app opens the login screen until a session and community membership
  exist. Missing configuration, authentication failures, and missing membership
  have explicit states. Live mode never falls back to demo data.

Only use `EXPO_PUBLIC_SUPABASE_URL` and
`EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in the client. Secret/service role keys
must never enter the app, `.env.example`, commits, or public environment values.
Local environment files are ignored by Git.

## Backend and pilot setup

Follow [the backend setup guide](docs/backend-setup.md) to apply the migration,
create confirmed password users and memberships, upload PDFs, and
operate incidents. The checked-in Supabase config describes local development;
hosted Auth settings must be configured separately.

Incidents support bounded descriptions, optional JPEG/PNG/WebP photos up to
5 MiB, a status filter, and administrator updates. Documents and receipt PDFs open
through short-lived private URLs in the browser, where they can be saved. The
MVP reads account data; it does not collect payments or connect to a bank.

Voting, reservations, board publishing, door access, push notifications, and
administrator self-service are outside this iteration. Their existing preview
screens remain available in demo mode; live mode marks them as coming soon.

## Verification

```sh
npm run validate
npm run export
```

`validate` runs formatting, lint, TypeScript, and Jest. The backend guide describes
transactional SQL allow/deny tests and the remaining real-device checks. Test
fixtures must not be provisioned as production residents.

The shared implementation contract is in [docs/mvp-contract.md](docs/mvp-contract.md).

Initial verification on 18 October 2026: all 70 Jest tests, formatting, lint, and TypeScript
passed; production bundles exported for iOS, Android, and web. Browser checks
covered guarded routes, the bounded login, demo incident creation/detail/list
refresh/filtering, and Catalan/Spanish switching. Native picker behavior and a
real resident's end-to-end session remain unverified until the pilot is exercised.

After the password-login update, all 77 tests, formatting, lint, TypeScript, and
iOS/Android/web exports passed. The email/password screen was visually checked in
the iOS simulator. The hosted password endpoint rejected a deliberately invalid
test login with `invalid_credentials`; successful resident access and session
restoration still require a real resident sign-in.

The hosted project has both migrations recorded, eight RLS-protected app tables,
and two private buckets. Security Advisor reports no errors or warnings.
Performance Advisor reports no errors or warnings; its six informational unused
index suggestions are expected for a newly empty database. Hosted signup is
disabled. The first confirmed password user, test community, apartment, and
resident membership are now provisioned and verified. Native sign-in and real
incident/photo/PDF flows remain to be exercised. Password access does not require
SMTP; automatic invitations and password recovery by email are deferred. No
resident emails have been sent.

The dependency audit reports 78 existing advisories (17 moderate, 60 high, one
critical). Every flagged installed package/version was already present in the
baseline lockfile; none is a newly added or upgraded vulnerable package in this
change. Dependency remediation remains a separate release task; no automatic
major upgrades or framework downgrades were applied.
