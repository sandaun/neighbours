import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card } from '@/design-system';
import { useAuth } from '@/features/auth/AuthProvider';
import { useTheme } from '@/hooks/use-theme';

export default function LoginScreen() {
  const { t } = useTranslation();
  const colors = useTheme();
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [requestedEmail, setRequestedEmail] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputStyle =
    'rounded-md border border-outline bg-surface px-4 py-3 font-body text-[15px] text-ink dark:border-outline-dark dark:bg-surface-dark dark:text-ink-dark';
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
    <SafeAreaView className="flex-1 bg-bg dark:bg-bg-dark">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }}
        >
          <View className="mb-8 gap-3">
            <Text className="font-label text-[12px] uppercase tracking-widest text-primary dark:text-primary-darkmode">
              Neighbours
            </Text>
            <Text
              accessibilityRole="header"
              className="font-display text-[32px] leading-[40px] text-ink dark:text-ink-dark"
            >
              {t('auth.title')}
            </Text>
            <Text className="font-body text-[15px] leading-[22px] text-ink-soft dark:text-ink-dark-soft">
              {t('auth.subtitle')}
            </Text>
          </View>
          <Card className="gap-4">
            {requestedEmail ? (
              <>
                <Text className="font-body text-[14px] leading-[21px] text-ink dark:text-ink-dark">
                  {t('auth.codeSent', { email: requestedEmail })}
                </Text>
                <Text
                  nativeID="code-label"
                  className="font-label text-[13px] text-ink dark:text-ink-dark"
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
                  onSubmitEditing={() => void submit()}
                />
              </>
            ) : (
              <>
                <Text
                  nativeID="email-label"
                  className="font-label text-[13px] text-ink dark:text-ink-dark"
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
                  onSubmitEditing={() => void submit()}
                />
              </>
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
            <Text className="font-body text-[12px] leading-[18px] text-ink-soft dark:text-ink-dark-soft">
              {t('auth.inviteOnly')}
            </Text>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
