import { Pressable, Text, View, type PressableProps } from 'react-native';

type ListItemProps = Omit<PressableProps, 'children'> & {
  title: string;
  subtitle?: string;
  /** Element a l'esquerra (icona, avatar…). */
  leading?: React.ReactNode;
  /** Mostra un chevron a la dreta (navegació). */
  chevron?: boolean;
  /** Element a la dreta; té prioritat sobre el chevron. */
  trailing?: React.ReactNode;
};

/** Ítem de llista per a perfil, urgències, documents… */
export function ListItem({
  title,
  subtitle,
  leading,
  chevron = false,
  trailing,
  ...props
}: ListItemProps) {
  return (
    <Pressable
      accessibilityRole="button"
      className="flex-row items-center gap-3 rounded-md bg-surface px-4 py-3 active:bg-surface-hi dark:bg-surface-dark dark:active:bg-surface-dark-hi"
      {...props}
    >
      {leading}
      <View className="flex-1">
        <Text className="font-body-semi text-[15px] leading-[22px] text-ink dark:text-ink-dark">
          {title}
        </Text>
        {subtitle ? (
          <Text className="font-body text-[12px] leading-[16px] text-ink-soft dark:text-ink-dark-soft">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing ??
        (chevron ? (
          <Text className="font-body text-[15px] text-ink-muted dark:text-ink-dark-soft">›</Text>
        ) : null)}
    </Pressable>
  );
}
