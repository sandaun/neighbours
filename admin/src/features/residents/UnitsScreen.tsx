import { useQuery } from '@tanstack/react-query';
import { CalendarClock, Users } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  createUnit,
  deleteUnit,
  isInUse,
  listMembers,
  listUnits,
  type UnitInput,
  type UnitRow,
  updateUnit,
} from './residents-api';
import { lengthError, TextField } from '@/components/Field';
import { CrudScreen, FormCard, type FormProps } from '@/features/content/CrudScreen';
import { useLengthMessages } from '@/features/content/messages';
import type { CrudApi } from '@/features/content/use-crud';
import { useCommunity } from '@/features/communities/CommunityLayout';
import { centsToInput, formatCents, parseEuros, parseSignedEuros } from '@/lib/money';
import { useClient } from '@/lib/use-client';

const unitsApi: CrudApi<UnitRow, UnitInput> = {
  key: 'units',
  list: listUnits,
  create: createUnit,
  update: updateUnit,
  remove: (client, row) => deleteUnit(client, row.id),
};

const formatDay = (value: string, language: string | undefined) =>
  new Intl.DateTimeFormat(language === 'es' ? 'es-ES' : 'ca-ES', {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`));

export function UnitsScreen() {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage;
  const { communityId } = useCommunity();
  const client = useClient();
  // Residents per unit, for context only; the list works without it.
  const members = useQuery({
    queryKey: ['members', communityId],
    queryFn: () => listMembers(client, communityId),
  });
  const residentsIn = (unitId: string) =>
    members.data?.filter((member) => member.unitId === unitId).length ?? 0;

  return (
    <CrudScreen
      api={unitsApi}
      communityId={communityId}
      title={t('units.title')}
      subtitle={t('units.subtitle')}
      addLabel={t('units.add')}
      emptyText={t('units.empty')}
      itemName={(row) => row.label}
      describeError={(error, action) =>
        action === 'delete' && isInUse(error) ? t('units.inUse') : null
      }
      renderItem={(row) => (
        <div className="flex flex-col gap-1.5">
          <span className="font-body font-semibold text-ink">{row.label}</span>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-soft">
            <span>
              {t('units.balance')}:{' '}
              <strong className={row.balance_cents < 0 ? 'text-danger' : 'text-ink'}>
                {formatCents(row.balance_cents, language)}
              </strong>
            </span>
            {row.next_charge_at && row.next_charge_cents !== null && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarClock aria-hidden size={14} />
                {t('units.nextCharge', {
                  amount: formatCents(row.next_charge_cents, language),
                  date: formatDay(row.next_charge_at, language),
                })}
              </span>
            )}
            {members.isSuccess && (
              <span className="inline-flex items-center gap-1.5">
                <Users aria-hidden size={14} />
                {t('units.residents', { count: residentsIn(row.id) })}
              </span>
            )}
          </div>
        </div>
      )}
      renderForm={(props) => <UnitForm {...props} />}
    />
  );
}

function UnitForm({ initial, pending, onSubmit, onCancel }: FormProps<UnitRow, UnitInput>) {
  const { t } = useTranslation();
  const messages = useLengthMessages();
  const [label, setLabel] = useState(initial?.label ?? '');
  const [balance, setBalance] = useState(centsToInput(initial?.balance_cents ?? 0));
  const [chargeAt, setChargeAt] = useState(initial?.next_charge_at ?? '');
  const [chargeAmount, setChargeAmount] = useState(centsToInput(initial?.next_charge_cents));
  const [submitted, setSubmitted] = useState(false);

  const balanceCents = parseSignedEuros(balance);
  const chargeCents = chargeAmount.trim() ? parseEuros(chargeAmount) : null;
  const errors = {
    label: lengthError(label, { max: 40 }, messages),
    balance: balanceCents === null ? t('units.invalidBalance') : null,
    chargeAmount: chargeAmount.trim() && chargeCents === null ? t('receipts.invalidAmount') : null,
    // The database requires both next-charge fields together, or neither.
    charge: Boolean(chargeAt) !== Boolean(chargeAmount.trim()) ? t('units.chargePair') : null,
  };
  const show = (error: string | null) => (submitted ? error : null);

  return (
    <FormCard
      title={initial ? t('units.edit') : t('units.add')}
      pending={pending}
      onCancel={onCancel}
      onSubmit={() => {
        setSubmitted(true);
        if (Object.values(errors).some(Boolean) || balanceCents === null) return;
        onSubmit({
          label: label.trim(),
          balance_cents: balanceCents,
          next_charge_at: chargeAt || null,
          next_charge_cents: chargeAt ? chargeCents : null,
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label={t('units.fields.label')}
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          error={show(errors.label)}
          placeholder={t('units.labelPlaceholder')}
          maxLength={40}
          disabled={pending}
        />
        <TextField
          label={t('units.fields.balance')}
          inputMode="decimal"
          value={balance}
          onChange={(event) => setBalance(event.target.value)}
          error={show(errors.balance)}
          hint={t('units.balanceHint')}
          disabled={pending}
        />
        <TextField
          label={t('units.fields.chargeAt')}
          type="date"
          value={chargeAt}
          onChange={(event) => setChargeAt(event.target.value)}
          error={show(errors.charge)}
          disabled={pending}
        />
        <TextField
          label={t('units.fields.chargeAmount')}
          inputMode="decimal"
          value={chargeAmount}
          onChange={(event) => setChargeAmount(event.target.value)}
          error={show(errors.chargeAmount)}
          hint={t('units.chargeHint')}
          placeholder="125,50"
          disabled={pending}
        />
      </div>
    </FormCard>
  );
}
