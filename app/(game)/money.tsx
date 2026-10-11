import { StyleSheet, View } from 'react-native';
import { economy } from '../../src/engine';
import { Chip } from '../../src/ui/components/Chip';
import { IconBadge } from '../../src/ui/components/IconBadge';
import { Sparkline } from '../../src/ui/components/Sparkline';
import { Card, SectionHeader } from '../../src/ui/components/Surface';
import { TabPage } from '../../src/ui/components/TabPage';
import { Text } from '../../src/ui/components/Text';
import { ActionList } from '../../src/ui/game/actions/ActionList';
import { OwnershipBar } from '../../src/ui/game/Ownership';
import { useRun } from '../../src/ui/hooks/useRun';
import { useText } from '../../src/ui/i18n';
import { makeStyles } from '../../src/ui/theme/ThemeProvider';
import { radii, space } from '../../src/ui/theme/tokens';

export default function Money() {
  const run = useRun();
  const styles = useStyles();
  const { t, money, percent } = useText();
  if (run === null) return null;
  const { game, content } = run;
  const revenue = economy.mrr(game, content);
  const spend = economy.burn(game, content);
  const runway = economy.runwayMonths(game, content);
  const value = economy.valuation(game, content);
  const cashHistory = [...game.history.slice(-24).map((h) => h.cash), game.stats.cash];
  const top = Math.max(revenue, spend, 1);

  return (
    <TabPage title={t('ui.tab.money')}>
      <Card style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.flex}>
            <Text variant="label" color="textTertiary">
              {t('ui.money.cash')}
            </Text>
            <Text variant="figureXL" numberOfLines={1} adjustsFontSizeToFit>
              {money(game.stats.cash)}
            </Text>
            <Chip
              icon="clock"
              label={
                runway >= economy.RUNWAY_INFINITE
                  ? t('ui.money.profitableShort')
                  : t('ui.money.runway', { count: Math.floor(runway) })
              }
              tone={runway < 4 ? 'down' : runway < 9 ? 'warn' : 'up'}
            />
          </View>
          {cashHistory.length > 2 ? (
            <Sparkline values={cashHistory} width={120} height={56} />
          ) : null}
        </View>
      </Card>

      <SectionHeader
        title={t('ui.money.monthly')}
        aside={t('ui.money.net', { value: money(revenue - spend) })}
      />
      <View style={styles.pair}>
        {[
          {
            label: t('ui.money.revenue'),
            amount: revenue,
            color: 'up' as const,
            icon: 'up' as const,
          },
          {
            label: t('ui.money.spend'),
            amount: spend,
            color: 'down' as const,
            icon: 'down' as const,
          },
        ].map((item) => (
          <Card key={item.label} style={[styles.flex, styles.gap]}>
            <View style={styles.row}>
              <IconBadge icon={item.icon} color={item.color} size={32} />
              <Text variant="label" color="textTertiary">
                {item.label}
              </Text>
            </View>
            <Text variant="figureL" numberOfLines={1} adjustsFontSizeToFit>
              {money(item.amount)}
            </Text>
            <View style={styles.track}>
              <View
                style={[
                  styles.bar,
                  styles[item.color],
                  { width: `${Math.max(4, (item.amount / top) * 100)}%` },
                ]}
              />
            </View>
          </Card>
        ))}
      </View>
      {game.settings.marketingBudget > 0 ? (
        <Text variant="footnote" color="textTertiary" style={styles.note}>
          {t('ui.money.marketingNote', { value: money(game.settings.marketingBudget) })}
        </Text>
      ) : null}

      <SectionHeader
        title={t('ui.money.ownership')}
        aside={t('ui.money.valuation', { value: money(value) })}
      />
      <Card>
        <OwnershipBar game={game} />
      </Card>

      <SectionHeader title={t('ui.money.rounds')} aside={String(game.rounds.length)} />
      {game.rounds.length === 0 ? (
        <Card style={styles.row}>
          <IconBadge icon="handshake" color="money" />
          <Text variant="callout" color="textSecondary" style={styles.flex}>
            {t('ui.money.noRounds')}
          </Text>
        </Card>
      ) : (
        game.rounds.map((r) => (
          <Card key={`${r.month}-${r.investor}`} style={[styles.row, styles.round]}>
            <IconBadge icon="handshake" color="money" />
            <View style={styles.flex}>
              <Text variant="headline">{t(`investor.${r.investor}.name`)}</Text>
              <Text variant="footnote" color="textSecondary">
                {t('ui.money.roundMeta', { pre: money(r.preMoney), month: r.month + 1 })}
              </Text>
            </View>
            <View style={styles.right}>
              <Text variant="figureM">{money(r.amount)}</Text>
              <Text variant="footnote" color="textTertiary">
                {percent(r.bps)}
              </Text>
            </View>
          </Card>
        ))
      )}

      <SectionHeader title={t('ui.money.actions')} />
      <ActionList game={game} content={content} tab="money" />
    </TabPage>
  );
}

const useStyles = makeStyles((c) =>
  StyleSheet.create({
    hero: { marginTop: space.l },
    heroTop: { flexDirection: 'row', alignItems: 'flex-start', gap: space.m },
    flex: { flex: 1, gap: space.xs },
    gap: { gap: space.s },
    pair: { flexDirection: 'row', gap: space.s },
    row: { flexDirection: 'row', alignItems: 'center', gap: space.m },
    right: { alignItems: 'flex-end', gap: 2 },
    round: { marginBottom: space.s },
    track: { height: 8, borderRadius: radii.full, backgroundColor: c.sunken, overflow: 'hidden' },
    bar: { height: 8, borderRadius: radii.full },
    up: { backgroundColor: c.up },
    down: { backgroundColor: c.down },
    note: { marginTop: space.s },
  }),
);
