import { Pencil, Plus, Trash2 } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { type CrudApi, useCrud } from './use-crud';
import { Button } from '@/components/Button';
import { ErrorState, LoadingState } from '@/components/QueryState';

export type FormProps<Row, Input> = {
  initial: Row | null;
  pending: boolean;
  onSubmit(input: Input): void;
  onCancel(): void;
};

type Section<Row> = { title?: string; rows: Row[] };

type Props<Row extends { id: string }, Input> = {
  api: CrudApi<Row, Input>;
  communityId: string;
  title: string;
  subtitle: string;
  addLabel: string;
  emptyText: string;
  itemName(row: Row): string;
  renderItem(row: Row): ReactNode;
  renderForm(props: FormProps<Row, Input>): ReactNode;
  sections?(rows: Row[]): Section<Row>[];
  toolbar?: ReactNode;
};

type Notice = 'saved' | 'deleted' | null;

export function CrudScreen<Row extends { id: string }, Input>({
  api,
  communityId,
  title,
  subtitle,
  addLabel,
  emptyText,
  itemName,
  renderItem,
  renderForm,
  sections,
  toolbar,
}: Props<Row, Input>) {
  const { t } = useTranslation();
  const { list, save, remove } = useCrud(api, communityId);
  const [editing, setEditing] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const rows = list.data ?? [];

  function startEditing(id: string) {
    setEditing(id);
    setConfirming(null);
    setNotice(null);
    save.reset();
    remove.reset();
  }

  function form(initial: Row | null) {
    return (
      <div className="flex flex-col gap-3">
        {renderForm({
          initial,
          pending: save.isPending,
          onCancel: () => setEditing(null),
          onSubmit: (input) =>
            save.mutate(
              { id: initial?.id ?? null, input },
              {
                onSuccess: () => {
                  setEditing(null);
                  setNotice('saved');
                },
              }
            ),
        })}
        {save.isError && (
          <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
            {t('crud.saveError')}
          </p>
        )}
      </div>
    );
  }

  function item(row: Row) {
    if (editing === row.id) return <li key={row.id}>{form(row)}</li>;
    const name = itemName(row);
    return (
      <li
        key={row.id}
        className="flex flex-col gap-3 rounded-lg border border-outline/60 bg-surface p-4 sm:flex-row sm:items-start"
      >
        <div className="min-w-0 flex-1">{renderItem(row)}</div>
        {confirming === row.id ? (
          <div className="flex flex-col gap-2 sm:items-end">
            <p className="text-sm text-ink">{t('crud.confirmDelete', { name })}</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setConfirming(null)}>
                {t('crud.cancel')}
              </Button>
              <Button
                variant="danger"
                disabled={remove.isPending}
                onClick={() =>
                  remove.mutate(row, {
                    onSuccess: () => {
                      setConfirming(null);
                      setNotice('deleted');
                    },
                  })
                }
              >
                {t('crud.confirmYes')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex shrink-0 gap-1">
            <Button
              variant="ghost"
              className="px-3"
              aria-label={t('crud.editLabel', { name })}
              onClick={() => startEditing(row.id)}
            >
              <Pencil aria-hidden size={16} />
            </Button>
            <Button
              variant="ghost"
              className="px-3 hover:text-danger"
              aria-label={t('crud.deleteLabel', { name })}
              onClick={() => {
                setConfirming(row.id);
                setEditing(null);
                setNotice(null);
                remove.reset();
              }}
            >
              <Trash2 aria-hidden size={16} />
            </Button>
          </div>
        )}
      </li>
    );
  }

  const groups = sections ? sections(rows) : [{ rows }];

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-3xl text-ink">{title}</h1>
          <p className="text-ink-soft">{subtitle}</p>
        </div>
        {editing !== 'new' && (
          <Button onClick={() => startEditing('new')} disabled={!list.isSuccess}>
            <Plus aria-hidden size={16} />
            {addLabel}
          </Button>
        )}
      </div>

      {notice && (
        <p
          role="status"
          className="rounded-md bg-secondary/20 px-3 py-2 text-sm text-secondary-txt"
        >
          {t(notice === 'saved' ? 'crud.saved' : 'crud.deleted')}
        </p>
      )}
      {remove.isError && (
        <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          {t('crud.deleteError')}
        </p>
      )}

      {toolbar && <div className="flex flex-wrap items-center gap-3">{toolbar}</div>}

      {editing === 'new' && form(null)}

      {list.isPending ? (
        <LoadingState />
      ) : list.isError ? (
        <ErrorState onRetry={() => void list.refetch()} />
      ) : groups.every((group) => group.rows.length === 0) ? (
        <p className="rounded-lg border border-dashed border-outline px-4 py-8 text-center text-ink-soft">
          {emptyText}
        </p>
      ) : (
        groups
          .filter((group) => group.rows.length > 0)
          .map((group, index) => (
            <div key={group.title ?? index} className="flex flex-col gap-3">
              {group.title && <h2 className="font-display text-xl text-ink">{group.title}</h2>}
              <ul className="flex flex-col gap-3">{group.rows.map(item)}</ul>
            </div>
          ))
      )}
    </section>
  );
}

export function FormCard({
  title,
  pending,
  onCancel,
  onSubmit,
  children,
}: {
  title: string;
  pending: boolean;
  onCancel(): void;
  onSubmit(): void;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      aria-label={title}
      className="flex flex-col gap-4 rounded-xl border border-primary/40 bg-surface p-5 shadow-sm"
    >
      <h2 className="font-display text-xl text-ink">{title}</h2>
      {children}
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={pending}>
          {t('crud.cancel')}
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? t('crud.saving') : t('crud.save')}
        </Button>
      </div>
    </form>
  );
}
