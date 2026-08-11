import { router, useFocusEffect } from 'expo-router';
import {
  Calendar,
  CalendarCheck,
  IdCard,
  KeyRound,
  MessageSquare,
  Receipt,
  TriangleAlert,
  User,
  Vote,
} from 'lucide-react-native';
import { createContext, use, useCallback, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, Text, View } from 'react-native';

type MesSheetContextValue = {
  openSheet: () => void;
  closeSheet: () => void;
  /** Última pestanya visitada: el sheet s'obre des de "Més" i s'hi retorna. */
  lastTab: string;
  setLastTab: (path: string) => void;
};

const MesSheetContext = createContext<MesSheetContextValue>({
  openSheet: () => {},
  closeSheet: () => {},
  lastTab: '/',
  setLastTab: () => {},
});

export function useMesSheet() {
  return use(MesSheetContext);
}

/** Registra la pestanya actual com a "última" per al retorn del sheet de Més. */
export function useTrackLastTab(path: string) {
  const { setLastTab } = useMesSheet();
  useFocusEffect(
    useCallback(() => {
      setLastTab(path);
    }, [path, setLastTab])
  );
}

export function MesSheetProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [lastTab, setLastTab] = useState('/');
  return (
    <MesSheetContext
      value={{
        openSheet: () => setOpen(true),
        closeSheet: () => setOpen(false),
        lastTab,
        setLastTab,
      }}
    >
      {children}
      <MesSheet open={open} onClose={() => setOpen(false)} />
    </MesSheetContext>
  );
}

const MODULES = [
  { key: 'voting', icon: Vote, danger: false },
  { key: 'bookings', icon: CalendarCheck, danger: false },
  { key: 'directory', icon: IdCard, danger: false },
  { key: 'calendar', icon: Calendar, danger: false },
  { key: 'board', icon: MessageSquare, danger: false },
  { key: 'profile', icon: User, danger: false },
  { key: 'emergencies', icon: TriangleAlert, danger: true },
  { key: 'receipts', icon: Receipt, danger: false },
  { key: 'access', icon: KeyRound, danger: false },
] as const;

/** Bottom sheet "Més apartaments": graella de mòduls sobre la pantalla actual. */
function MesSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        accessibilityLabel={t('common.cancel')}
        className="flex-1 justify-end bg-black/40"
        onPress={onClose}
      >
        <Pressable className="rounded-t-2xl bg-surface px-5 pb-10 pt-3 dark:bg-surface-dark" onPress={() => {}}>
          <View className="mb-4 h-1 w-10 self-center rounded-full bg-outline dark:bg-outline-dark" />
          <Text className="mb-5 font-display-semi text-[20px] leading-[26px] text-ink dark:text-ink-dark">
            {t('more.title')}
          </Text>
          <View className="flex-row flex-wrap">
            {MODULES.map(({ key, icon: Icon, danger }) => (
              <Pressable
                key={key}
                accessibilityRole="button"
                className="w-1/3 items-center gap-2 py-3 active:opacity-60"
                onPress={onClose}
              >
                <View
                  className={`h-14 w-14 items-center justify-center rounded-full ${
                    danger ? 'bg-danger/10' : 'bg-surface-hi dark:bg-surface-dark-hi'
                  }`}
                >
                  <Icon color={danger ? '#BA1A1A' : '#803EF6'} size={24} />
                </View>
                <Text className="font-label text-[12px] leading-[16px] text-ink dark:text-ink-dark">
                  {t(`more.modules.${key}`)}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/** Pantalla de la pestanya "Més": no té contingut; obre el sheet i torna enrere. */
export function useOpenMesSheetOnFocus() {
  const { openSheet, lastTab } = useMesSheet();
  useFocusEffect(
    useCallback(() => {
      openSheet();
      // Torna a la pestanya anterior perquè el sheet s'hi obri a sobre.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.navigate(lastTab as any);
    }, [openSheet, lastTab])
  );
  return null;
}
