import { StyleSheet, View } from 'react-native';
import { economy } from '../../src/engine';
import { KeyValue } from '../../src/ui/components/KeyValue';
import { Sparkline } from '../../src/ui/components/Sparkline';
import { Card, SectionHeader } from '../../src/ui/components/Surface';
import { TabPage } from '../../src/ui/components/TabPage';
import { Text } from '../../src/ui/components/Text';
import { ActionList } from '../../src/ui/game/actions/ActionList';
import { OwnershipBar } from '../../src/ui/game/Ownership';
import { useRun } from '../../src/ui/hooks/useRun';
import { useText } from '../../src/ui/i18n';
import { space } from '../../src/ui/theme/tokens';

export default function Money() {
  const run = useRun();
  const { t, money, percent } = useText();
  if (run === null) return null;
  const { game, content } = run;
  const revenue = economy.mrr(game, content);
  const spend = economy.burn(game, content);
  const runway = economy.runwayMonths(game, content);
  const value = economy.valuation(game, content);
  const cashHistory = [...game.history.slice(-24).map((h) => h.cash), game.stats.cash];

  return (
    <TabPage title={t('ui.tab.money')}>
      <Card style={styles.hero}>
        <Text variant="label" color="textTertiary">
          {t('ui.money.cash')}
        </Text>
        <Text variant="figureL">{money(game.stats.cash)}</Text>
        <Text variant="callout" color={runway < 4 ? 'down' : runway < 9 ? 'warn' : 'textSecondary'}>
          {runway >= economy.RUNWAY_INFINITE
            ? t('ui.money.profitable')
            : t('ui.money.runway', { count: Math.floor(runway) })}
        </Text>
        {cashHistory.length > 2 ? <Sparkline values={cashHistory} width={300} height={48} /> : null}
      </Card>

      <SectionHeader title={t('ui.money.monthly')} />
      <KeyValue label={t('ui.money.revenue')} value={money(revenue)} color="up" />
      <KeyValue label={t('ui.money.spend')} value={money(spend)} color="down" />
      <KeyValue label={t('ui.money.marketing')} value={money(game.settings.marketingBudget)} />
      <KeyValue
        label={t('ui.money.net')}
        value={money(revenue - spend)}
        color={revenue >= spend ? 'up' : 'textPrimary'}
      />

      <SectionHeader
        title={t('ui.money.ownership')}
        aside={t('ui.money.valuation', { value: money(value) })}
      />
      <OwnershipBar game={game} />

      <SectionHeader title={t('ui.money.rounds')} aside={String(game.rounds.length)} />
      {game.rounds.length === 0 ? (
        <Text variant="callout" color="textSecondary">
          {t('ui.money.noRounds')}
        </Text>
      ) : (
        game.rounds.map((r) => (
          <View key={`${r.month}-${r.investor}`} style={styles.round}>
            <Text variant="headline">{t(`investor.${r.investor}.name`)}</Text>
            <Text variant="figureS" color="textSecondary">
              {t('ui.money.roundLine', {
                amount: money(r.amount),
                equity: percent(r.bps),
                pre: money(r.preMoney),
                month: r.month + 1,
              })}
            </Text>
          </View>
        ))
      )}

      <SectionHeader title={t('ui.money.actions')} />
      <ActionList game={game} content={content} tab="money" />
    </TabPage>
  );
}

const styles = StyleSheet.create({
  hero: { gap: space.xs },
  round: { paddingVertical: space.s, gap: 2 },
});
