import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'outline' | 'ghost';

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-primary-on hover:bg-primary-dark disabled:bg-primary/50',
  outline: 'border border-outline bg-surface text-ink hover:bg-surface-hi disabled:opacity-50',
  ghost: 'text-ink-soft hover:bg-surface-hi hover:text-ink disabled:opacity-50',
};

export function Button({
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-pill px-5 font-label text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-dark disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
