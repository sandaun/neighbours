import { Text, View } from 'react-native';

/** Cap de secció: overline en majúscules ("PRÓXIMS ESDEVENIMENTS"). */
export function SectionHeader({ title }: { title: string }) {
  return (
    <View className="mb-2 mt-6">
      <Text className="font-label text-[11px] uppercase leading-[14px] tracking-[1.2px] text-ink-muted dark:text-ink-dark-soft">
        {title}
      </Text>
    </View>
  );
}
