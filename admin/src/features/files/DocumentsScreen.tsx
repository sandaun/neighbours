import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { FileField, fileError, formatBytes, OpenPdfButton } from './FileField';
import {
  createDocument,
  deleteDocument,
  type DocumentInput,
  type DocumentRow,
  listDocuments,
  updateDocument,
} from './files-api';
import { lengthError, TextField } from '@/components/Field';
import { Select } from '@/components/Select';
import { CrudScreen, FormCard, type FormProps } from '@/features/content/CrudScreen';
import { useLengthMessages } from '@/features/content/messages';
import type { CrudApi } from '@/features/content/use-crud';
import { useCommunity } from '@/features/communities/CommunityLayout';
import { formatDateTime } from '@/lib/format';

const categories: DocumentRow['category'][] = ['minutes', 'insurance', 'rules'];

const documentsApi: CrudApi<DocumentRow, DocumentInput> = {
  key: 'documents',
  list: listDocuments,
  create: createDocument,
  update: (client, id, input, communityId) => updateDocument(client, communityId, id, input),
  remove: deleteDocument,
};

export function DocumentsScreen() {
  const { t, i18n } = useTranslation();
  const { communityId } = useCommunity();
  const language = i18n.resolvedLanguage;

  return (
    <CrudScreen
      api={documentsApi}
      communityId={communityId}
      title={t('documents.title')}
      subtitle={t('documents.subtitle')}
      addLabel={t('documents.add')}
      emptyText={t('documents.empty')}
      itemName={(row) => row.title}
      renderItem={(row) => (
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-body font-semibold text-ink">{row.title}</span>
            <span className="rounded-md bg-surface-hi px-2 py-0.5 font-label text-[11px] text-primary-dark">
              {t(`documents.categories.${row.category}`)}
            </span>
          </div>
          <span className="text-xs text-ink-muted">
            {t('documents.updatedAt', { date: formatDateTime(row.updated_at, language) })}
          </span>
          {row.storage_path ? (
            <span className="flex flex-wrap items-center gap-2 text-sm text-ink-soft">
              <OpenPdfButton
                path={row.storage_path}
                label={t('files.openNamed', { name: row.title })}
              />
              <span>· {formatBytes(row.file_size_bytes, language)}</span>
            </span>
          ) : (
            <span className="text-sm text-tertiary-txt">{t('files.missing')}</span>
          )}
        </div>
      )}
      renderForm={(props) => <DocumentForm {...props} />}
    />
  );
}

function DocumentForm({
  initial,
  pending,
  onSubmit,
  onCancel,
}: FormProps<DocumentRow, DocumentInput>) {
  const { t } = useTranslation();
  const messages = useLengthMessages();
  const categoryId = useId();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [category, setCategory] = useState<DocumentRow['category']>(initial?.category ?? 'minutes');
  const [file, setFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const errors = {
    title: lengthError(title, { max: 160 }, messages),
    file: fileError(file, t),
  };
  const show = (error: string | null) => (submitted ? error : null);

  return (
    <FormCard
      title={initial ? t('documents.edit') : t('documents.add')}
      pending={pending}
      onCancel={onCancel}
      onSubmit={() => {
        setSubmitted(true);
        if (Object.values(errors).some(Boolean)) return;
        onSubmit({
          title: title.trim(),
          category,
          file,
          currentPath: initial?.storage_path ?? null,
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_220px]">
        <TextField
          label={t('documents.fields.title')}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          error={show(errors.title)}
          placeholder={t('documents.titlePlaceholder')}
          maxLength={160}
          disabled={pending}
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor={categoryId} className="font-label text-xs text-ink-soft">
            {t('documents.fields.category')}
          </label>
          <Select
            id={categoryId}
            value={category}
            onValueChange={(value) => setCategory(value as DocumentRow['category'])}
            disabled={pending}
            options={categories.map((value) => ({
              value,
              label: t(`documents.categories.${value}`),
            }))}
          />
        </div>
      </div>
      <FileField
        label={t('files.label')}
        file={file}
        onChange={setFile}
        currentPath={initial?.storage_path ?? null}
        currentSize={initial?.file_size_bytes}
        error={errors.file}
        disabled={pending}
      />
    </FormCard>
  );
}
