import { Eye, EyeOff } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  type TextInputInstance,
  View,
  useColorScheme,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/features/auth/AuthProvider';
import { useTheme } from '@/hooks/use-theme';

export default function LoginScreen() {
  const { t } = useTranslation();
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const auth = useAuth();
  const colorScheme = useColorScheme();
  const { width, height } = useWindowDimensions();
  const compact = height < 740;
  const small = width < 360 || compact;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const passwordInput = useRef<TextInputInstance>(null);
  const submitting = useRef(false);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);
  const inputStyle =
    'min-h-7 py-0 font-body text-[16px] leading-[24px] text-ink dark:text-ink-dark';
  const fieldStyle = 'gap-1 rounded-lg border px-4 py-3';
  const fieldSurface = (focused: boolean) =>
    focused
      ? 'border-primary bg-surface dark:border-primary-darkmode dark:bg-surface-dark'
      : 'border-transparent bg-primary/5 dark:bg-surface-dark';
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
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          contentContainerStyle={{
            flexGrow: 1,
            alignItems: 'center',
            paddingHorizontal: width < 360 ? 24 : 30,
            paddingTop: insets.top + (compact ? 24 : 36),
            paddingBottom: insets.bottom + 24,
          }}
        >
          <View className="w-full flex-1" style={{ maxWidth: 440 }}>
            <View className="flex-row items-center gap-3">
              <View
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                className="h-10 w-10 items-center justify-center rounded-md bg-primary"
                style={{ borderCurve: 'continuous' }}
              >
                <Text className="font-display text-[23px] leading-[30px] text-primary-on">N</Text>
              </View>
              <Text className="font-label text-[13px] uppercase tracking-[2px] text-primary dark:text-primary-darkmode">
                Neighbours
              </Text>
            </View>

            <View style={{ paddingTop: compact ? 28 : 44 }}>
              <Text
                accessibilityRole="header"
                accessibilityLabel={t('auth.title')}
                className="font-display text-ink dark:text-ink-dark"
                style={{ fontSize: small ? 36 : 40, lineHeight: small ? 40 : 45 }}
              >
                {t('auth.titleLead')}{' '}
                <Text
                  className="text-primary dark:text-primary-darkmode"
                  style={{ fontFamily: 'PlayfairDisplay_700Bold_Italic' }}
                >
                  {t('auth.titleAccent')}
                </Text>
              </Text>
              <Text className="mt-4 font-body text-[15px] leading-[23px] text-ink-soft dark:text-ink-dark-soft">
                {t('auth.subtitle')}
              </Text>
            </View>

            <View className="gap-4" style={{ paddingTop: compact ? 24 : 32 }}>
              <View
                className={`${fieldStyle} ${fieldSurface(focusedField === 'email')}`}
                style={{ borderCurve: 'continuous' }}
              >
                <Text
                  nativeID="email-label"
                  className="font-body-semi text-[12px] leading-[18px] text-ink-soft dark:text-ink-dark-soft"
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
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  editable={!busy}
                  placeholderTextColor={colors.muted}
                  placeholder={t('auth.emailPlaceholder')}
                  onSubmitEditing={() => passwordInput.current?.focus()}
                />
              </View>
              <View
                className={`${fieldStyle} flex-row items-center gap-2 pr-2 ${fieldSurface(focusedField === 'password')}`}
                style={{ borderCurve: 'continuous' }}
              >
                <View className="flex-1 gap-1">
                  <Text
                    nativeID="password-label"
                    className="font-body-semi text-[12px] leading-[18px] text-ink-soft dark:text-ink-dark-soft"
                  >
                    {t('auth.password')}
                  </Text>
                  <TextInput
                    ref={passwordInput}
                    accessibilityLabel={t('auth.password')}
                    accessibilityLabelledBy="password-label"
                    className={inputStyle}
                    secureTextEntry={!showPassword}
                    autoComplete="current-password"
                    textContentType="password"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="go"
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    editable={!busy}
                    placeholderTextColor={colors.muted}
                    placeholder={t('auth.passwordPlaceholder')}
                    onSubmitEditing={() => void submit()}
                  />
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t(showPassword ? 'auth.hidePassword' : 'auth.showPassword')}
                  disabled={busy}
                  className="h-11 w-11 items-center justify-center rounded-full active:bg-surface-hi dark:active:bg-surface-dark-hi"
                  onPress={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? (
                    <EyeOff color={colors.primary} size={21} />
                  ) : (
                    <Eye color={colors.primary} size={21} />
                  )}
                </Pressable>
              </View>
              {error ? (
                <Text
                  accessibilityRole="alert"
                  className="font-body text-[13px] leading-[19px] text-danger"
                >
                  {error}
                </Text>
              ) : null}
            </View>

            <View className="mt-auto gap-4 pt-8">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('auth.signIn')}
                accessibilityState={{ disabled: !valid || busy, busy }}
                disabled={!valid || busy}
                onPress={() => void submit()}
                className={`min-h-14 items-center justify-center rounded-full px-6 py-4 ${
                  valid
                    ? 'bg-ink active:bg-ink/90 dark:bg-primary-darkmode dark:active:bg-primary-darkmode/90'
                    : 'bg-outline/40 dark:bg-outline-dark'
                }`}
              >
                {busy ? (
                  <ActivityIndicator color={colors.onPrimary} />
                ) : (
                  <Text
                    className={`text-center font-label text-[16px] leading-[24px] ${valid ? 'text-primary-on' : 'text-ink-muted dark:text-ink-dark-soft'}`}
                  >
                    {t('auth.signIn')}
                  </Text>
                )}
              </Pressable>
              <Text className="text-center font-body text-[12px] leading-[19px] text-ink-soft dark:text-ink-dark-soft">
                {t('auth.helpTitle')}
                {'\n'}
                <Text className="font-body-semi text-ink dark:text-ink-dark">
                  {t('auth.helpBody')}
                </Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
