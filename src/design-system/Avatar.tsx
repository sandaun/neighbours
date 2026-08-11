import { Text, View } from 'react-native';

/** Avatar circular amb inicials sobre surface-hi (MV, SM, JR…). */
export function Avatar({ initials, size = 40 }: { initials: string; size?: number }) {
  return (
    <View
      className="items-center justify-center rounded-full bg-surface-hi dark:bg-surface-dark-hi"
      style={{ width: size, height: size }}
    >
      <Text
        className="font-label text-primary dark:text-primary-darkmode"
        style={{ fontSize: size * 0.36, lineHeight: size * 0.5 }}
      >
        {initials}
      </Text>
    </View>
  );
}
