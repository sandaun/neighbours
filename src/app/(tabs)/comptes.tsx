import { CheckCircle2, Clock3, Wallet } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { RefreshControl, Text, View } from 'react-native';

import { appDataSource } from '@/data';
import {
  Card,
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  CollapsibleScreen,
  SectionHeader,
} from '@/design-system';
import { useDataResource } from '@/hooks/use-data-resource';
import { PdfButton } from '@/features/documents/PdfButton';
import { ExpensesCard } from '@/features/accounts/ExpensesCard';
import { useTheme } from '@/hooks/use-theme';
import { formatCurrency, formatShortDate } from '@/utils/formatters';

export default function AccountsScreen() {
  const { t, i18n } = useTranslation();
  const colors = useTheme();
  const resource = useDataResource(appDataSource.getAccounts);
  const locale = i18n.resolvedLanguage ?? 'ca';

  return (
    <View className="flex-1 bg-bg dark:bg-bg-dark">
      <CollapsibleScreen
        header={{ subtitle: t('accounts.subtitle'), title: t('tabs.accounts'), variant: 'section' }}
        contentContainerClassName="px-5 pb-12"
        refreshControl={
          <RefreshControl
            refreshing={resource.refreshing && resource.status !== 'loading'}
            onRefresh={resource.reload}
          />
        }
      >
        {resource.status === 'loading' ? <LoadingState label={t('common.loading')} /> : null}
        {resource.status === 'error' ? (
          <View>
            <ErrorState subtitle={t('errors.loadSubtitle')} title={t('errors.loadTitle')} />
            <Button onPress={resource.reload}>{t('common.retry')}</Button>
          </View>
        ) : null}
        {resource.status === 'success' ? (
          <>
            <ExpensesCard />
            <Card
              className="mt-5 gap-5"
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
                  {t(
                    resource.data.balanceCents === 0 ? 'accounts.upToDate' : 'accounts.balanceInfo'
                  )}
                </Text>
              </View>
              <View className="h-px bg-primary-on/20" />
              <View className="flex-row items-end justify-between gap-3">
                <View className="flex-1">
                  <Text className="font-label text-[10px] uppercase leading-[14px] tracking-[1.1px] text-primary-on/70">
                    {t('accounts.nextCharge')}
                  </Text>
                  <Text className="mt-1 font-body-semi text-[15px] leading-[22px] text-primary-on">
                    {resource.data.nextChargeAt
                      ? formatShortDate(resource.data.nextChargeAt, locale)
                      : t('accounts.noScheduledCharge')}
                  </Text>
                </View>
                <Text className="font-display-semi text-[23px] leading-[29px] text-primary-on">
                  {resource.data.nextChargeCents !== null
                    ? formatCurrency(resource.data.nextChargeCents, locale)
                    : '—'}
                </Text>
              </View>
            </Card>

            <SectionHeader title={t('accounts.sections.receipts')} />
            {resource.data.receipts.length === 0 ? (
              <EmptyState
                icon={<Wallet color={colors.primary} size={28} />}
                title={t('empty.accounts')}
                subtitle={t('empty.accountsSubtitle')}
              />
            ) : null}
            <View className="gap-3">
              {resource.data.receipts.map((receipt) => {
                const isPaid = receipt.status === 'paid';
                const Icon = isPaid ? CheckCircle2 : Clock3;

                return (
                  <Card className="gap-4" key={receipt.id}>
                    <View className="flex-row items-center gap-3">
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
                    </View>
                    {receipt.hasFile ? (
                      <PdfButton getUrl={() => appDataSource.getReceiptUrl(receipt.id)} />
                    ) : null}
                  </Card>
                );
              })}
            </View>
          </>
        ) : null}
      </CollapsibleScreen>
    </View>
  );
}
