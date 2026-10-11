import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { actionStatus } from '../../src/engine';
import { Avatar } from '../../src/ui/components/Avatar';
import { Chip } from '../../src/ui/components/Chip';
import { Ring } from '../../src/ui/components/Ring';
import { EmptyState } from '../../src/ui/components/States';
import { Card, SectionHeader } from '../../src/ui/components/Surface';
import { TabPage } from '../../src/ui/components/TabPage';
import { Text } from '../../src/ui/components/Text';
import { ActionList } from '../../src/ui/game/actions/ActionList';
import { useActionSheet } from '../../src/ui/game/actions/store';
import { EmployeeSheet } from '../../src/ui/game/EmployeeSheet';
import { CandidateCard, EmployeeRow } from '../../src/ui/game/PersonViews';
import { useRun } from '../../src/ui/hooks/useRun';
import { useText } from '../../src/ui/i18n';
import { gutter, space } from '../../src/ui/theme/tokens';

export default function People() {
  const run = useRun();
  const { t } = useText();
  const open = useActionSheet((s) => s.open);
  const [selected, setSelected] = useState<string | null>(null);
  if (run === null) return null;
  const { game, content } = run;
  const hire = content.actions.get('hire');
  const canHire = hire !== undefined && actionStatus(game, content, hire).available;
  const cofounder =
    game.setup.cofounder === null ? undefined : content.cofounders.get(game.setup.cofounder);

  return (
    <TabPage
      title={t('ui.tab.people')}
      subtitle={t('ui.people.headcount', {
        count: game.team.length + 1 + (game.cofounderPresent ? 1 : 0),
      })}
    >
      <SectionHeader title={t('ui.people.founders')} />
      <Card style={styles.founders}>
        <View style={styles.founder}>
          <Avatar name={game.setup.founderName} color="company" />
          <View style={styles.flex}>
            <Text variant="headline">{game.setup.founderName}</Text>
            <Text variant="footnote" color="textSecondary">
              {t('ui.people.you', { background: game.setup.background })}
            </Text>
          </View>
        </View>
        {game.cofounderPresent && cofounder !== undefined ? (
          <View style={styles.founder}>
            <Avatar name={cofounder.name} color="people" />
            <View style={styles.flex}>
              <Text variant="headline">{cofounder.name}</Text>
              <Text variant="footnote" color="textSecondary">
                {t('character.cofounder.role')}
              </Text>
            </View>
            <Ring value={game.trust.cofounder} color="people" size={40} />
          </View>
        ) : null}
      </Card>

      <SectionHeader title={t('ui.people.team')} aside={String(game.team.length)} />
      {game.team.length === 0 ? (
        <Text variant="callout" color="textSecondary">
          {t('ui.people.noTeam')}
        </Text>
      ) : (
        game.team.map((e) => (
          <EmployeeRow
            key={e.id}
            employee={e}
            morale={game.stats.morale}
            onPress={() => {
              setSelected(e.id);
            }}
          />
        ))
      )}

      <SectionHeader title={t('ui.people.candidates')} aside={String(game.candidates.length)} />
      {game.candidates.length === 0 ? (
        <EmptyState
          title={t('ui.people.noCandidatesTitle')}
          body={t('ui.people.noCandidatesBody')}
          action={{
            label: t('action.openRole.name'),
            onPress: () => {
              open('openRole');
            },
          }}
        />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.carousel}
          contentContainerStyle={styles.carouselContent}
        >
          {game.candidates.map((c) => (
            <CandidateCard
              key={c.id}
              candidate={c}
              canHire={canHire}
              onHire={() => {
                open('hire', { candidate: c.id });
              }}
            />
          ))}
        </ScrollView>
      )}

      <SectionHeader title={t('ui.people.policies')} />
      <View style={styles.chips}>
        {game.settings.policies.length === 0 ? (
          <Text variant="callout" color="textSecondary">
            {t('ui.people.noPolicies')}
          </Text>
        ) : (
          game.settings.policies.map((p) => (
            <Chip key={p} label={t(`policy.${p}.name`)} tone="accent" />
          ))
        )}
      </View>

      <SectionHeader title={t('ui.people.actions')} />
      <ActionList
        game={game}
        content={content}
        tab="people"
        exclude={['hire', 'fire', 'oneOnOne', 'giveRaise', 'grantEquity', 'setOrder']}
      />
      <EmployeeSheet
        game={game}
        employee={game.team.find((e) => e.id === selected) ?? null}
        onDismiss={() => {
          setSelected(null);
        }}
      />
    </TabPage>
  );
}

const styles = StyleSheet.create({
  founders: { gap: space.m },
  founder: { flexDirection: 'row', alignItems: 'center', gap: space.m },
  flex: { flex: 1, gap: 2 },
  carousel: { marginHorizontal: -gutter },
  carouselContent: { paddingHorizontal: gutter, gap: space.m, paddingVertical: space.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
});
