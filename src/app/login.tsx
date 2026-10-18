import { Eye, EyeOff, KeyRound, ShieldCheck } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
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
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const passwordInput = useRef<TextInput>(null);
  const submitting = useRef(false);
  const inputStyle =
    'min-h-[52px] rounded-md border border-outline bg-bg px-4 py-3 font-body text-[15px] text-ink dark:border-outline-dark dark:bg-bg-dark dark:text-ink-dark';
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && password.length > 0;

  async function submit() {
    if (submitting.current || !valid) return;
    submitting.current = true;
    setBusy(true);
    setError(null);
    try {
      await auth.signIn(email.trim().toLowerCase(), password);
    } catch {
      setError(t('auth.signInError'));
    } finally {
      submitting.current = false;
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
                  <KeyRound color={colors.primary} size={21} strokeWidth={1.8} />
                </View>
                <Text
                  accessibilityRole="header"
                  className="flex-1 font-body-semi text-[16px] leading-[23px] text-ink dark:text-ink-dark"
                >
                  {t('auth.accessTitle')}
                </Text>
              </View>
              <View className="gap-4">
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
                    returnKeyType="next"
                    submitBehavior="submit"
                    value={email}
                    onChangeText={setEmail}
                    editable={!busy}
                    placeholderTextColor={colors.muted}
                    placeholder={t('auth.emailPlaceholder')}
                    onSubmitEditing={() => passwordInput.current?.focus()}
                  />
                </View>
                <View className="gap-2">
                  <Text
                    nativeID="password-label"
                    className="font-label text-[12px] leading-[18px] text-ink dark:text-ink-dark"
                  >
                    {t('auth.password')}
                  </Text>
                  <View>
                    <TextInput
                      ref={passwordInput}
                      accessibilityLabel={t('auth.password')}
                      accessibilityLabelledBy="password-label"
                      className={`${inputStyle} pr-14`}
                      secureTextEntry={!showPassword}
                      autoComplete="current-password"
                      textContentType="password"
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="go"
                      value={password}
                      onChangeText={setPassword}
                      editable={!busy}
                      placeholderTextColor={colors.muted}
                      placeholder={t('auth.passwordPlaceholder')}
                      onSubmitEditing={() => void submit()}
                    />
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t(
                        showPassword ? 'auth.hidePassword' : 'auth.showPassword'
                      )}
                      disabled={busy}
                      className="absolute bottom-0 right-1 top-0 w-11 items-center justify-center rounded-md active:bg-surface-hi dark:active:bg-surface-dark-hi"
                      onPress={() => setShowPassword((value) => !value)}
                    >
                      {showPassword ? (
                        <EyeOff color={colors.muted} size={20} />
                      ) : (
                        <Eye color={colors.muted} size={20} />
                      )}
                    </Pressable>
                  </View>
                </View>
                {error ? (
                  <Text
                    accessibilityRole="alert"
                    className="font-body text-[13px] leading-[19px] text-danger"
                  >
                    {error}
                  </Text>
                ) : null}
                <Button disabled={!valid} loading={busy} onPress={() => void submit()}>
                  {t('auth.signIn')}
                </Button>
              </View>
              <View className="flex-row items-start gap-3 border-t border-outline pt-5 dark:border-outline-dark">
                <ShieldCheck color={colors.muted} size={18} strokeWidth={1.8} />
                <Text className="flex-1 font-body text-[12px] leading-[18px] text-ink-soft dark:text-ink-dark-soft">
                  {t('auth.managedAccess')}
                </Text>
              </View>
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
