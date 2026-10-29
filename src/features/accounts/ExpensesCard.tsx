import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';

import { Card } from '@/design-system/Card';
import { Chip } from '@/design-system/Chip';
import { useTheme } from '@/hooks/use-theme';
import { formatCurrency } from '@/utils/formatters';

import { DEMO_EXPENSES, DEMO_EXPENSE_YEAR } from './demo-expenses';
import { ExpenseDonut } from './ExpenseDonut';

const MONTHS = Array.from(
  { length: 12 },
  (_, month) => new Date(Date.UTC(DEMO_EXPENSE_YEAR, month, 1))
);

export function ExpensesCard() {
  const { t, i18n } = useTranslation();
  const colors = useTheme();
  const locale = i18n.resolvedLanguage ?? 'ca';
  const [period, setPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [month, setMonth] = useState(0);
  const shortMonth = new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' });
  const fullMonth = new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
  const periodLabel =
    period === 'monthly' ? fullMonth.format(MONTHS[month]) : String(DEMO_EXPENSE_YEAR);
  const categoryColors = {
    elevator: colors.primary,
    electricity: colors.secondary,
    garden: colors.warning,
    cleaning: colors.muted,
    other: colors.highlight,
  };
  const breakdown = DEMO_EXPENSES.map((category) => ({
    key: category.key,
    amountCents:
      period === 'monthly'
        ? category.monthlyCents[month]
        : category.monthlyCents.reduce<number>((sum, amount) => sum + amount, 0),
    color: categoryColors[category.key],
  }));

  return (
    <Card className="mt-2 gap-5">
      <View className="gap-1">
        <Text
          accessibilityRole="header"
          className="font-display-semi text-[22px] leading-[28px] text-ink dark:text-ink-dark"
        >
          {t('accounts.expenses.title')}
        </Text>
        <Text className="font-body text-[12px] leading-[18px] text-ink-soft dark:text-ink-dark-soft">
          {t('accounts.expenses.sampleNotice', { year: DEMO_EXPENSE_YEAR })}
        </Text>
      </View>
      <View className="flex-row gap-2 rounded-pill bg-surface-hi/50 p-1 dark:bg-surface-dark-hi">
        {(['monthly', 'annual'] as const).map((option) => (
          <View className="flex-1" key={option}>
            <Chip selected={period === option} onPress={() => setPeriod(option)}>
              {t(`accounts.expenses.periods.${option}`)}
            </Chip>
          </View>
        ))}
      </View>
      {period === 'monthly' ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2 py-1"
        >
          {MONTHS.map((date, index) => (
            <Chip
              key={index}
              selected={month === index}
              accessibilityLabel={fullMonth.format(date)}
              onPress={() => setMonth(index)}
            >
              {shortMonth.format(date)}
            </Chip>
          ))}
        </ScrollView>
      ) : null}
      <Text className="text-center font-label text-[13px] leading-[18px] text-ink-soft dark:text-ink-dark-soft">
        {periodLabel}
      </Text>
      <ExpenseDonut segments={breakdown} periodLabel={periodLabel} />
      <View>
        {breakdown.map((category, index) => (
          <View
            key={category.key}
            className={`flex-row items-center gap-3 py-3 ${index < breakdown.length - 1 ? 'border-b border-outline dark:border-outline-dark' : ''}`}
          >
            <View className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color }} />
            <Text className="flex-1 font-body text-[14px] leading-[20px] text-ink dark:text-ink-dark">
              {t(`accounts.expenses.categories.${category.key}`)}
            </Text>
            <Text className="font-body-semi text-[14px] leading-[20px] text-ink dark:text-ink-dark">
              {formatCurrency(category.amountCents, locale)}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}
