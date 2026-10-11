import { StyleSheet, View } from 'react-native';
import { economy } from '../../src/engine';
import { Chip } from '../../src/ui/components/Chip';
import { Icon } from '../../src/ui/components/Icon';
import { KeyValue } from '../../src/ui/components/KeyValue';
import { Card, SectionHeader } from '../../src/ui/components/Surface';
import { TabPage } from '../../src/ui/components/TabPage';
import { Text } from '../../src/ui/components/Text';
import { ActionList } from '../../src/ui/game/actions/ActionList';
import { OwnershipBar } from '../../src/ui/game/Ownership';
import { Timeline } from '../../src/ui/game/Timeline';
import { useRun } from '../../src/ui/hooks/useRun';
import { useText } from '../../src/ui/i18n';
import { describeRequirements } from '../../src/ui/requirements';
import { space } from '../../src/ui/theme/tokens';

export default function Company() {
  const run = useRun();
  const { t, percent } = useText();
  if (run === null) return null;
  const { game, content } = run;
  const stage = content.stages.get(game.stage);
  const next = content.stageOrder.find((s) => s.order === (stage?.order ?? 0) + 1);
  const requirements = next?.entry == null ? [] : describeRequirements(next.entry, game, content);
  const control = economy.investorControl(game);

  return (
    <TabPage title={game.setup.companyName} subtitle={t(`stage.${game.stage}.desc`)}>
      <SectionHeader title={t('ui.company.stage')} />
      <Card style={styles.gap}>
        <Text variant="title2">{t(`stage.${game.stage}.name`)}</Text>
        {next !== undefined ? (
          <>
            <Text variant="callout" color="textSecondary">
              {t('ui.company.toNext', { stage: next.id })}
            </Text>
            {requirements.map((r) => (
              <View
                key={r.text}
                style={styles.req}
                accessible
                accessibilityLabel={`${r.text}, ${t(r.met ? 'ui.company.met' : 'ui.company.notMet')}`}
              >
                <Icon
                  name={r.met ? 'check' : 'next'}
                  size={16}
                  color={r.met ? 'up' : 'textTertiary'}
                />
                <Text
                  variant="callout"
                  color={r.met ? 'textPrimary' : 'textSecondary'}
                  style={styles.reqText}
                >
                  {r.text}
                </Text>
              </View>
            ))}
          </>
        ) : null}
      </Card>

      <SectionHeader title={t('ui.company.ownership')} />
      <OwnershipBar game={game} />
      <KeyValue label={t('ui.company.yourStake')} value={percent(economy.founderOwnership(game))} />
      <KeyValue
        label={t('ui.company.boardSeats')}
        value={t('ui.company.boardLine', {
          total: game.board.length,
          investors: economy.investorSeats(game),
        })}
        color={control ? 'down' : 'textPrimary'}
      />
      {control ? (
        <Text variant="footnote" color="down">
          {t('ui.company.investorControl')}
        </Text>
      ) : null}

      <SectionHeader title={t('ui.company.culture')} />
      <View style={styles.chips}>
        {game.settings.policies.length === 0 && (game.flags.hasValues ?? 0) === 0 ? (
          <Text variant="callout" color="textSecondary">
            {t('ui.people.noPolicies')}
          </Text>
        ) : (
          game.settings.policies.map((p) => (
            <Chip key={p} label={t(`policy.${p}.name`)} tone="accent" />
          ))
        )}
        {(game.flags.hasValues ?? 0) > 0 ? <Chip label={t('ui.company.hasValues')} /> : null}
      </View>

      <SectionHeader title={t('ui.company.actions')} />
      <ActionList game={game} content={content} tab="company" />

      <SectionHeader title={t('ui.company.timeline')} />
      <Timeline entries={game.timeline} />
    </TabPage>
  );
}

const styles = StyleSheet.create({
  gap: { gap: space.s },
  req: { flexDirection: 'row', alignItems: 'center', gap: space.s },
  reqText: { flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
});
