import {
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
  useId,
} from 'react';

export const controlClass =
  'w-full rounded-lg border border-outline bg-surface px-4 text-base text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 aria-invalid:border-danger disabled:opacity-60';

type FieldProps = {
  label: string;
  hint?: string;
  error?: string | null;
  className?: string;
};

function FieldShell({
  id,
  label,
  hint,
  error,
  className = '',
  children,
}: FieldProps & { id: string; children: ReactNode }) {
  const message = error ?? hint;
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="font-label text-xs text-ink-soft">
        {label}
      </label>
      {children}
      {message && (
        <p id={`${id}-message`} className={`text-xs ${error ? 'text-danger' : 'text-ink-muted'}`}>
          {message}
        </p>
      )}
    </div>
  );
}

export function TextField({
  label,
  hint,
  error,
  className,
  ...input
}: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={className}>
      <input
        id={id}
        className={`${controlClass} min-h-11`}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? `${id}-message` : undefined}
        {...input}
      />
    </FieldShell>
  );
}

export function TextAreaField({
  label,
  hint,
  error,
  className,
  ...textarea
}: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={className}>
      <textarea
        id={id}
        rows={5}
        className={`${controlClass} py-3`}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? `${id}-message` : undefined}
        {...textarea}
      />
    </FieldShell>
  );
}

// Length rule shared by the content forms; mirrors the database checks.
export function lengthError(
  value: string,
  { min = 1, max, required = true }: { min?: number; max: number; required?: boolean },
  messages: { required: string; tooLong: (max: number) => string }
): string | null {
  const trimmed = value.trim();
  if (!trimmed) return required ? messages.required : null;
  if (trimmed.length < min) return messages.required;
  if (trimmed.length > max) return messages.tooLong(max);
  return null;
}
