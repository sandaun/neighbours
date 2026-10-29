import * as Linking from 'expo-linking';
import { Phone } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { Card } from '@/design-system/Card';
import { SectionHeader } from '@/design-system/SectionHeader';
import { useTheme } from '@/hooks/use-theme';

const CONTACTS = [
  { key: 'locksmith', number: 'XXXXXXX' },
  { key: 'general', number: '112' },
  { key: 'elevator', number: 'XXXXXX' },
  { key: 'insurance', number: 'XXXXXX' },
] as const;

export function EmergenciesContent() {
  const { t } = useTranslation();
  const colors = useTheme();
  const [openingContact, setOpeningContact] = useState<string | null>(null);
  const [failedContact, setFailedContact] = useState<string | null>(null);
  const pending = useRef(false);

  async function call(key: string, number: string) {
    if (pending.current) return;
    pending.current = true;
    setOpeningContact(key);
    setFailedContact(null);
    try {
      await Linking.openURL(`tel:${number}`);
    } catch {
      setFailedContact(key);
    } finally {
      pending.current = false;
      setOpeningContact(null);
    }
  }

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerClassName="px-5 pb-12">
      <Text className="pt-5 font-body text-[14px] leading-[20px] text-ink-soft dark:text-ink-dark-soft">
        {t('more.modules.emergencies.description')}
      </Text>
      <SectionHeader title={t('more.modules.sections.emergencyContacts')} />
      <View className="gap-3">
        {CONTACTS.map((contact) => {
          const name = t(`more.modules.emergencies.contacts.${contact.key}.title`);
          const canCall = /^\+?\d{3,15}$/.test(contact.number);
          const opening = openingContact === contact.key;
          const disabled = !canCall || openingContact !== null;

          return (
            <Card key={contact.key} className="gap-3">
              <View className="flex-row items-center gap-4">
                <View className="flex-1 gap-1">
                  <Text className="font-body-semi text-[15px] leading-[22px] text-ink dark:text-ink-dark">
                    {name}
                  </Text>
                  <Text className="font-body text-[12px] leading-[18px] text-ink-soft dark:text-ink-dark-soft">
                    {t(`more.modules.emergencies.contacts.${contact.key}.description`)}
                  </Text>
                  <Text className="mt-1 font-display-semi text-[23px] leading-[29px] text-ink dark:text-ink-dark">
                    {contact.number}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('more.modules.emergencies.call', { name })}
                  accessibilityHint={t(
                    canCall
                      ? 'more.modules.emergencies.callHint'
                      : 'more.modules.emergencies.numberPending'
                  )}
                  accessibilityState={{ disabled, busy: opening }}
                  disabled={disabled}
                  onPress={() => void call(contact.key, contact.number)}
                  className={`h-12 w-12 items-center justify-center rounded-full bg-secondary/25 active:bg-secondary/40 ${disabled ? 'opacity-40' : ''}`}
                >
                  {opening ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : (
                    <Phone color={canCall ? colors.primary : colors.muted} size={23} />
                  )}
                </Pressable>
              </View>
              {failedContact === contact.key ? (
                <Text
                  accessibilityRole="alert"
                  className="font-body text-[13px] leading-[18px] text-danger dark:text-danger-soft"
                >
                  {t('more.modules.emergencies.callError', { number: contact.number })}
                </Text>
              ) : null}
            </Card>
          );
        })}
      </View>
      <Text className="mt-5 font-body text-[12px] leading-[18px] text-ink-muted dark:text-ink-dark-soft">
        {t('more.modules.emergencies.sampleNotice')}
      </Text>
    </ScrollView>
  );
}
