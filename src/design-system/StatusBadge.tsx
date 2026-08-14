import { Text, View } from 'react-native';

export type IncidentStatus = 'received' | 'in-progress' | 'resolved';

const badgeStyles: Record<IncidentStatus, string> = {
  received: 'bg-surface-hi dark:bg-surface-dark-hi',
  'in-progress': 'bg-tertiary/15',
  resolved: 'bg-secondary/25',
};

const dotStyles: Record<IncidentStatus, string> = {
  received: 'bg-primary dark:bg-primary-darkmode',
  'in-progress': 'bg-tertiary',
  resolved: 'bg-secondary-txt dark:bg-secondary',
};

const labelStyles: Record<IncidentStatus, string> = {
  received: 'text-ink dark:text-ink-dark',
  'in-progress': 'text-tertiary-txt dark:text-tertiary',
  resolved: 'text-secondary-txt dark:text-secondary',
};

/** Badge d'estat d'incidència: rebuda / en gestió / resolta. */
export function StatusBadge({ status, label }: { status: IncidentStatus; label: string }) {
  return (
    <View
      accessibilityRole="text"
      className={`flex-row items-center gap-1.5 self-start rounded-md px-2.5 py-1 ${badgeStyles[status]}`}
    >
      <View className={`h-1.5 w-1.5 rounded-full ${dotStyles[status]}`} />
      <Text className={`font-label text-[11px] leading-[14px] ${labelStyles[status]}`}>
        {label}
      </Text>
    </View>
  );
}
