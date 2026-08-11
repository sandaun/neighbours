import { View, type ViewProps } from 'react-native';

type CardProps = ViewProps & {
  variant?: 'default' | 'elevated';
};

export function Card({ variant = 'default', className, ...props }: CardProps) {
  const elevation =
    variant === 'elevated'
      ? 'shadow-lg shadow-ink/20 elevation-4'
      : 'shadow-md shadow-ink/10 elevation-1';
  return (
    <View
      className={`rounded-lg bg-surface p-4 dark:bg-surface-dark ${elevation} ${className ?? ''}`}
      {...props}
    />
  );
}
