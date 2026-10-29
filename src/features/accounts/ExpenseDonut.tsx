import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

import { useTheme } from '@/hooks/use-theme';
import { formatCurrency } from '@/utils/formatters';

type ExpenseDonutProps = {
  segments: { key: string; amountCents: number; color: string }[];
  periodLabel: string;
};

const RADIUS = 88;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ExpenseDonut({ segments, periodLabel }: ExpenseDonutProps) {
  const { t, i18n } = useTranslation();
  const colors = useTheme();
  const totalCents = segments.reduce((sum, segment) => sum + segment.amountCents, 0);
  const total = formatCurrency(totalCents, i18n.resolvedLanguage ?? 'ca');
  const arcs: { key: string; color: string; length: number; offset: number }[] = [];
  let offset = 0;
  for (const segment of segments) {
    if (segment.amountCents <= 0) continue;
    const length = (segment.amountCents / totalCents) * CIRCUMFERENCE;
    arcs.push({ key: segment.key, color: segment.color, length, offset });
    offset += length;
  }

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={t('accounts.expenses.chartLabel', { period: periodLabel, total })}
      className="self-center"
      style={{ width: '100%', maxWidth: 280, aspectRatio: 1 }}
    >
      <Svg width="100%" height="100%" viewBox="0 0 240 240" accessible={false}>
        <Circle cx={120} cy={120} r={RADIUS} stroke={colors.outline} strokeWidth={32} fill="none" />
        <G transform="rotate(-90 120 120)">
          {arcs.map((arc) => (
            <Circle
              key={arc.key}
              cx={120}
              cy={120}
              r={RADIUS}
              stroke={arc.color}
              strokeWidth={32}
              strokeLinecap="butt"
              strokeDasharray={[arc.length, CIRCUMFERENCE - arc.length]}
              strokeDashoffset={-arc.offset}
              fill="none"
            />
          ))}
        </G>
      </Svg>
      <View pointerEvents="none" className="absolute inset-0 items-center justify-center px-12">
        <Text className="text-center font-display-semi text-[24px] leading-[30px] text-ink dark:text-ink-dark">
          {total}
        </Text>
        <Text className="font-body text-[13px] leading-[20px] text-ink-soft dark:text-ink-dark-soft">
          {t('accounts.expenses.total')}
        </Text>
      </View>
    </View>
  );
}
