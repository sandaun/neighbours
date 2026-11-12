import * as RadixSelect from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';

export type SelectOption = { value: string; label: string };

// Radix reserves "" to clear a selection; our "all"/"keep" options use it.
const EMPTY = '__empty__';
const toRadix = (value: string) => (value === '' ? EMPTY : value);
const fromRadix = (value: string) => (value === EMPTY ? '' : value);

const sizes = {
  sm: 'min-h-9 px-3 text-sm',
  md: 'min-h-11 px-4 text-base',
};

/**
 * Accessible dropdown in the backoffice style. Radix provides keyboard, focus and
 * screen reader behaviour; label it with <label htmlFor={id}> or `aria-label`.
 */
export function Select({
  id,
  value,
  onValueChange,
  options,
  disabled,
  size = 'md',
  className = '',
  'aria-label': ariaLabel,
}: {
  id?: string;
  value: string;
  onValueChange(value: string): void;
  options: SelectOption[];
  disabled?: boolean;
  size?: keyof typeof sizes;
  className?: string;
  'aria-label'?: string;
}) {
  return (
    <RadixSelect.Root
      value={toRadix(value)}
      onValueChange={(next) => onValueChange(fromRadix(next))}
      disabled={disabled}
    >
      <RadixSelect.Trigger
        id={id}
        aria-label={ariaLabel}
        className={`group inline-flex w-full items-center justify-between gap-3 rounded-lg border border-outline bg-surface text-left text-ink transition-colors hover:border-primary/60 focus:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60 data-[state=open]:border-primary ${sizes[size]} ${className}`}
      >
        <span className="truncate">
          <RadixSelect.Value />
        </span>
        <RadixSelect.Icon asChild>
          <ChevronDown
            aria-hidden
            size={16}
            className="shrink-0 text-ink-soft transition-transform group-data-[state=open]:rotate-180"
          />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          sideOffset={6}
          collisionPadding={8}
          className="z-50 max-h-[min(var(--radix-select-content-available-height),320px)] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border border-outline/70 bg-surface p-1 shadow-lg"
        >
          <RadixSelect.Viewport>
            {options.map((option) => (
              <RadixSelect.Item
                key={option.value}
                value={toRadix(option.value)}
                className="relative flex min-h-9 cursor-pointer items-center rounded-md py-2 pr-9 pl-3 text-sm text-ink outline-none select-none data-[disabled]:opacity-50 data-[highlighted]:bg-surface-hi data-[state=checked]:font-semibold data-[state=checked]:text-primary-dark"
              >
                <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                <RadixSelect.ItemIndicator className="absolute right-3 inline-flex items-center text-primary">
                  <Check aria-hidden size={16} />
                </RadixSelect.ItemIndicator>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}
