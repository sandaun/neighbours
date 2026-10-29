import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';

import { Avatar } from '@/design-system/Avatar';
import { Button } from '@/design-system/Button';
import { Card } from '@/design-system/Card';
import { SectionHeader } from '@/design-system/SectionHeader';

const MEETING_DATE = new Date(Date.UTC(2026, 10, 18, 12));
const DEMO_DELEGATES = [
  { id: 'marta', name: 'Marta Puig', initials: 'MP', coefficient: 0.042 },
  { id: 'sara', name: 'Sara Martí', initials: 'SM', coefficient: 0.038 },
] as const;
type DelegateId = (typeof DEMO_DELEGATES)[number]['id'];
type VoteChoice = 'for' | 'against';
type Participation =
  { type: 'vote'; choice: VoteChoice } | { type: 'delegation'; delegateId: DelegateId };

function VoteBar({
  label,
  percentage,
  positive,
}: {
  label: string;
  percentage: number;
  positive: boolean;
}) {
  return (
    <View className="gap-2">
      <View className="flex-row justify-between gap-3">
        <Text className="flex-1 font-body-semi text-[15px] leading-[22px] text-ink dark:text-ink-dark">
          {label}
        </Text>
        <Text className="font-body-semi text-[15px] leading-[22px] text-ink dark:text-ink-dark">
          {percentage}%
        </Text>
      </View>
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={label}
        accessibilityValue={{ min: 0, max: 100, now: percentage }}
        className="h-3 overflow-hidden rounded-pill bg-surface-hi dark:bg-surface-dark-hi"
      >
        <View
          className={`h-full rounded-pill ${positive ? 'bg-primary dark:bg-primary-darkmode' : 'bg-outline dark:bg-outline-dark'}`}
          style={{ width: `${percentage}%` }}
        />
      </View>
    </View>
  );
}

export function VotingContent() {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage ?? 'ca';
  const [participation, setParticipation] = useState<Participation | null>(null);
  const vote = participation?.type === 'vote' ? participation.choice : null;
  const delegateId = participation?.type === 'delegation' ? participation.delegateId : null;
  const [choosingDelegate, setChoosingDelegate] = useState(false);
  const delegate = DEMO_DELEGATES.find((candidate) => candidate.id === delegateId);
  const favor = 17 + (vote === 'for' ? 1 : 0);
  const totalVotes = 25 + (vote !== null ? 1 : 0);
  const favorPercentage = Math.round((favor / totalVotes) * 100);
  const meetingDate = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(MEETING_DATE);
  const meetingDay = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(MEETING_DATE);
  const formatCoefficient = (value: number) =>
    new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 }).format(value);

  function selectVote(choice: VoteChoice) {
    if (delegateId !== null) return;
    setParticipation({ type: 'vote', choice });
    setChoosingDelegate(false);
  }

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerClassName="pb-12">
      <View className="gap-5 px-5 pt-5">
        <View className="gap-1">
          <Text
            accessibilityRole="header"
            className="font-display text-[26px] leading-[32px] text-ink dark:text-ink-dark"
          >
            {t('more.modules.voting.meeting')}
          </Text>
          <Text className="font-body text-[14px] leading-[20px] text-ink-soft dark:text-ink-dark-soft">
            {meetingDay}
          </Text>
        </View>
        <Card className="gap-5">
          <Text
            accessibilityRole="header"
            className="font-display-semi text-[23px] leading-[30px] text-ink dark:text-ink-dark"
          >
            {t('more.modules.voting.question')}
          </Text>
          <VoteBar
            label={t('more.modules.voting.choices.for')}
            percentage={favorPercentage}
            positive
          />
          <VoteBar
            label={t('more.modules.voting.choices.against')}
            percentage={100 - favorPercentage}
            positive={false}
          />
          <Button
            disabled={delegateId !== null}
            accessibilityState={{ selected: vote === 'for', disabled: delegateId !== null }}
            onPress={() => selectVote('for')}
          >
            {t('more.modules.voting.voteFor')}
          </Button>
          <Button
            variant="outline"
            disabled={delegateId !== null}
            accessibilityState={{ selected: vote === 'against', disabled: delegateId !== null }}
            onPress={() => selectVote('against')}
          >
            {t('more.modules.voting.voteAgainst')}
          </Button>
          {vote !== null ? (
            <View className="gap-2">
              <Text
                accessibilityLiveRegion="polite"
                className="font-body-semi text-[13px] leading-[19px] text-primary dark:text-primary-darkmode"
              >
                {t('more.modules.voting.sampleVote', {
                  choice: t(`more.modules.voting.choices.${vote}`),
                })}
              </Text>
              <Button variant="ghost" onPress={() => setParticipation(null)}>
                {t('more.modules.voting.clearVote')}
              </Button>
            </View>
          ) : null}
          {delegateId !== null ? (
            <Text className="font-body text-[13px] leading-[19px] text-ink-soft dark:text-ink-dark-soft">
              {t('more.modules.voting.delegatedHint')}
            </Text>
          ) : null}
        </Card>
        <Text className="font-body-semi text-[13px] leading-[20px] text-tertiary-txt dark:text-tertiary">
          {t('more.modules.voting.closes', { date: meetingDate })}
        </Text>
        <View>
          <SectionHeader title={t('more.modules.voting.delegateTitle')} />
          <Card className="gap-4">
            {delegate ? (
              <>
                <View className="flex-row items-center gap-4">
                  <Avatar initials={delegate.initials} size={48} />
                  <View className="flex-1 gap-1">
                    <Text className="font-body-semi text-[17px] leading-[24px] text-ink dark:text-ink-dark">
                      {delegate.name}
                    </Text>
                    <Text className="font-body text-[14px] leading-[20px] text-ink-soft dark:text-ink-dark-soft">
                      {t(`more.modules.voting.delegates.${delegate.id}.unit`)}
                    </Text>
                    <Text className="font-body text-[14px] leading-[20px] text-ink-soft dark:text-ink-dark-soft">
                      {t('more.modules.voting.coefficient', {
                        value: formatCoefficient(delegate.coefficient),
                      })}
                    </Text>
                  </View>
                </View>
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Button
                      variant="danger"
                      onPress={() => {
                        setParticipation(null);
                        setChoosingDelegate(false);
                      }}
                    >
                      {t('more.modules.voting.removeDelegate')}
                    </Button>
                  </View>
                  <View className="flex-1">
                    <Button variant="outline" onPress={() => setChoosingDelegate(true)}>
                      {t('more.modules.voting.changeDelegate')}
                    </Button>
                  </View>
                </View>
              </>
            ) : (
              <>
                <Text className="font-body text-[14px] leading-[21px] text-ink-soft dark:text-ink-dark-soft">
                  {t(
                    vote !== null
                      ? 'more.modules.voting.clearVoteHint'
                      : 'more.modules.voting.noDelegate'
                  )}
                </Text>
                <Button
                  variant="outline"
                  disabled={vote !== null}
                  onPress={() => setChoosingDelegate(true)}
                >
                  {t('more.modules.voting.chooseDelegate')}
                </Button>
              </>
            )}
            {choosingDelegate && vote === null ? (
              <View className="gap-3 border-t border-outline pt-4 dark:border-outline-dark">
                <Text className="font-label text-[12px] text-ink dark:text-ink-dark">
                  {t('more.modules.voting.demoDelegates')}
                </Text>
                {DEMO_DELEGATES.map((candidate) => (
                  <Button
                    key={candidate.id}
                    variant="outline"
                    accessibilityLabel={t('more.modules.voting.delegateTo', {
                      name: candidate.name,
                    })}
                    accessibilityState={{ selected: delegateId === candidate.id }}
                    onPress={() => {
                      setParticipation({ type: 'delegation', delegateId: candidate.id });
                      setChoosingDelegate(false);
                    }}
                  >
                    {candidate.name}
                  </Button>
                ))}
                <Button variant="ghost" onPress={() => setChoosingDelegate(false)}>
                  {t('common.cancel')}
                </Button>
              </View>
            ) : null}
          </Card>
        </View>
      </View>
    </ScrollView>
  );
}
