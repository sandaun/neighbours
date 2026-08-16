import { CheckCircle2, Clock3, Wallet } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';

import { appDataSource } from '@/data';
import {
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  ScreenHeader,
  SectionHeader,
} from '@/design-system';
import { useDataResource } from '@/hooks/use-data-resource';
import { useTheme } from '@/hooks/use-theme';
import { formatCurrency, formatShortDate } from '@/utils/formatters';

export default function AccountsScreen() {
  const { t, i18n } = useTranslation();
  const colors = useTheme();
  const resource = useDataResource(appDataSource.getAccounts);
  const locale = i18n.resolvedLanguage ?? 'ca';

  return (
    <View className="flex-1 bg-bg dark:bg-bg-dark">
      <ScreenHeader
        subtitle={t('accounts.subtitle')}
        title={t('tabs.accounts')}
        variant="section"
      />
      <ScrollView contentContainerClassName="px-5 pb-12" contentInsetAdjustmentBehavior="automatic">
        {resource.status === 'loading' ? <LoadingState label={t('common.loading')} /> : null}
        {resource.status === 'error' ? (
          <ErrorState subtitle={t('errors.loadSubtitle')} title={t('errors.loadTitle')} />
        ) : null}
        {resource.status === 'success' && resource.data.receipts.length === 0 ? (
          <EmptyState
            icon={<Wallet color={colors.primary} size={28} />}
            title={t('empty.accounts')}
            subtitle={t('empty.accountsSubtitle')}
          />
        ) : null}
        {resource.status === 'success' && resource.data.receipts.length > 0 ? (
          <>
            <Card
              className="mt-2 gap-5"
              style={{ backgroundColor: colors.primary }}
              variant="elevated"
            >
              <View>
                <Text className="font-label text-[10px] uppercase leading-[14px] tracking-[1.1px] text-primary-on/70">
                  {t('accounts.balance')}
                </Text>
                <Text className="mt-1 font-display text-[32px] leading-[38px] text-primary-on">
                  {formatCurrency(resource.data.balanceCents, locale)}
                </Text>
                <Text className="font-body text-[12px] leading-[17px] text-primary-on/80">
                  {t('accounts.upToDate')}
                </Text>
              </View>
              <View className="h-px bg-primary-on/20" />
              <View className="flex-row items-end justify-between gap-3">
                <View className="flex-1">
                  <Text className="font-label text-[10px] uppercase leading-[14px] tracking-[1.1px] text-primary-on/70">
                    {t('accounts.nextCharge')}
                  </Text>
                  <Text className="mt-1 font-body-semi text-[15px] leading-[22px] text-primary-on">
                    {formatShortDate(resource.data.nextChargeAt, locale)}
                  </Text>
                </View>
                <Text className="font-display-semi text-[23px] leading-[29px] text-primary-on">
                  {formatCurrency(resource.data.nextChargeCents, locale)}
                </Text>
              </View>
            </Card>

            <SectionHeader title={t('accounts.sections.receipts')} />
            <View className="gap-3">
              {resource.data.receipts.map((receipt) => {
                const isPaid = receipt.status === 'paid';
                const Icon = isPaid ? CheckCircle2 : Clock3;

                return (
                  <Card className="flex-row items-center gap-3" key={receipt.id}>
                    <View className="h-10 w-10 items-center justify-center rounded-full bg-surface-hi dark:bg-surface-dark-hi">
                      <Icon color={isPaid ? colors.primary : colors.warning} size={20} />
                    </View>
                    <View className="flex-1">
                      <Text className="font-body-semi text-[14px] leading-[20px] text-ink dark:text-ink-dark">
                        {receipt.concept}
                      </Text>
                      <Text className="font-body text-[11px] leading-[15px] text-ink-muted dark:text-ink-dark-soft">
                        {receipt.period} · {t(`accounts.status.${receipt.status}`)}
                      </Text>
                    </View>
                    <Text className="font-body-semi text-[14px] leading-[20px] text-ink dark:text-ink-dark">
                      {formatCurrency(receipt.amountCents, locale)}
                    </Text>
                  </Card>
                );
              })}
            </View>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}
