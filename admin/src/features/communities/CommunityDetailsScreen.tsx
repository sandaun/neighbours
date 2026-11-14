import type { CommunityRow } from '@shared/database';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useCommunity } from './CommunityLayout';
import { Button } from '@/components/Button';
import { lengthError, TextField } from '@/components/Field';
import { ErrorState, LoadingState } from '@/components/QueryState';
import { useAuth } from '@/features/auth/AuthProvider';
import { useLengthMessages } from '@/features/content/messages';
import { one } from '@/lib/rows';
import { useClient } from '@/lib/use-client';

type CommunityDetails = Pick<CommunityRow, 'name' | 'address_line' | 'municipality'>;
const detailsColumns = 'name, address_line, municipality';

export function CommunityDetailsScreen() {
  const { t } = useTranslation();
  const { communityId } = useCommunity();
  const client = useClient();
  const details = useQuery({
    queryKey: ['community-details', communityId],
    queryFn: async () =>
      one(await client.from('communities').select(detailsColumns).eq('id', communityId)),
  });
  return (
    <section className="flex flex-col gap-5">
      <h1 className="font-display text-3xl text-ink">{t('communities.details.title')}</h1>
      {details.isPending ? <LoadingState /> : null}
      {details.isError && !details.data ? (
        <ErrorState onRetry={() => void details.refetch()} />
      ) : null}
      {details.data ? <DetailsForm key={communityId} details={details.data} /> : null}
    </section>
  );
}

function DetailsForm({ details }: { details: CommunityDetails }) {
  const { t } = useTranslation();
  const { communityId } = useCommunity();
  const { updateCommunityName } = useAuth();
  const client = useClient();
  const queryClient = useQueryClient();
  const messages = useLengthMessages();
  const [draft, setDraft] = useState<Partial<Record<keyof CommunityDetails, string>>>({});
  const [submitted, setSubmitted] = useState(false);
  const queryKey = ['community-details', communityId];
  const save = useMutation({
    mutationFn: async (input: Partial<CommunityDetails>) =>
      one(
        await client.from('communities').update(input).eq('id', communityId).select(detailsColumns)
      ),
    onSuccess: async (saved) => {
      await queryClient.cancelQueries({ queryKey, exact: true });
      queryClient.setQueryData(queryKey, saved);
      updateCommunityName(communityId, saved.name);
    },
  });

  const pending = save.isPending;
  const name = draft.name ?? details.name;
  const street = draft.address_line ?? details.address_line ?? '';
  const city = draft.municipality ?? details.municipality ?? '';
  const nameError = lengthError(name, { max: 160 }, messages);
  const streetError = lengthError(street, { max: 200, required: false }, messages);
  const cityError = lengthError(city, { max: 120, required: false }, messages);
  const nextStreet = street.trim() || null;
  const nextCity = city.trim() || null;
  const update: Partial<CommunityDetails> = {};
  if (draft.name !== undefined && name.trim() !== details.name) update.name = name.trim();
  if (draft.address_line !== undefined && nextStreet !== details.address_line) {
    update.address_line = nextStreet;
  }
  if (draft.municipality !== undefined && nextCity !== details.municipality) {
    update.municipality = nextCity;
  }
  const changed = Object.keys(update).length > 0;

  function edit(field: keyof CommunityDetails, value: string) {
    save.reset();
    setDraft((current) => ({ ...current, [field]: value }));
  }

  return (
    <form
      noValidate
      className="flex max-w-2xl flex-col gap-4 rounded-xl border border-outline/60 bg-surface p-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (pending || !changed) return;
        setSubmitted(true);
        if (nameError || streetError || cityError) return;
        save.mutate(update, {
          onSuccess: () => {
            setDraft({});
            setSubmitted(false);
          },
        });
      }}
    >
      <TextField
        label={t('communities.details.name')}
        value={name}
        maxLength={160}
        required
        disabled={pending}
        error={submitted ? nameError : null}
        onChange={(event) => edit('name', event.target.value)}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label={t('communities.details.street')}
          value={street}
          maxLength={200}
          disabled={pending}
          error={submitted ? streetError : null}
          onChange={(event) => edit('address_line', event.target.value)}
        />
        <TextField
          label={t('communities.details.municipality')}
          value={city}
          maxLength={120}
          disabled={pending}
          error={submitted ? cityError : null}
          onChange={(event) => edit('municipality', event.target.value)}
        />
      </div>
      {save.isError ? (
        <p role="alert" className="text-sm text-danger">
          {t('crud.saveError')}
        </p>
      ) : null}
      {save.isSuccess ? (
        <p role="status" className="text-sm text-ink-soft">
          {t('communities.details.saved')}
        </p>
      ) : null}
      <Button className="self-start" type="submit" disabled={pending || !changed}>
        {t(pending ? 'crud.saving' : 'crud.save')}
      </Button>
    </form>
  );
}
