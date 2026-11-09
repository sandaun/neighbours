import { Clock, Mail, Phone } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  type ContactInput,
  createContact,
  deleteContact,
  type DirectoryContactRow,
  listContacts,
  updateContact,
} from './content-api';
import { CrudScreen, FormCard, type FormProps } from './CrudScreen';
import { useLengthMessages } from './messages';
import type { CrudApi } from './use-crud';
import { lengthError, TextField } from '@/components/Field';
import { useCommunity } from '@/features/communities/CommunityLayout';

const contactsApi: CrudApi<DirectoryContactRow, ContactInput> = {
  key: 'contacts',
  list: listContacts,
  create: createContact,
  update: updateContact,
  remove: deleteContact,
};

const optional = (value: string) => value.trim() || null;

export function DirectoryScreen() {
  const { t } = useTranslation();
  const { communityId } = useCommunity();

  return (
    <CrudScreen
      api={contactsApi}
      communityId={communityId}
      title={t('directory.title')}
      subtitle={t('directory.subtitle')}
      addLabel={t('directory.add')}
      emptyText={t('directory.empty')}
      itemName={(row) => row.name}
      renderItem={(row) => (
        <div className="flex flex-col gap-1">
          <span className="font-body font-semibold text-ink">{row.name}</span>
          <span className="text-sm text-ink-soft">{row.service}</span>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-soft">
            {row.phone && (
              <span className="inline-flex items-center gap-1.5">
                <Phone aria-hidden size={14} />
                {row.phone}
              </span>
            )}
            {row.email && (
              <span className="inline-flex items-center gap-1.5 break-all">
                <Mail aria-hidden size={14} />
                {row.email}
              </span>
            )}
            {row.hours && (
              <span className="inline-flex items-center gap-1.5">
                <Clock aria-hidden size={14} />
                {row.hours}
              </span>
            )}
          </div>
        </div>
      )}
      renderForm={(props) => <ContactForm {...props} />}
    />
  );
}

function ContactForm({
  initial,
  pending,
  onSubmit,
  onCancel,
}: FormProps<DirectoryContactRow, ContactInput>) {
  const { t } = useTranslation();
  const messages = useLengthMessages();
  const [name, setName] = useState(initial?.name ?? '');
  const [service, setService] = useState(initial?.service ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [hours, setHours] = useState(initial?.hours ?? '');
  const [order, setOrder] = useState(String(initial?.sort_order ?? 0));
  const [submitted, setSubmitted] = useState(false);

  const emailInvalid = email.trim() !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const orderValue = Number(order);
  const errors = {
    name: lengthError(name, { max: 160 }, messages),
    service: lengthError(service, { max: 300 }, messages),
    phone: lengthError(phone, { max: 40, required: false }, messages),
    email: emailInvalid
      ? t('directory.invalidEmail')
      : lengthError(email, { max: 160, required: false }, messages),
    hours: lengthError(hours, { max: 160, required: false }, messages),
    order: Number.isInteger(orderValue) && order.trim() !== '' ? null : t('directory.invalidOrder'),
  };
  const show = (error: string | null) => (submitted ? error : null);

  return (
    <FormCard
      title={initial ? t('directory.edit') : t('directory.add')}
      pending={pending}
      onCancel={onCancel}
      onSubmit={() => {
        setSubmitted(true);
        if (Object.values(errors).some(Boolean)) return;
        onSubmit({
          name: name.trim(),
          service: service.trim(),
          // The database rejects empty strings: blank optional fields are stored as null.
          phone: optional(phone),
          email: optional(email),
          hours: optional(hours),
          sort_order: orderValue,
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label={t('directory.fields.name')}
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={show(errors.name)}
          maxLength={160}
          disabled={pending}
        />
        <TextField
          label={t('directory.fields.service')}
          value={service}
          onChange={(event) => setService(event.target.value)}
          error={show(errors.service)}
          placeholder={t('directory.servicePlaceholder')}
          maxLength={300}
          disabled={pending}
        />
        <TextField
          label={t('directory.fields.phone')}
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          error={show(errors.phone)}
          maxLength={40}
          disabled={pending}
        />
        <TextField
          label={t('directory.fields.email')}
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={show(errors.email)}
          maxLength={160}
          disabled={pending}
        />
        <TextField
          label={t('directory.fields.hours')}
          value={hours}
          onChange={(event) => setHours(event.target.value)}
          error={show(errors.hours)}
          placeholder={t('directory.hoursPlaceholder')}
          maxLength={160}
          disabled={pending}
        />
        <TextField
          label={t('directory.fields.order')}
          type="number"
          step={1}
          value={order}
          onChange={(event) => setOrder(event.target.value)}
          error={show(errors.order)}
          hint={t('directory.orderHint')}
          disabled={pending}
        />
      </div>
    </FormCard>
  );
}
