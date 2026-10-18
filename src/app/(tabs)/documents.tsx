import { FileText, ShieldCheck } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, Text, View } from 'react-native';

import { appDataSource } from '@/data';
import {
  Card,
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  ScreenHeader,
  SectionHeader,
} from '@/design-system';
import { useDataResource } from '@/hooks/use-data-resource';
import { PdfButton } from '@/features/documents/PdfButton';
import { isDemoMode } from '@/lib/app-config';
import { useTheme } from '@/hooks/use-theme';
import { formatShortDate } from '@/utils/formatters';

export default function DocumentsScreen() {
  const { t, i18n } = useTranslation();
  const colors = useTheme();
  const resource = useDataResource(appDataSource.getDocuments);
  const locale = i18n.resolvedLanguage ?? 'ca';

  return (
    <View className="flex-1 bg-bg dark:bg-bg-dark">
      <ScreenHeader
        subtitle={t('documents.subtitle')}
        title={t('tabs.documents')}
        variant="section"
      />
      <ScrollView
        contentContainerClassName="px-5 pb-12"
        contentInsetAdjustmentBehavior="automatic"
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
        {resource.status === 'success' && resource.data.length === 0 ? (
          <EmptyState
            icon={<FileText color={colors.primary} size={28} />}
            title={t('empty.documents')}
            subtitle={t('empty.documentsSubtitle')}
          />
        ) : null}
        {resource.status === 'success' && resource.data.length > 0 ? (
          <>
            <Card className="mt-2 flex-row items-center gap-3 bg-surface-hi shadow-none dark:bg-surface-dark-hi">
              <ShieldCheck color={colors.primary} size={22} />
              <Text className="flex-1 font-body text-[12px] leading-[17px] text-ink-soft dark:text-ink-dark-soft">
                {t('documents.secureNotice')}
              </Text>
            </Card>
            <SectionHeader title={t('documents.sections.all')} />
            <View className="gap-3">
              {resource.data.map((document) => (
                <Card className="gap-4" key={document.id}>
                  <View className="flex-row items-center gap-3">
                    <View className="h-11 w-11 items-center justify-center rounded-full bg-surface-hi dark:bg-surface-dark-hi">
                      <FileText color={colors.primary} size={21} />
                    </View>
                    <View className="flex-1">
                      <Text className="font-body-semi text-[15px] leading-[21px] text-ink dark:text-ink-dark">
                        {document.title}
                      </Text>
                      <Text className="mt-0.5 font-body text-[11px] leading-[15px] text-ink-muted dark:text-ink-dark-soft">
                        {document.fileType} · {document.fileSize} ·{' '}
                        {formatShortDate(document.updatedAt, locale)}
                      </Text>
                    </View>
                  </View>
                  <PdfButton
                    available={!isDemoMode}
                    getUrl={() => appDataSource.getDocumentUrl(document.id)}
                  />
                </Card>
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}
