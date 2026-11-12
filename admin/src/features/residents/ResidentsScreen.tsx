import { useQuery } from '@tanstack/react-query';
import { Home, Info, Mail } from 'lucide-react';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  listMembers,
  listUnits,
  type Member,
  type MemberInput,
  removeMember,
  updateMember,
} from './residents-api';
import { lengthError, TextField } from '@/components/Field';
import { Select } from '@/components/Select';
import { useAuth } from '@/features/auth/AuthProvider';
import { CrudScreen, FormCard, type FormProps } from '@/features/content/CrudScreen';
import { useLengthMessages } from '@/features/content/messages';
import type { CrudApi } from '@/features/content/use-crud';
import { useCommunity } from '@/features/communities/CommunityLayout';
import type { UnitRow } from '@shared/database';
import { useClient } from '@/lib/use-client';

const membersApi: CrudApi<Member, MemberInput> = {
  key: 'members',
  list: listMembers,
  // Accounts are created by the project owner for now; the screen hides "add".
  create: () => Promise.reject(new Error('Not available from the backoffice.')),
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
  return (
    <CrudScreen
      api={membersApi}
      communityId={communityId}
      title={t('residents.title')}
      subtitle={t('residents.subtitle')}
      addLabel=""
      allowCreate={false}
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
      toolbar={
        <p className="flex items-start gap-2 rounded-lg bg-surface-hi px-4 py-3 text-sm text-ink-soft">
          <Info aria-hidden size={16} className="mt-0.5 shrink-0 text-primary" />
          {t('residents.howToAdd')}
        </p>
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
}: FormProps<Member, MemberInput> & { units: UnitRow[] }) {
  const { t } = useTranslation();
  const messages = useLengthMessages();
  const unitId = useId();
  const [name, setName] = useState(initial?.displayName ?? '');
  const [unit, setUnit] = useState(initial?.unitId ?? '');
  const [submitted, setSubmitted] = useState(false);
  const nameError = lengthError(name, { max: 160 }, messages);

  return (
    <FormCard
      title={t('residents.edit')}
      pending={pending}
      onCancel={onCancel}
      onSubmit={() => {
        setSubmitted(true);
        if (nameError) return;
        onSubmit({ displayName: name.trim(), unitId: unit || null });
      }}
    >
      <p className="text-sm text-ink-soft">{initial?.email}</p>
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
