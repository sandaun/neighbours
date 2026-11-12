import { useQuery } from '@tanstack/react-query';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { FileField, fileError, OpenPdfButton } from './FileField';
import {
  createReceipt,
  deleteReceipt,
  listReceipts,
  type ReceiptInput,
  type ReceiptRow,
  type Unit,
  updateReceipt,
} from './files-api';
import { ErrorState, LoadingState } from '@/components/QueryState';
import { listUnits } from '@/features/residents/residents-api';
import { lengthError, TextField } from '@/components/Field';
import { Select } from '@/components/Select';
import { CrudScreen, FormCard, type FormProps } from '@/features/content/CrudScreen';
import { useLengthMessages } from '@/features/content/messages';
import type { CrudApi } from '@/features/content/use-crud';
import { useCommunity } from '@/features/communities/CommunityLayout';
import { centsToInput, formatCents, parseEuros } from '@/lib/money';
import { useClient } from '@/lib/use-client';

const statuses: ReceiptRow['status'][] = ['scheduled', 'paid'];

const receiptsApi: CrudApi<ReceiptRow, ReceiptInput> = {
  key: 'receipts',
  list: listReceipts,
  create: createReceipt,
  update: (client, id, input, communityId) => updateReceipt(client, communityId, id, input),
  remove: deleteReceipt,
};

const formatDay = (value: string, language: string | undefined) =>
  new Intl.DateTimeFormat(language === 'es' ? 'es-ES' : 'ca-ES', {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`));

export function ReceiptsScreen() {
  const { t } = useTranslation();
  const { communityId } = useCommunity();
  const client = useClient();
  const units = useQuery({
    queryKey: ['units', communityId],
    queryFn: () => listUnits(client, communityId),
  });

  if (units.isPending) return <LoadingState />;
  if (units.isError) return <ErrorState onRetry={() => void units.refetch()} />;
  if (units.data.length === 0)
    return (
      <section className="flex flex-col gap-2">
        <h1 className="font-display text-3xl text-ink">{t('receipts.title')}</h1>
        <p className="rounded-lg border border-dashed border-outline px-4 py-8 text-center text-ink-soft">
          {t('receipts.noUnits')}
        </p>
      </section>
    );
  return <ReceiptsList communityId={communityId} units={units.data} />;
}

function ReceiptsList({ communityId, units }: { communityId: string; units: Unit[] }) {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage;
  const filterId = useId();
  const [unitFilter, setUnitFilter] = useState('');
  const unitLabel = (id: string) => units.find((unit) => unit.id === id)?.label ?? '—';

  return (
    <div className="flex flex-col gap-4">
      <CrudScreen
        api={receiptsApi}
        communityId={communityId}
        title={t('receipts.title')}
        subtitle={t('receipts.subtitle')}
        addLabel={t('receipts.add')}
        emptyText={t('receipts.empty')}
        itemName={(row) => `${row.concept} · ${unitLabel(row.unit_id)}`}
        sections={(rows) => [
          { rows: unitFilter ? rows.filter((row) => row.unit_id === unitFilter) : rows },
        ]}
        toolbar={
          <div className="flex items-center gap-2 text-sm text-ink-soft">
            <label htmlFor={filterId}>{t('receipts.filterLabel')}</label>
            <div className="w-48">
              <Select
                id={filterId}
                size="sm"
                value={unitFilter}
                onValueChange={setUnitFilter}
                options={[
                  { value: '', label: t('receipts.allUnits') },
                  ...units.map((unit) => ({ value: unit.id, label: unit.label })),
                ]}
              />
            </div>
          </div>
        }
        renderItem={(row) => (
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-body font-semibold text-ink">{row.concept}</span>
              <span className="rounded-md bg-surface-hi px-2 py-0.5 font-label text-[11px] text-primary-dark">
                {unitLabel(row.unit_id)}
              </span>
              <span
                className={`rounded-md px-2 py-0.5 font-label text-[11px] ${
                  row.status === 'paid'
                    ? 'bg-secondary/25 text-secondary-txt'
                    : 'bg-tertiary/15 text-tertiary-txt'
                }`}
              >
                {t(`receipts.statuses.${row.status}`)}
              </span>
            </div>
            <span className="text-sm text-ink">
              <strong className="font-semibold">{formatCents(row.amount_cents, language)}</strong>
              {' · '}
              {row.period} · {formatDay(row.issued_at, language)}
            </span>
            {row.storage_path ? (
              <OpenPdfButton
                path={row.storage_path}
                label={t('files.openNamed', { name: row.concept })}
              />
            ) : (
              <span className="text-sm text-ink-muted">{t('receipts.noFile')}</span>
            )}
          </div>
        )}
        renderForm={(props) => <ReceiptForm {...props} units={units} />}
      />
    </div>
  );
}

function ReceiptForm({
  initial,
  pending,
  onSubmit,
  onCancel,
  units,
}: FormProps<ReceiptRow, ReceiptInput> & { units: Unit[] }) {
  const { t } = useTranslation();
  const messages = useLengthMessages();
  const unitId = useId();
  const statusId = useId();
  const [unit, setUnit] = useState(initial?.unit_id ?? units[0].id);
  const [concept, setConcept] = useState(initial?.concept ?? '');
  const [amount, setAmount] = useState(centsToInput(initial?.amount_cents));
  const [issuedAt, setIssuedAt] = useState(initial?.issued_at ?? '');
  const [period, setPeriod] = useState(initial?.period ?? '');
  const [status, setStatus] = useState<ReceiptRow['status']>(initial?.status ?? 'scheduled');
  const [file, setFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const cents = parseEuros(amount);
  const errors = {
    concept: lengthError(concept, { max: 160 }, messages),
    amount: cents === null ? t('receipts.invalidAmount') : null,
    issuedAt: /^\d{4}-\d{2}-\d{2}$/.test(issuedAt) ? null : messages.required,
    period: lengthError(period, { max: 80 }, messages),
    file: fileError(file, t),
  };
  const show = (error: string | null) => (submitted ? error : null);

  return (
    <FormCard
      title={initial ? t('receipts.edit') : t('receipts.add')}
      pending={pending}
      onCancel={onCancel}
      onSubmit={() => {
        setSubmitted(true);
        if (Object.values(errors).some(Boolean) || cents === null) return;
        onSubmit({
          unitId: unit,
          concept: concept.trim(),
          amount_cents: cents,
          issued_at: issuedAt,
          period: period.trim(),
          status,
          file,
          currentPath: initial?.storage_path ?? null,
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={unitId} className="font-label text-xs text-ink-soft">
            {t('receipts.fields.unit')}
          </label>
          <Select
            id={unitId}
            value={unit}
            onValueChange={setUnit}
            // A receipt stays with its unit: the PDF lives in that unit's folder.
            disabled={pending || Boolean(initial)}
            options={units.map((option) => ({ value: option.id, label: option.label }))}
          />
          {initial && <p className="text-xs text-ink-muted">{t('receipts.unitLocked')}</p>}
        </div>
        <TextField
          label={t('receipts.fields.concept')}
          value={concept}
          onChange={(event) => setConcept(event.target.value)}
          error={show(errors.concept)}
          placeholder={t('receipts.conceptPlaceholder')}
          maxLength={160}
          disabled={pending}
        />
        <TextField
          label={t('receipts.fields.amount')}
          inputMode="decimal"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          error={show(errors.amount)}
          placeholder="125,50"
          disabled={pending}
        />
        <TextField
          label={t('receipts.fields.issuedAt')}
          type="date"
          value={issuedAt}
          onChange={(event) => setIssuedAt(event.target.value)}
          error={show(errors.issuedAt)}
          disabled={pending}
        />
        <TextField
          label={t('receipts.fields.period')}
          value={period}
          onChange={(event) => setPeriod(event.target.value)}
          error={show(errors.period)}
          placeholder={t('receipts.periodPlaceholder')}
          maxLength={80}
          disabled={pending}
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor={statusId} className="font-label text-xs text-ink-soft">
            {t('receipts.fields.status')}
          </label>
          <Select
            id={statusId}
            value={status}
            onValueChange={(value) => setStatus(value as ReceiptRow['status'])}
            disabled={pending}
            options={statuses.map((value) => ({
              value,
              label: t(`receipts.statuses.${value}`),
            }))}
          />
        </div>
      </div>
      <FileField
        label={t('files.label')}
        file={file}
        onChange={setFile}
        currentPath={initial?.storage_path ?? null}
        error={errors.file}
        disabled={pending}
      />
    </FormCard>
  );
}
