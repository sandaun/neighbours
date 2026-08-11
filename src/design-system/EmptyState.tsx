import { Text, View } from 'react-native';

type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
};

/** Estat buit: icona + text (+ acció opcional). */
export function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <View className="items-center gap-3 px-8 py-16">
      {icon ? (
        <View className="h-16 w-16 items-center justify-center rounded-full bg-surface-hi dark:bg-surface-dark-hi">
          {icon}
        </View>
      ) : null}
      <Text className="text-center font-body-semi text-[15px] leading-[22px] text-ink dark:text-ink-dark">
        {title}
      </Text>
      {subtitle ? (
        <Text className="text-center font-body text-[13px] leading-[18px] text-ink-soft dark:text-ink-dark-soft">
          {subtitle}
        </Text>
      ) : null}
      {action}
    </View>
  );
}
