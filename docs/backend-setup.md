# Resident MVP backend

The app uses Supabase Auth, Postgres, and two private Storage buckets. Operations
are performed manually in the Supabase dashboard. No administrator website or
Edge Functions are required for this iteration.

Target project: `ttrgbzqedarelznbdiye`. Applying migrations changes that project;
the coordinator owns all remote operations. Never put a secret/service role key
in Expo public environment variables or application code.

## Apply and verify

The base migration is `supabase/migrations/20261018100713_resident_mvp.sql`. It creates
eight tables, explicit client grants, row policies, and private buckets. It has
no demo seed and contains no Auth users or email delivery calls.
The follow-up `20261018102837_restrict_rls_event_trigger_execution.sql` only
removes client execution privileges from the hosted bootstrap event-trigger
function, when that function exists and returns `event_trigger`.

With the Supabase CLI authenticated and linked to the intended project, inspect
the proposed changes with `supabase db push --dry-run` before `supabase db push`.
Alternatively, run the complete migration in one transaction in the dashboard
SQL editor. A manual SQL-editor application does not record migration history:
reconcile the history before a later CLI push so it does not run the same file
again. Do not reset an existing remote database.

If authenticated CLI access is available, the standard history repair is:

```sh
npx --yes supabase@2.121.0 migration repair 20261018100713 --status applied --linked --project-ref ttrgbzqedarelznbdiye
```

When CLI credentials are unavailable, `supabase/operations/record_resident_mvp.sql`
provides a one-time dashboard alternative after the deployment is verified. It
creates the CLI's private history table and records version `20261018100713`,
name `resident_mvp`, and all 44 original SQL statements as metadata. It does not
execute the stored application SQL or change its deployed migration. It grants
clients nothing, enables RLS on the bookkeeping table, and revokes their access
to the bookkeeping schema/table.
Re-running the operation updates the same version; it never truncates history.
This file is outside `supabase/migrations/` so it is not a new application migration.

For local verification with Docker running:

```sh
npx --yes supabase@2.121.0 start
npx --yes supabase@2.121.0 db reset --local
npx --yes supabase@2.121.0 test db
npx --yes supabase@2.121.0 db advisors --local --type all
```

`supabase/tests/resident_rls.test.sql` is a transactional TAP test. Its temporary
Auth users, two communities, neighbour units, receipts, and files always roll
back. It checks resident/admin reads, cross-community and cross-unit isolation,
column grants, forged reporter/status/date/ownership, photo paths, PDF namespaces,
revocation, and anonymous access. An SQL error aborts the test; assertions are
explicitly enabled. Do not run fixtures separately from the transaction.

Supabase Storage may retain its default UPDATE/DELETE grants. With no matching
RLS policy those operations safely affect zero rows, rather than raising a grant
error. The suite checks both outcomes and requires no mutation; it also accepts
either an empty anonymous Storage SELECT or an explicit permission error.

After applying remotely, run security/performance advisors and the transactional
test against that project, then verify an invited resident on a real device.
Regenerate `src/data/database.types.ts` against the migrated schema with the CLI
`gen types typescript` command. The checked-in type snapshot supports the initial
implementation; regeneration should preserve the screen-facing types.

On 18 October 2026 the coordinator applied the migration to
`ttrgbzqedarelznbdiye` through the dashboard and ran the transactional RLS suite
successfully against the real Supabase database. Post-deployment inspection found
all eight application tables with RLS enabled, both buckets private, and zero Auth
users/communities remaining after the test transaction rolled back. The manually
applied migration initially had no CLI history table. The coordinator then
completed the history repair: version `20261018100713`, name `resident_mvp`, and
44 statements are recorded. Both anonymous and authenticated roles have neither
schema usage nor history-table SELECT privileges. The private history table also
has RLS enabled; the owner used by the CLI retains access.

The follow-up migration was applied and recorded atomically as version
`20261018102837`, bringing the history count to two. Remote verification confirmed
`public.rls_auto_enable()` execution is denied to `anon` and `authenticated`,
retained for `service_role`, and its existing `ensure_rls` event trigger remains
enabled (`O`). The function body, owner, and trigger definition were unchanged.
The base migration was not edited after deployment.

The migration and SQL tests also passed in temporary PGlite (PostgreSQL WASM),
using minimal Auth/Storage fixtures, both with and without default Storage DML
grants. This isolated check covers constraints, grants, and RLS behavior. Neither
SQL test verifies email delivery, Storage HTTP uploads/signed URL responses, or a
real resident's mobile session. A separate isolated PostgreSQL event-trigger test
confirmed the follow-up skips an absent function, rejects an unexpected return
type, preserves service-role access, and leaves automatic RLS activation working
after client EXECUTE privileges are revoked. Docker was unavailable for a local
full stack.

## Configure invite-only email OTP

Local `supabase/config.toml` disables public signup and anonymous sign-in. These
settings do not automatically change the hosted project's Auth settings. In the
hosted dashboard:

1. Disable public email signup and anonymous sign-in.
2. Keep email authentication enabled and configure a verified custom SMTP sender
   for a real pilot. The default email service is restricted and rate limited.
3. Set the Magic Link email template to include `{{ .Token }}` as the visible
   sign-in code. The resident enters this code in the app; a link alone is not
   the implemented flow. Use a short OTP lifetime (local config: 600 seconds).
4. Create the pilot's Auth users administratively, then assign their membership.
   The app calls `signInWithOtp` with `shouldCreateUser: false` and cannot create
   an account or assign access itself. Administrative invitation emails are a
   separate operation; do not send them implicitly while setting up tables.

Current hosted status: public signup is disabled. Custom SMTP is still pending;
the dashboard currently locks email-template editing until SMTP is configured.
No invitation or OTP emails have been sent, and no live Auth users, communities,
or memberships have been provisioned. Email-code delivery, the first resident's
native sign-in/session flow, and actual private-file HTTP operations remain to be
verified after SMTP and the first pilot membership are configured. The passing
SQL suite and demo smoke test do not establish those live user flows.

## Provision a community

Using the dashboard Table Editor or SQL Editor as an operator:

1. Add a `communities` row and its `units`. Set the unit balance in integer cents.
   Set both `next_charge_at` and `next_charge_cents`, or leave both null.
2. Add each existing Auth user's `community_members` row with its community,
   unit, display name, and `resident` role. A composite foreign key rejects a unit
   from another community. A resident needs a unit to see accounts.
3. For an operator account, `admin` permits reading all units/receipts in that
   community. All client administrative writes remain denied, including admin
   accounts; the dashboard is the management interface for this iteration.

The app selects one membership ordered by `created_at`, then `community_id`.
Provision one active community/unit per pilot resident. RLS permits access to
all communities explicitly assigned to an account, but the app displays only the
selected one and never merges finances across communities.

## Upload PDFs and maintain records

Upload PDFs into the private `community-documents` bucket, then create their
metadata row. File paths must use these distinct namespaces:

```text
Documents: <community_id>/documents/<unique-name>.pdf
Receipts:  <community_id>/receipts/<unit_id>/<unique-name>.pdf
```

Use letters, digits, dots, underscores, and hyphens in the filename, beginning
with a letter or digit. A `documents` row requires its title, category (`minutes`,
`insurance`, or `rules`), actual byte size, and exact `storage_path`. A `receipts`
row requires its community/unit, concept, cents, issue date, period, and `paid`
or `scheduled` status. Leave its path null if no PDF exists; the app hides the PDF
action. The bucket limits PDF uploads to 20 MiB.

Storage SELECT requires an authorized metadata row with the exact same path.
Receipts require unit membership or the community's admin role. Disjoint paths
prevent publishing a receipt as an ordinary community document. Uploading a file
alone grants no resident access. Do not insert directly into `storage.objects`
when managing real files: upload through the Storage UI/API.

Resident-created incident photos use the private `incident-photos` bucket:
`<community_id>/<incident_id>/photo.jpg`, `photo.png`, or `photo.webp`. Uploads
require an existing incident reported by the current member, allowed image MIME,
and a maximum of 5 MiB. The client may update only its own `photo_path` column;
the database rejects another incident's path. It cannot reassign the reporter,
community, timestamps, or status. Other community members can read the attached
photo, but cannot replace or delete it.

If a photo upload/attachment fails, incident creation still succeeds and the app
shows a warning. Operators can remove unreferenced photo objects manually. No
automatic cleanup job is required for the pilot. The app requests signed URLs
lasting 120 seconds when opening private files; already issued URLs remain valid
until expiry after membership revocation.

## Operate the pilot

- Review new `incidents` rows in the dashboard. Update `status` there and insert
  an `incident_updates` row with `incident_id`, body, operator display name, and
  optional status. Change the incident's status and append the update in one SQL
  transaction when they describe the same operation.
- Maintain real `community_events` rows for the app's home and calendar. Use
  timezone-aware timestamps; `ends_at` is optional and cannot precede the start.
- Documents, receipts, and balances are manually maintained data. `paid` records
  a known receipt state; the app does not execute payments or reconcile a bank.
- Voting, board, reservations, directory, access, emergency contacts, notification
  preferences, and privacy actions return no invented live data. Their generic
  module destination is explicitly marked as coming soon.
- For access removal, delete the membership. New database/storage requests fail
  immediately. For account deletion, revoke sessions first, then consider record
  retention: an Auth user referenced as an incident reporter cannot be deleted
  without resolving those references.

## Security model and references

All public tables have RLS. `community_members` selects only `auth.uid()`'s own
rows, so other table policies can query membership without recursion. The
application introduces no `SECURITY DEFINER` helpers, public RPCs, user-metadata
authorization, or privileged app credentials. The pre-existing hosted
`SECURITY DEFINER` bootstrap event-trigger function keeps its operator/service
access and has no client EXECUTE access after the follow-up migration.
No browser/mobile membership writes,
administrative table writes, storage replacements, or storage deletes are granted.

- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Storage access control](https://supabase.com/docs/guides/storage/security/access-control)
- [Private file URLs](https://supabase.com/docs/guides/storage/serving/downloads)
- [SMTP](https://supabase.com/docs/guides/auth/auth-smtp)
- [Expo SDK 57 reference](https://docs.expo.dev/versions/v57.0.0/)
- [CLI 2.121.0 migration history source](https://github.com/supabase/cli/blob/v2.121.0/apps/cli/src/command-internal/migration-history.ts)
- [CLI 2.121.0 repair handler](https://github.com/supabase/cli/blob/v2.121.0/apps/cli/src/commands/migration/repair/repair.handler.ts)
