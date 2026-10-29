# Pilot sample content

Generate metadata only using Python 3's standard library. This operation never
creates users, uploads files, sends messages, or changes membership.

```sh
python3 scripts/sample-data/generate.py \
  --community-id <existing-community-uuid> \
  --unit-id <existing-unit-uuid> \
  --reporter-id <existing-resident-uuid> \
  --date 2026-10-27
```

The three IDs must describe one existing membership. Use the pilot community,
not a real resident community. `--date` anchors all historical and future dates.
The ignored `.sample-data/` output contains `manifest.json`, `seed.sql`, and
`parking-post-update.sql`.
Review the manifest and SQL before applying `seed.sql` in the project's SQL
editor. Apply the checked-in migrations first.

For an already seeded pilot, review and apply `parking-post-update.sql` separately
to replace Marta Vidal's original meeting post with the garage rental message.
It targets one deterministic post ID in the selected community, checks the
existing membership, and only updates the unchanged original sample text. It is
safe to rerun and preserves operator edits. Generating these files does not apply
any changes to the hosted database.

The dataset adds 30 incidents (10 in each state), 60 incident updates, 15 document
records, 16 receipts, 25 calendar events, 18 board posts, and 12 directory contacts.
It uses the existing resident as incident reporter and labels board authors and
providers as samples. Contact email addresses use `example.com`; telephone numbers
are left empty. No additional accounts are needed.

Documents and receipts have no attached files. Their PDF controls stay disabled.
The operator can attach real private files later using the existing upload flow.

The client demonstration includes David Colom's original `humitat.jpg` as
`assets/images/demo/incident-damp-wall.jpg`. The local demo displays this bundled
asset in the storage-room incident. For the connected pilot, upload the same file
to the private `incident-photos` bucket at
`<community-id>/<incident-id>/photo.jpg`, using the existing incident titled
`Humitat a la paret del traster`. Attach that path to its `photo_path` only if no
photo is already attached. This upload and association are deferred to the final
pilot content update together with the board message and topic changes. No
resolution photo, new bucket, or permission changes are needed.

IDs are deterministic for each community/unit/content key. Reapplying a generated
seed uses `ON CONFLICT DO NOTHING`, preserving existing and operator-edited rows.
The generator never deletes content. Regenerating with another date does not
move already-inserted records; use a new test community/unit for a fresh timeline.

The unit's next charge is initialized only if it has a zero balance and both
charge fields are unset. Its amount equals all scheduled sample receipts due on
the earliest scheduled date. Existing balances and charge schedules are preserved.

Verification:

- Run `npm run validate` for the adapters and app.
- Run both SQL tests in `supabase/tests/`; each rolls its fixtures back.
- Reapply `seed.sql` and verify counts are unchanged.
- Sign in as the existing resident and inspect all populated destinations.
