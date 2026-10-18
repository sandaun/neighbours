import * as WebBrowser from 'expo-web-browser';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Text, View } from 'react-native';

import { Button } from '@/design-system';

export function PdfButton({
  getUrl,
  available = true,
}: {
  getUrl: () => Promise<string>;
  available?: boolean;
}) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const pending = useRef(false);

  const open = async () => {
    if (pending.current) return;
    pending.current = true;
    setLoading(true);
    setFailed(false);
    // Reserve the web tab during the user gesture, before requesting a signed URL.
    const popup = Platform.OS === 'web' ? window.open('about:blank', '_blank') : null;
    if (popup) popup.opener = null;
    try {
      if (Platform.OS === 'web' && !popup) throw new Error('PDF window was blocked');
      const url = await getUrl();
      if (
        !url.startsWith('https://') &&
        !url.startsWith('http://localhost:') &&
        !url.startsWith('http://127.0.0.1:')
      ) {
        throw new Error('Invalid document URL');
      }
      if (popup) popup.location.href = url;
      else await WebBrowser.openBrowserAsync(url);
    } catch {
      popup?.close();
      setFailed(true);
    } finally {
      pending.current = false;
      setLoading(false);
    }
  };

  return (
    <View className="gap-2">
      <Button disabled={!available} loading={loading} onPress={open} variant="outline">
        {t('documents.openPdf')}
      </Button>
      {!available ? (
        <Text className="font-body text-[12px] leading-[17px] text-ink-muted dark:text-ink-dark-soft">
          {t('documents.demoNoFile')}
        </Text>
      ) : null}
      {failed ? (
        <Text
          accessibilityRole="alert"
          className="font-body text-[13px] leading-[18px] text-danger dark:text-danger-soft"
        >
          {t('documents.openError')}
        </Text>
      ) : null}
    </View>
  );
}
