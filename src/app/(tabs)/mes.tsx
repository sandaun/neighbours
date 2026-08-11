import { View } from 'react-native';

import { useOpenMesSheetOnFocus } from '@/components/mes-sheet';

/**
 * La pestanya "Més" no és una pantalla: obre el bottom sheet de mòduls
 * sobre la pestanya anterior i hi retorna (com el prototip).
 */
export default function MesTabScreen() {
  useOpenMesSheetOnFocus();
  return <View className="flex-1 bg-bg dark:bg-bg-dark" />;
}
