import { useQuery } from '@tanstack/react-query';
import { Check, Copy, Home, Info, KeyRound, Mail } from 'lucide-react';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  type CreatedResident,
  createResident,
  CreateResidentError,
  listMembers,
  listUnits,
  type Member,
  type MemberInput,
  removeMember,
  updateMember,
} from './residents-api';
import { Button } from '@/components/Button';
import { lengthError, TextField } from '@/components/Field';
import { Select } from '@/components/Select';
import { useAuth } from '@/features/auth/AuthProvider';
import { CrudScreen, FormCard, type FormProps } from '@/features/content/CrudScreen';
import { useLengthMessages } from '@/features/content/messages';
import type { CrudApi } from '@/features/content/use-crud';
import { useCommunity } from '@/features/communities/CommunityLayout';
import type { UnitRow } from '@shared/database';
import { useClient } from '@/lib/use-client';

type ResidentInput = MemberInput & { email?: string };

const membersApi: CrudApi<Member, ResidentInput> = {
  key: 'members',
  list: listMembers,
  create: async (client, communityId, input) => {
    const email = (input.email ?? '').trim().toLowerCase();
    const result = await createResident(client, communityId, {
      email,
      displayName: input.displayName,
      unitId: input.unitId,
    });
    return { ...result, email, displayName: input.displayName };
  },
  update: (client, id, input, communityId) => updateMember(client, communityId, id, input),
  remove: (client, row, communityId) => removeMember(client, communityId, row.id),
};

export function ResidentsScreen() {
  const { t } = useTranslation();
  const { communityId } = useCommunity();
  const client = useClient();
  const myId = useAuth().session?.user.id;
  const units = useQuery({
    queryKey: ['units', communityId],
    queryFn: () => listUnits(client, communityId),
  });
  const unitLabel = (id: string | null) =>
    units.data?.find((unit) => unit.id === id)?.label ?? t('residents.noUnit');
  const [added, setAdded] = useState<Added | null>(null);
  return (
    <CrudScreen
      api={membersApi}
      communityId={communityId}
      title={t('residents.title')}
      subtitle={t('residents.subtitle')}
      addLabel={t('residents.add')}
      emptyText={t('residents.empty')}
      itemName={(row) => row.displayName}
      // Admins (including oneself) are managed by the project owner.
      canModify={(row) => row.role === 'resident' && row.id !== myId}
      labels={{
        deleteLabel: (name) => t('residents.removeLabel', { name }),
        confirmDelete: (name) => t('residents.confirmRemove', { name }),
        confirmYes: t('residents.confirmYes'),
        deleted: t('residents.removed'),
      }}
      describeError={(error, action) =>
        action === 'save' && error instanceof CreateResidentError
          ? t(`residents.createErrors.${error.code}`)
          : null
      }
      onSaved={(result, created) => {
        if (!created) return;
        const outcome = result as CreatedResident & { email?: string; displayName?: string };
        setAdded({
          name: outcome.displayName ?? '',
          email: outcome.email ?? '',
          password: outcome.password ?? null,
        });
      }}
      toolbar={
        added ? (
          <NewResidentPanel added={added} onClose={() => setAdded(null)} />
        ) : (
          <p className="flex items-start gap-2 rounded-lg bg-surface-hi px-4 py-3 text-sm text-ink-soft">
            <Info aria-hidden size={16} className="mt-0.5 shrink-0 text-primary" />
            {t('residents.howToAdd')}
          </p>
        )
      }
      renderItem={(row) => (
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-body font-semibold text-ink">{row.displayName}</span>
            {row.role === 'admin' && (
              <span className="rounded-md bg-primary/10 px-2 py-0.5 font-label text-[11px] text-primary-dark">
                {t('residents.admin')}
              </span>
            )}
            {row.id === myId && (
              <span className="rounded-md bg-surface-hi px-2 py-0.5 font-label text-[11px] text-ink-soft">
                {t('residents.you')}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-soft">
            <span className="inline-flex items-center gap-1.5 break-all">
              <Mail aria-hidden size={14} />
              {row.email}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Home aria-hidden size={14} />
              {unitLabel(row.unitId)}
            </span>
          </div>
        </div>
      )}
      renderForm={(props) => <MemberForm {...props} units={units.data ?? []} />}
    />
  );
}

function MemberForm({
  initial,
  pending,
  onSubmit,
  onCancel,
  units,
}: FormProps<Member, ResidentInput> & { units: UnitRow[] }) {
  const { t } = useTranslation();
  const messages = useLengthMessages();
  const unitId = useId();
  const [name, setName] = useState(initial?.displayName ?? '');
  const [email, setEmail] = useState('');
  const [unit, setUnit] = useState(initial?.unitId ?? '');
  const [submitted, setSubmitted] = useState(false);
  const nameError = lengthError(name, { max: 160 }, messages);
  const emailError = initial
    ? null
    : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
      ? null
      : t('residents.invalidEmail');

  return (
    <FormCard
      title={initial ? t('residents.edit') : t('residents.add')}
      pending={pending}
      onCancel={onCancel}
      onSubmit={() => {
        setSubmitted(true);
        if (nameError || emailError) return;
        onSubmit({
          displayName: name.trim(),
          unitId: unit || null,
          ...(initial ? {} : { email: email.trim() }),
        });
      }}
    >
      {initial ? (
        <p className="text-sm text-ink-soft">{initial.email}</p>
      ) : (
        <TextField
          label={t('residents.fields.email')}
          type="email"
          autoComplete="off"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={submitted ? emailError : null}
          hint={t('residents.emailHint')}
          maxLength={254}
          disabled={pending}
        />
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label={t('residents.fields.name')}
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={submitted ? nameError : null}
          hint={t('residents.nameHint')}
          maxLength={160}
          disabled={pending}
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor={unitId} className="font-label text-xs text-ink-soft">
            {t('residents.fields.unit')}
          </label>
          <Select
            id={unitId}
            value={unit}
            onValueChange={setUnit}
            disabled={pending}
            options={[
              { value: '', label: t('residents.noUnit') },
              ...units.map((option) => ({ value: option.id, label: option.label })),
            ]}
          />
          <p className="text-xs text-ink-muted">{t('residents.unitHint')}</p>
        </div>
      </div>
    </FormCard>
  );
}

type Added = { name: string; email: string; password: string | null };

// Shown once after adding a resident. The password is not stored anywhere else:
// once this panel closes it cannot be recovered, only replaced.
function NewResidentPanel({ added, onClose }: { added: Added; onClose(): void }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const text = t('residents.credentialsText', { email: added.email, password: added.password });
  return (
    <section
      aria-labelledby="new-resident-title"
      className="flex w-full flex-col gap-3 rounded-xl border border-secondary/60 bg-secondary/10 p-5"
    >
      <h2 id="new-resident-title" className="font-display text-xl text-ink">
        {added.password
          ? t('residents.createdTitle', { name: added.name })
          : t('residents.linkedTitle', { name: added.name })}
      </h2>
      {added.password ? (
        <>
          <dl className="grid gap-2 sm:grid-cols-[auto_1fr] sm:gap-x-4">
            <dt className="font-label text-xs text-ink-soft">{t('residents.fields.email')}</dt>
            <dd className="break-all text-ink">{added.email}</dd>
            <dt className="font-label text-xs text-ink-soft">{t('residents.password')}</dt>
            <dd className="font-mono text-lg tracking-wider text-ink">{added.password}</dd>
          </dl>
          <p className="flex items-start gap-2 text-sm text-ink-soft">
            <KeyRound aria-hidden size={16} className="mt-0.5 shrink-0 text-tertiary-txt" />
            {t('residents.passwordOnce')}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard
                  ?.writeText(text)
                  .then(() => setCopied(true))
                  .catch(() => setCopied(false));
              }}
            >
              {copied ? <Check aria-hidden size={16} /> : <Copy aria-hidden size={16} />}
              {copied ? t('residents.copied') : t('residents.copy')}
            </Button>
            <Button onClick={onClose}>{t('residents.done')}</Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-ink-soft">
            {t('residents.linkedBody', { email: added.email })}
          </p>
          <div>
            <Button onClick={onClose}>{t('residents.done')}</Button>
          </div>
        </>
      )}
    </section>
  );
}
