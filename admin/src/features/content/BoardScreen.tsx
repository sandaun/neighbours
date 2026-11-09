import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  type BoardPostRow,
  createPost,
  deletePost,
  listPosts,
  type PostInput,
  updatePost,
} from './content-api';
import { CrudScreen, FormCard, type FormProps } from './CrudScreen';
import { useLengthMessages } from './messages';
import type { CrudApi } from './use-crud';
import { lengthError, TextAreaField, TextField } from '@/components/Field';
import { useCommunity } from '@/features/communities/CommunityLayout';
import { fromLocalInput, toLocalInput } from '@/lib/datetime';
import { formatDateTime } from '@/lib/format';
import { useNow } from '@/lib/use-now';

// The resident app offers filters for exactly these topics.
const SUGGESTED_TOPICS = ['Parking', 'Jardí', 'Activitats'];

const postsApi: CrudApi<BoardPostRow, PostInput> = {
  key: 'posts',
  list: listPosts,
  create: createPost,
  update: updatePost,
  remove: deletePost,
};

export function BoardScreen() {
  const { t, i18n } = useTranslation();
  const { communityId, displayName } = useCommunity();
  const language = i18n.resolvedLanguage;
  const now = useNow();

  return (
    <CrudScreen
      api={postsApi}
      communityId={communityId}
      title={t('board.title')}
      subtitle={t('board.subtitle')}
      addLabel={t('board.add')}
      emptyText={t('board.empty')}
      itemName={(row) => row.title}
      renderItem={(row) => {
        const scheduled = Date.parse(row.published_at) > now;
        return (
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-body font-semibold text-ink">{row.title}</span>
              <span className="rounded-md bg-surface-hi px-2 py-0.5 font-label text-[11px] text-primary-dark">
                {row.topic}
              </span>
              {scheduled && (
                <span className="rounded-md bg-tertiary/15 px-2 py-0.5 font-label text-[11px] text-tertiary-txt">
                  {t('board.scheduled')}
                </span>
              )}
            </div>
            <p className="line-clamp-3 text-sm whitespace-pre-line text-ink-soft">{row.body}</p>
            <span className="text-xs text-ink-muted">
              {row.author_name} · {formatDateTime(row.published_at, language)}
            </span>
          </div>
        );
      }}
      renderForm={(props) => <PostForm {...props} defaultAuthor={displayName} />}
    />
  );
}

function PostForm({
  initial,
  pending,
  onSubmit,
  onCancel,
  defaultAuthor,
}: FormProps<BoardPostRow, PostInput> & { defaultAuthor: string }) {
  const { t } = useTranslation();
  const messages = useLengthMessages();
  const topicsId = useId();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [topic, setTopic] = useState(initial?.topic ?? '');
  const [body, setBody] = useState(initial?.body ?? '');
  const [author, setAuthor] = useState(initial?.author_name ?? defaultAuthor);
  const [publishAt, setPublishAt] = useState(toLocalInput(initial?.published_at));
  const [submitted, setSubmitted] = useState(false);

  const errors = {
    title: lengthError(title, { max: 160 }, messages),
    topic: lengthError(topic, { max: 80 }, messages),
    body: lengthError(body, { max: 4000 }, messages),
    author: lengthError(author, { max: 160 }, messages),
  };
  const show = (error: string | null) => (submitted ? error : null);

  return (
    <FormCard
      title={initial ? t('board.edit') : t('board.add')}
      pending={pending}
      onCancel={onCancel}
      onSubmit={() => {
        setSubmitted(true);
        if (Object.values(errors).some(Boolean)) return;
        onSubmit({
          title: title.trim(),
          topic: topic.trim(),
          body: body.trim(),
          author_name: author.trim(),
          // Empty means "now" for a new post and "unchanged" for an edit.
          published_at:
            fromLocalInput(publishAt) ?? initial?.published_at ?? new Date().toISOString(),
        });
      }}
    >
      <TextField
        label={t('board.fields.title')}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        error={show(errors.title)}
        maxLength={160}
        disabled={pending}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label={t('board.fields.topic')}
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          error={show(errors.topic)}
          hint={t('board.topicHint')}
          list={topicsId}
          maxLength={80}
          disabled={pending}
        />
        <TextField
          label={t('board.fields.author')}
          value={author}
          onChange={(event) => setAuthor(event.target.value)}
          error={show(errors.author)}
          hint={t('board.authorHint')}
          maxLength={160}
          disabled={pending}
        />
      </div>
      <datalist id={topicsId}>
        {SUGGESTED_TOPICS.map((value) => (
          <option key={value} value={value} />
        ))}
      </datalist>
      <TextAreaField
        label={t('board.fields.body')}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        error={show(errors.body)}
        maxLength={4000}
        disabled={pending}
      />
      <TextField
        label={t('board.fields.publishAt')}
        type="datetime-local"
        value={publishAt}
        onChange={(event) => setPublishAt(event.target.value)}
        hint={t('board.publishHint')}
        disabled={pending}
      />
    </FormCard>
  );
}
