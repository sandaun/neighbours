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

## Configure manually provisioned password access

The MVP uses email/password sign-in and persists the session on the device.
Custom SMTP is not required to sign in with a manually provisioned, confirmed
account. Public signup remains disabled in both local and hosted configuration.

In the hosted dashboard:

1. Keep email authentication enabled and public signup/anonymous sign-in disabled.
2. Open Authentication > Users > Add user > Create new user. Enter the resident's
   email and a unique password, and enable Auto Confirm User. Use Create user,
   rather than Send invitation, to avoid sending an email. Confirm the resident's
   identity through the pilot's manual onboarding before confirming the account.
3. Copy the created user's UUID and assign their community/unit membership as
   described below. The app uses `signInWithPassword`; it cannot create an account
   or assign access itself. Never put administrator credentials in the client.
4. Set `EXPO_PUBLIC_DATA_MODE=supabase` in the ignored `.env.local`, then restart
   Metro. Sign in on the simulator/device and verify session restoration after
   restarting the app, local signout, and access to the assigned community.

Until an email service is configured, account access and password recovery are
handled by the operator through the dashboard. The login directs residents to
contact their administrator. Automated invitations, recovery emails, and email
codes are deferred; configure verified SMTP and the corresponding app flows
before offering those features.

On 18 October 2026, a confirmed password user was manually created and assigned
as a resident to the pilot community and its test apartment. The assignment was
verified against Auth and the membership/community/unit tables. Public signup
remains disabled and no invitation or OTP emails have been sent. Successful
native resident sign-in/session restoration and private-file HTTP operations
remain to be verified. The pilot starts with empty incident/document/receipt
lists; residents can create the first incident from the app.

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
  transaction when they describe the same operation. Once the admin incident
  migration below is applied, community administrators can do the same from the
  backoffice through `admin_add_incident_update`.
- Maintain real `community_events` rows for the app's home and calendar. Use
  timezone-aware timestamps; `ends_at` is optional and cannot precede the start.
- Documents, receipts, and balances are manually maintained data. `paid` records
  a known receipt state; the app does not execute payments or reconcile a bank.
- The accounts expense chart is explicitly labeled as demonstration data. It is
  local to the app in both data modes and does not change real balances, charges,
  or receipts. Monthly and annual views use the same five-category example data.
- Emergency contacts use a local demonstration screen in both data modes. It
  displays four services; only `112` has an active phone action. Numbers shown
  with `X` are placeholders and their call buttons are disabled. No database
  tables, policies, or contact records are changed for this screen.
- Voting uses a local demonstration in both data modes, with seeded results,
  one local vote or delegation, and a fixed example meeting date. Choices reset
  when the screen remounts and never write to Supabase.
- Reservations, access, notification
  preferences, and privacy actions return no invented live data. Their generic
  module destination is explicitly marked as coming soon.
- For access removal, delete the membership. New database/storage requests fail
  immediately. For account deletion, revoke sessions first, then consider record
  retention: an Auth user referenced as an incident reporter cannot be deleted
  without resolving those references.

## Security model and references

All public tables have RLS. `community_members` selects only `auth.uid()`'s own
rows, so other table policies can query membership without recursion. The
application introduces no user-metadata authorization or privileged app
credentials. Its only `SECURITY DEFINER` function and public RPC is
`admin_add_incident_update`, described below. The pre-existing hosted
`SECURITY DEFINER` bootstrap event-trigger function keeps its operator/service
access and has no client EXECUTE access after the follow-up migration.
No browser/mobile membership writes,
administrative table writes, storage replacements, or storage deletes are granted.

- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Storage access control](https://supabase.com/docs/guides/storage/security/access-control)
- [Private file URLs](https://supabase.com/docs/guides/storage/serving/downloads)
- [SMTP](https://supabase.com/docs/guides/auth/auth-smtp)
- [Expo SDK 58 reference](https://docs.expo.dev/versions/v58.0.0/)
- [CLI 2.121.0 migration history source](https://github.com/supabase/cli/blob/v2.121.0/apps/cli/src/command-internal/migration-history.ts)
- [CLI 2.121.0 repair handler](https://github.com/supabase/cli/blob/v2.121.0/apps/cli/src/commands/migration/repair/repair.handler.ts)


## Community board, directory, and pilot sample content

Migration `20261027222906_community_board_and_directory.sql` adds `board_posts`
and `directory_contacts`. Members can read only their own community's content;
future-dated posts are hidden until publication. All client writes are denied,
including administrator accounts. Maintain these tables through the dashboard.
The Home shows the three latest published posts from the same source as the board.
There is no posting or commenting workflow in this iteration.

Migration `20261027223735_allow_documents_without_files.sql` permits document
metadata without a Storage object, just as receipts already support. The app
keeps PDF actions disabled until an actual `storage_path` is assigned. A document
without an attachment has `file_size_bytes = 0`. Attaching a file later uses the
existing private bucket, namespace, and authorization policy.

`scripts/sample-data/generate.py` generates metadata-only sample content for an
existing pilot membership, without dependencies or credentials. See its adjacent
README for the exact command, counts, date anchoring, and repeatability behavior.
The generated SQL is a separate operator action, never an automatic migration or
application startup effect. It preserves existing rows and sends no messages.

`supabase/tests/community_content_rls.test.sql` verifies cross-community isolation,
scheduled publication, read-only grants, revocation, and anonymous denial.

On 27 October 2026, both content migrations were applied to the pilot project
and recorded atomically in migration history. The metadata-only seed was first
run twice inside a rolled-back transaction to verify repeatability, then applied
once. The existing incident was preserved: final counts were 31 incidents,
15 documents, 16 receipts, 25 events, 18 posts, and 12 contacts. No PDFs were
uploaded. Both transactional SQL test suites passed against the hosted project;
`npm run validate` passed 16 suites and 82 tests. Device rendering was not verified
in this operation. No build or over-the-air update was published.

## Administrator incident updates (pending deployment)

Migration `20261109100000_admin_incident_updates.sql` adds
`public.admin_add_incident_update(p_incident_id, p_body, p_status default null)`
for the web backoffice in `admin/`. It has not been applied to the hosted project.

- Only a signed-in member whose `community_members.role` is `admin` in the
  incident's community can call it. Missing incidents and other communities'
  incidents return the same `42501` error. Anonymous callers have no EXECUTE.
- In one transaction it changes `incidents.status` when a different valid status
  is given, and appends an `incident_updates` row. The body is trimmed; the author
  is always the caller's membership display name, never client input.
- It is `SECURITY DEFINER` with an empty pinned `search_path` because no table
  grant can express this safely: residents already update `photo_path` through a
  reporter policy, and permissive policies are combined, so a column grant on
  `status` would also let reporters close their own incidents. No existing grant
  or policy changes; direct client status edits and update inserts stay denied.

`supabase/tests/admin_incident_updates.test.sql` covers the function shape and
privileges, atomic status/update writes, trimming, author integrity, invalid input
without partial writes, cross-community isolation, residents, a missing JWT
subject, admin revocation, and anonymous access.

On 9 November 2026 the four existing migrations and this one were applied to a
local PostgreSQL 16 database with minimal Auth/Storage stand-ins and Supabase's
default `public` privileges. All three transactional SQL suites passed. The new
suite failed before the migration existed, and it detected each of six deliberate
faults (no role check, no community check, anonymous EXECUTE, unpinned search
path, client-supplied author, status not written). Hosted Auth, PostgREST, and
the advisors were not exercised. Before applying remotely, run
`supabase db push --dry-run`, then the three SQL suites and the advisors.

## Administrator calendar, board, and directory (pending deployment)

Migration `20261109110000_admin_community_content.sql` lets community
administrators create, edit, and delete `community_events`, `board_posts`, and
`directory_contacts` from the backoffice. It has not been applied to the hosted
project.

- `authenticated` receives column-limited INSERT/UPDATE and DELETE grants. Every
  write needs a policy that requires `role = 'admin'` in the row's community, so
  residents get an RLS error on INSERT and affect no rows on UPDATE/DELETE.
- `id` and `community_id` are not updatable, so a row cannot be moved to another
  community. Existing check constraints still apply (blank text, empty optional
  contact fields, an event ending before it starts).
- Admins also read their communities' scheduled board posts
  (`board_posts_admin_read`); residents still see only published posts.

`supabase/tests/admin_community_content.test.sql` covers admin writes, an admin
who is a resident in another community, immutable communities, residents, admin
role revocation, and anonymous access. `community_content_rls.test.sql` no longer
asserts that clients hold no write grants; it now asserts that resident writes
fail or change no rows, which holds before and after this migration.

On 9 November 2026 all six migrations and the four SQL suites passed on the local
PostgreSQL 16 stand-in. The new suite detected deliberate faults: resident inserts,
movable communities, residents reading scheduled posts, cross-community deletes,
cross-community edits (when both policy clauses are weakened), and anonymous
writes. Hosted PostgREST and the advisors were not exercised.

## Administrator documents and receipts (pending deployment)

Migration `20261109120000_admin_documents_receipts.sql` lets community
administrators publish `documents` and `receipts` with their private PDFs from the
backoffice. It has not been applied to the hosted project.

- Table writes follow the calendar pattern: column-limited grants and admin-only
  policies. `id`, `community_id`, and a receipt's `unit_id` cannot be updated, and
  the existing path checks keep each PDF in its community/unit namespace.
- Storage: admins can upload into `<community_id>/documents/` and
  `<community_id>/receipts/<unit_id>/` of their own communities (the unit must
  belong to that community), read every file there (including uploads not yet
  attached to a row), and delete them. `authenticated` receives DELETE on
  `storage.objects`; no UPDATE/upsert policy exists, so files are never replaced in
  place. Residents' Storage access is unchanged.
- The backoffice uploads a PDF under a new UUID name before writing the row,
  removes that upload if the row write fails, and removes the previous file after a
  successful replacement or deletion. A leftover file is unreadable to residents.

`supabase/tests/admin_documents_receipts.test.sql` covers table and Storage writes,
namespace and unit checks, path traversal, an admin who is a resident elsewhere,
incident photos, residents, admin role revocation, and anonymous access. One
assertion in `resident_rls.test.sql` changed from "denied" to "no rows changed"
for a resident document update, which holds before and after this migration.

On 9 November 2026 all seven migrations and the five SQL suites passed on the
local PostgreSQL 16 stand-in, and the new suite detected nine deliberate faults
(resident inserts and uploads, receipt folders not tied to a unit, cross-community
file reads/deletes, deletes outside the bucket, a movable receipt unit, and
cross-community receipt edits and document deletes). Hosted Storage HTTP uploads,
signed URLs, and the advisors were not exercised.
