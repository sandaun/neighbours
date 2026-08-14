import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';

type ButtonVariant = 'primary' | 'outline' | 'danger' | 'ghost';

type ButtonProps = Omit<PressableProps, 'children'> & {
  variant?: ButtonVariant;
  loading?: boolean;
  children: string;
};

const containerStyles: Record<ButtonVariant, string> = {
  primary: 'bg-primary active:bg-primary-dark',
  outline:
    'bg-transparent border border-outline active:bg-surface-hi dark:border-outline-dark dark:active:bg-surface-dark-hi',
  danger: 'bg-danger active:bg-danger-dark',
  ghost: 'bg-transparent active:bg-surface-hi dark:active:bg-surface-dark-hi',
};

const labelStyles: Record<ButtonVariant, string> = {
  primary: 'text-primary-on',
  outline: 'text-primary dark:text-primary-darkmode',
  danger: 'text-primary-on',
  ghost: 'text-primary dark:text-primary-darkmode',
};

export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      className={`h-12 flex-row items-center justify-center rounded-md px-6 ${containerStyles[variant]} ${isDisabled ? 'opacity-40' : ''}`}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'danger' ? '#FFFFFF' : '#803EF6'}
        />
      ) : (
        <Text className={`font-label text-[13px] leading-[18px] ${labelStyles[variant]}`}>
          {children}
        </Text>
      )}
    </Pressable>
  );
}
