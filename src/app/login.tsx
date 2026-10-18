import { KeyRound, Mail, ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Card, ScreenHeader } from '@/design-system';
import { useAuth } from '@/features/auth/AuthProvider';
import { useTheme } from '@/hooks/use-theme';

export default function LoginScreen() {
  const { t } = useTranslation();
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [requestedEmail, setRequestedEmail] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputStyle =
    'min-h-[52px] rounded-md border border-outline bg-bg px-4 py-3 font-body text-[15px] text-ink dark:border-outline-dark dark:bg-bg-dark dark:text-ink-dark';
  const valid = requestedEmail
    ? /^\d{6,10}$/.test(code.trim())
    : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  async function submit() {
    if (busy || !valid) return;
    setBusy(true);
    setError(null);
    try {
      if (requestedEmail) await auth.verifyCode(requestedEmail, code);
      else {
        const normalized = email.trim().toLowerCase();
        await auth.sendCode(normalized);
        setRequestedEmail(normalized);
      }
    } catch {
      setError(t(requestedEmail ? 'auth.invalidCode' : 'auth.sendError'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View className="flex-1 bg-bg dark:bg-bg-dark">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingTop: insets.top + 24,
            paddingBottom: insets.bottom + 24,
          }}
        >
          <Card className="overflow-hidden" style={{ width: '100%', maxWidth: 480, padding: 0 }}>
            <ScreenHeader
              embedded
              overline="Neighbours"
              title={t('auth.title')}
              subtitle={t('auth.subtitle')}
            />
            <View className="gap-6 p-5">
              <View className="flex-row items-center gap-3">
                <View className="h-11 w-11 items-center justify-center rounded-md bg-surface-hi dark:bg-surface-dark-hi">
                  {requestedEmail ? (
                    <KeyRound color={colors.primary} size={21} strokeWidth={1.8} />
                  ) : (
                    <Mail color={colors.primary} size={21} strokeWidth={1.8} />
                  )}
                </View>
                <Text
                  accessibilityRole="header"
                  className="flex-1 font-body-semi text-[16px] leading-[23px] text-ink dark:text-ink-dark"
                >
                  {t(requestedEmail ? 'auth.codeTitle' : 'auth.accessTitle')}
                </Text>
              </View>
              <View className="gap-4">
                {requestedEmail ? (
                  <>
                    <Text className="font-body text-[14px] leading-[21px] text-ink-soft dark:text-ink-dark-soft">
                      {t('auth.codeSent', { email: requestedEmail })}
                    </Text>
                    <View className="gap-2">
                      <Text
                        nativeID="code-label"
                        className="font-label text-[12px] leading-[18px] text-ink dark:text-ink-dark"
                      >
                        {t('auth.code')}
                      </Text>
                      <TextInput
                        accessibilityLabel={t('auth.code')}
                        accessibilityLabelledBy="code-label"
                        className={inputStyle}
                        keyboardType="number-pad"
                        autoComplete="one-time-code"
                        textContentType="oneTimeCode"
                        maxLength={10}
                        value={code}
                        onChangeText={setCode}
                        editable={!busy}
                        placeholderTextColor={colors.muted}
                        placeholder={t('auth.codePlaceholder')}
                        onSubmitEditing={() => void submit()}
                      />
                    </View>
                  </>
                ) : (
                  <View className="gap-2">
                    <Text
                      nativeID="email-label"
                      className="font-label text-[12px] leading-[18px] text-ink dark:text-ink-dark"
                    >
                      {t('auth.email')}
                    </Text>
                    <TextInput
                      accessibilityLabel={t('auth.email')}
                      accessibilityLabelledBy="email-label"
                      className={inputStyle}
                      keyboardType="email-address"
                      autoComplete="email"
                      textContentType="emailAddress"
                      autoCapitalize="none"
                      autoCorrect={false}
                      value={email}
                      onChangeText={setEmail}
                      editable={!busy}
                      placeholderTextColor={colors.muted}
                      placeholder={t('auth.emailPlaceholder')}
                      onSubmitEditing={() => void submit()}
                    />
                  </View>
                )}
                {error ? (
                  <Text
                    accessibilityRole="alert"
                    className="font-body text-[13px] leading-[19px] text-danger"
                  >
                    {error}
                  </Text>
                ) : null}
                <Button disabled={!valid} loading={busy} onPress={() => void submit()}>
                  {t(requestedEmail ? 'auth.verify' : 'auth.sendCode')}
                </Button>
                {requestedEmail ? (
                  <Button
                    variant="ghost"
                    disabled={busy}
                    onPress={() => {
                      setRequestedEmail(null);
                      setCode('');
                      setError(null);
                    }}
                  >
                    {t('auth.changeEmail')}
                  </Button>
                ) : null}
              </View>
              <View className="flex-row items-start gap-3 border-t border-outline pt-5 dark:border-outline-dark">
                <ShieldCheck color={colors.muted} size={18} strokeWidth={1.8} />
                <Text className="flex-1 font-body text-[12px] leading-[18px] text-ink-soft dark:text-ink-dark-soft">
                  {t('auth.inviteOnly')}
                </Text>
              </View>
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
