import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ScreenHeaderProps = {
  /** Overline en majúscules ("LA MEVA COMUNITAT"). */
  overline?: string;
  title: string;
  subtitle?: string;
};

/**
 * Capçalera de pantalla: bloc morat amb radi 2xl inferior, overline + display serif.
 * El morat s'estén per darrere de la status bar; el text respecta la safe area.
 */
export function ScreenHeader({ overline, title, subtitle }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      className="rounded-b-2xl bg-primary px-5 pb-6"
      style={{ paddingTop: insets.top + 16 }}
    >
      {overline ? (
        <Text className="font-label text-[11px] uppercase leading-[14px] tracking-[1.2px] text-primary-on/70">
          {overline}
        </Text>
      ) : null}
      <Text className="mt-1 font-display text-[28px] leading-[34px] text-primary-on">{title}</Text>
      {subtitle ? (
        <Text className="mt-1 font-body text-[13px] leading-[18px] text-primary-on/80">
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
