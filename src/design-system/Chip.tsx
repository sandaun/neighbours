import { Pressable, Text, type PressableProps } from 'react-native';

type ChipProps = Omit<PressableProps, 'children'> & {
  selected?: boolean;
  children: string;
};

/** Xip seleccionable (categories d'incidència, temes del tauló, filtres). */
export function Chip({ selected = false, children, ...props }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className={`h-9 items-center justify-center rounded-pill px-4 ${
        selected
          ? 'bg-primary active:bg-primary-dark'
          : 'bg-surface-hi active:bg-highlight dark:bg-surface-dark-hi'
      }`}
      {...props}
    >
      <Text
        className={`font-label text-[13px] leading-[18px] ${
          selected ? 'text-primary-on' : 'text-ink dark:text-ink-dark'
        }`}
      >
        {children}
      </Text>
    </Pressable>
  );
}
