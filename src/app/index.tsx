import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, Button, Card, Chip, ListItem, SectionHeader, StatusBadge } from '@/design-system';

function Row({ children }: { children: React.ReactNode }) {
  return <View className="flex-row flex-wrap items-center gap-3">{children}</View>;
}

export default function DesignSystemShowcase() {
  return (
    <SafeAreaView className="flex-1 bg-bg dark:bg-bg-dark" edges={['top']}>
      <ScrollView contentContainerClassName="px-5 pb-24">
        <Text className="mt-4 font-display text-[28px] leading-[34px] text-ink dark:text-ink-dark">
          Design System
        </Text>
        <Text className="font-body text-[12px] leading-[16px] text-ink-soft dark:text-ink-dark-soft">
          Mostra de components i tokens · GimTic
        </Text>

        <SectionHeader title="Tipografia" />
        <Card className="gap-1">
          <Text className="font-display text-[28px] leading-[34px] text-ink dark:text-ink-dark">
            Display · Playfair 700
          </Text>
          <Text className="font-display-semi text-[20px] leading-[26px] text-ink dark:text-ink-dark">
            Títol · Playfair 600
          </Text>
          <Text className="font-body text-[15px] leading-[22px] text-ink dark:text-ink-dark">
            Cos · Plus Jakarta Sans 400 — text principal de targetes i llistats.
          </Text>
          <Text className="font-body-semi text-[15px] leading-[22px] text-ink dark:text-ink-dark">
            Cos fort · Jakarta 600
          </Text>
          <Text className="font-label text-[13px] leading-[18px] text-ink dark:text-ink-dark">
            Etiqueta · Montserrat 600
          </Text>
          <Text className="font-body text-[12px] leading-[16px] text-ink-soft dark:text-ink-dark-soft">
            Caption · Jakarta 500 — Reportada fa 2 dies
          </Text>
        </Card>

        <SectionHeader title="Botons" />
        <Card className="gap-3">
          <Button onPress={() => {}}>Votar a favor (primary)</Button>
          <Button variant="outline" onPress={() => {}}>
            Votar en contra (outline)
          </Button>
          <Button variant="danger" onPress={() => {}}>
            Eliminar (danger)
          </Button>
          <Button variant="ghost" onPress={() => {}}>
            Ghost
          </Button>
          <Row>
            <View className="flex-1">
              <Button loading onPress={() => {}}>
                Carregant
              </Button>
            </View>
            <View className="flex-1">
              <Button disabled onPress={() => {}}>
                Desactivat
              </Button>
            </View>
          </Row>
        </Card>

        <SectionHeader title="Badges d'estat" />
        <Card>
          <Row>
            <StatusBadge status="received" label="Rebuda" />
            <StatusBadge status="in-progress" label="En gestió" />
            <StatusBadge status="resolved" label="Resolta" />
          </Row>
        </Card>

        <SectionHeader title="Xips" />
        <Card>
          <Row>
            <Chip selected onPress={() => {}}>
              Fontaneria
            </Chip>
            <Chip onPress={() => {}}>
              Electricitat
            </Chip>
            <Chip onPress={() => {}}>
              Ascensor
            </Chip>
          </Row>
        </Card>

        <SectionHeader title="Targeta d'exemple (incidència)" />
        <Card variant="elevated" className="gap-2">
          <View className="flex-row items-center justify-between">
            <Text className="font-display-semi text-[20px] leading-[26px] text-ink dark:text-ink-dark">
              Avaria a l'ascensor
            </Text>
            <StatusBadge status="in-progress" label="En gestió" />
          </View>
          <Text className="font-body text-[15px] leading-[22px] text-ink-soft dark:text-ink-dark-soft">
            L'ascensor del vestíbul no respon als botons de la planta baixa des de dimarts.
          </Text>
          <Text className="font-body text-[12px] leading-[16px] text-ink-muted dark:text-ink-dark-soft">
            Reportada fa 2 dies
          </Text>
        </Card>

        <SectionHeader title="Avatars i ítems de llista" />
        <Card className="gap-2" variant="default">
          <ListItem
            title="Marta Vidal"
            subtitle="Presidenta de la comunitat"
            leading={<Avatar initials="MV" />}
            chevron
            onPress={() => {}}
          />
          <ListItem
            title="Acta de la junta d'abril"
            subtitle="PDF · 1,2 MB"
            chevron
            onPress={() => {}}
          />
        </Card>

        <SectionHeader title="Colors" />
        <Card>
          <Row>
            {[
              ['bg-primary', 'primary'],
              ['bg-primary-dark', 'prim. fosc'],
              ['bg-secondary', 'secondary'],
              ['bg-tertiary', 'tertiary'],
              ['bg-surface-hi', 'surface-hi'],
              ['bg-highlight', 'highlight'],
              ['bg-danger', 'danger'],
              ['bg-ink', 'ink'],
            ].map(([cls, name]) => (
              <View key={cls} className="items-center gap-1">
                <View className={`h-10 w-10 rounded-md ${cls}`} />
                <Text className="font-body text-[10px] text-ink-soft dark:text-ink-dark-soft">
                  {name}
                </Text>
              </View>
            ))}
          </Row>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
