import { FileText, Upload } from 'lucide-react';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { isPdf, MAX_PDF_BYTES, signedFileUrl } from './files-api';
import { Button } from '@/components/Button';
import { useClient } from '@/lib/use-client';

export function formatBytes(bytes: number, language: string | undefined) {
  const locale = language === 'es' ? 'es-ES' : 'ca-ES';
  const megabytes = bytes / (1024 * 1024);
  return megabytes >= 1
    ? `${megabytes.toLocaleString(locale, { maximumFractionDigits: 1 })} MB`
    : `${Math.max(1, Math.round(bytes / 1024)).toLocaleString(locale)} kB`;
}

export function fileError(file: File | null, t: (key: string) => string): string | null {
  if (!file) return null;
  if (!isPdf(file)) return t('files.notPdf');
  if (file.size > MAX_PDF_BYTES) return t('files.tooLarge');
  return null;
}

// Opens a short-lived private URL. The tab is opened first, synchronously, so
// popup blockers allow it, then pointed at the signed URL.
export function useOpenFile() {
  const client = useClient();
  const [failed, setFailed] = useState(false);
  async function open(path: string) {
    setFailed(false);
    const tab = window.open('', '_blank');
    try {
      const url = await signedFileUrl(client, path);
      if (tab) {
        tab.opener = null;
        tab.location.href = url;
      } else {
        window.location.assign(url);
      }
    } catch {
      tab?.close();
      setFailed(true);
    }
  }
  return { open, failed };
}

export function OpenPdfButton({ path, label }: { path: string; label: string }) {
  const { t } = useTranslation();
  const { open, failed } = useOpenFile();
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => void open(path)}
        aria-label={label}
        className="inline-flex items-center gap-1.5 rounded-md font-label text-xs text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-primary-dark"
      >
        <FileText aria-hidden size={14} />
        {t('files.open')}
      </button>
      {failed && (
        <span role="alert" className="text-xs text-danger">
          {t('files.openError')}
        </span>
      )}
    </span>
  );
}

export function FileField({
  label,
  file,
  onChange,
  currentPath,
  currentSize,
  error,
  disabled,
}: {
  label: string;
  file: File | null;
  onChange(file: File | null): void;
  currentPath: string | null;
  currentSize?: number;
  error: string | null;
  disabled: boolean;
}) {
  const { t, i18n } = useTranslation();
  const id = useId();
  const [inputKey, setInputKey] = useState(0);
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-label text-xs text-ink-soft">
        {label}
      </label>
      {currentPath && !file && (
        <div className="flex flex-wrap items-center gap-3 rounded-md bg-surface-hi px-3 py-2 text-sm text-ink">
          <span>
            {t('files.current')}
            {currentSize ? ` · ${formatBytes(currentSize, i18n.resolvedLanguage)}` : ''}
          </span>
          <OpenPdfButton path={currentPath} label={t('files.openCurrent')} />
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <input
          key={inputKey}
          id={id}
          type="file"
          accept="application/pdf,.pdf"
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={`${id}-message`}
          onChange={(event) => onChange(event.target.files?.[0] ?? null)}
          className="peer sr-only"
        />
        {/* Localised picker: the native control's text follows the browser language. */}
        <label
          htmlFor={id}
          aria-hidden
          className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-pill border border-outline bg-surface px-4 font-label text-xs text-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary-dark hover:bg-surface-hi ${
            disabled ? 'pointer-events-none opacity-50' : ''
          }`}
        >
          <Upload aria-hidden size={14} />
          {currentPath || file ? t('files.chooseOther') : t('files.choose')}
        </label>
        {!file && !currentPath && <span className="text-sm text-ink-muted">{t('files.none')}</span>}
      </div>
      {file && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-ink">
          <span className="break-all">
            {file.name} · {formatBytes(file.size, i18n.resolvedLanguage)}
          </span>
          <Button
            variant="ghost"
            className="min-h-8 px-2 text-xs"
            onClick={() => {
              onChange(null);
              setInputKey((value) => value + 1);
            }}
            disabled={disabled}
          >
            {t('files.clear')}
          </Button>
        </div>
      )}
      <p id={`${id}-message`} className={`text-xs ${error ? 'text-danger' : 'text-ink-muted'}`}>
        {error ?? (currentPath ? t('files.replaceHint') : t('files.hint'))}
      </p>
    </div>
  );
}
