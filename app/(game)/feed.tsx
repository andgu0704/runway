import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { economy, type FeedEntry } from '../../src/engine';
import { useGame } from '../../src/store/game';
import { Chip } from '../../src/ui/components/Chip';
import { CountingNumber } from '../../src/ui/components/CountingNumber';
import { Icon } from '../../src/ui/components/Icon';
import { Ring } from '../../src/ui/components/Ring';
import { Sparkline } from '../../src/ui/components/Sparkline';
import { Card } from '../../src/ui/components/Surface';
import { BOTTOM_CLEARANCE } from '../../src/ui/components/TabPage';
import { Text } from '../../src/ui/components/Text';
import { Touchable } from '../../src/ui/components/Touchable';
import { FeedEntryView } from '../../src/ui/game/FeedEntry';
import { StatSheet, type StatKey } from '../../src/ui/game/StatSheet';
import { useRun } from '../../src/ui/hooks/useRun';
import { useText } from '../../src/ui/i18n';
import { makeStyles } from '../../src/ui/theme/ThemeProvider';
import { gutter, radii, space, type ColorName } from '../../src/ui/theme/tokens';

const MONTHS_SHOWN = 12;
const GAUGES: { stat: 'quality' | 'morale' | 'reputation'; color: ColorName }[] = [
  { stat: 'quality', color: 'product' },
  { stat: 'morale', color: 'people' },
  { stat: 'reputation', color: 'world' },
];

/** Home: the company at a glance, then this month's news as cards, newest month first. */
export default function Home() {
  const run = useRun();
  const fresh = useGame((s) => s.fresh);
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { t, money, number, delta } = useText();
  const [open, setOpen] = useState<StatKey | null>(null);
  const freshIds = useMemo(() => new Map(fresh.map((f, i) => [f.id, i])), [fresh]);

  const months = useMemo(() => {
    const byMonth = new Map<number, FeedEntry[]>();
    for (const entry of run?.game.feed ?? []) {
      const list = byMonth.get(entry.month) ?? [];
      list.push(entry);
      byMonth.set(entry.month, list);
    }
    return [...byMonth.entries()].sort((a, b) => b[0] - a[0]).slice(0, MONTHS_SHOWN);
  }, [run?.game.feed]);

  if (run === null) return null;
  const { game, content } = run;
  const runway = economy.runwayMonths(game, content);
  const mrr = economy.mrr(game, content);
  const cashHistory = [...game.history.slice(-18).map((h) => h.cash), game.stats.cash];
  const previous = game.history[game.history.length - 2];
  const usersDelta = previous === undefined ? 0 : game.stats.users - previous.users;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text variant="display" numberOfLines={1} accessibilityRole="header">
              {game.setup.companyName}
            </Text>
            <View style={styles.headerMeta}>
              <Chip label={t(`stage.${game.stage}.name`)} tone="product" />
              <Text variant="footnote" color="textSecondary">
                {t(`market.${game.setup.market}.name`)}
              </Text>
            </View>
          </View>
          <Touchable
            accessibilityLabel={t('ui.title.settings')}
            onPress={() => {
              router.push('/settings');
            }}
            style={styles.settings}
          >
            <Icon name="settings" color="textSecondary" />
          </Touchable>
        </View>

        <Touchable
          onPress={() => {
            setOpen('cash');
          }}
          accessibilityLabel={`${t('ui.home.cash')} ${money(game.stats.cash)}`}
          accessibilityHint={t('ui.stat.hint')}
          feedback={false}
        >
          <Card style={styles.hero}>
            <View style={styles.heroTop}>
              <View style={styles.heroLeft}>
                <Text variant="label" color="textTertiary">
                  {t('ui.home.cash')}
                </Text>
                <CountingNumber
                  variant="figureXL"
                  value={game.stats.cash}
                  format={money}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                />
                <Chip
                  label={
                    runway >= economy.RUNWAY_INFINITE
                      ? t('ui.home.profitable')
                      : t('ui.home.runway', { count: Math.floor(runway) })
                  }
                  tone={runway < 4 ? 'down' : runway < 9 ? 'warn' : 'up'}
                  icon="clock"
                />
              </View>
              {cashHistory.length > 2 ? (
                <Sparkline values={cashHistory} width={128} height={56} color="money" />
              ) : null}
            </View>
            <View style={styles.miniRow}>
              <Touchable
                feedback={false}
                onPress={() => {
                  setOpen('users');
                }}
                style={styles.mini}
                accessibilityLabel={`${t('ui.home.users')} ${number(game.stats.users)}`}
              >
                <Text variant="label" color="textTertiary">
                  {t('ui.home.users')}
                </Text>
                <View style={styles.miniValue}>
                  <CountingNumber
                    variant="figureL"
                    value={game.stats.users}
                    format={number}
                    numberOfLines={1}
                  />
                  {usersDelta !== 0 ? (
                    <Text variant="figureS" color={usersDelta > 0 ? 'up' : 'down'}>
                      {delta(usersDelta)}
                    </Text>
                  ) : null}
                </View>
              </Touchable>
              <View
                style={styles.mini}
                accessible
                accessibilityLabel={`${t('ui.home.revenue')} ${money(mrr)}`}
              >
                <Text variant="label" color="textTertiary">
                  {t('ui.home.revenue')}
                </Text>
                <CountingNumber variant="figureL" value={mrr} format={money} numberOfLines={1} />
              </View>
            </View>
          </Card>
        </Touchable>

        <View style={styles.gauges}>
          {GAUGES.map(({ stat, color }) => (
            <Touchable
              key={stat}
              onPress={() => {
                setOpen(stat);
              }}
              style={styles.gaugeTouch}
              accessibilityLabel={`${t(`ui.stat.${stat}.name`)} ${Math.round(game.stats[stat])} / 100`}
              accessibilityHint={t('ui.stat.hint')}
            >
              <Card style={styles.gauge}>
                <Ring value={game.stats[stat]} color={color} />
                <Text variant="footnote" color="textSecondary">
                  {t(`ui.stat.${stat}.name`)}
                </Text>
              </Card>
            </Touchable>
          ))}
        </View>

        {months.map(([month, entries], index) => (
          <View key={month}>
            <View style={styles.monthHead}>
              <Text
                variant={index === 0 ? 'title2' : 'label'}
                color={index === 0 ? 'textPrimary' : 'textTertiary'}
                accessibilityRole="header"
              >
                {index === 0
                  ? t('ui.feed.thisMonth')
                  : t('ui.feed.earlier', {
                      year: Math.floor(month / 12) + 1,
                      month: (month % 12) + 1,
                    })}
              </Text>
              {index === 0 ? (
                <Touchable
                  feedback={false}
                  onPress={() => {
                    router.push('/company');
                  }}
                  style={styles.timelineLink}
                >
                  <Text variant="footnote" color="textTertiary">
                    {t('ui.feed.timeline')}
                  </Text>
                </Touchable>
              ) : null}
            </View>
            {entries.map((entry) => (
              <FeedEntryView
                key={entry.id}
                entry={entry}
                fresh={freshIds.has(entry.id)}
                delay={(freshIds.get(entry.id) ?? 0) * 70}
              />
            ))}
          </View>
        ))}
      </ScrollView>
      <StatSheet
        stat={open}
        game={game}
        onDismiss={() => {
          setOpen(null);
        }}
      />
    </View>
  );
}

const useStyles = makeStyles((c) =>
  StyleSheet.create({
    root: { flex: 1 },
    content: { paddingHorizontal: gutter, paddingTop: space.m, paddingBottom: BOTTOM_CLEARANCE },
    header: { flexDirection: 'row', alignItems: 'flex-start', gap: space.m },
    headerText: { flex: 1, gap: space.xs },
    headerMeta: { flexDirection: 'row', alignItems: 'center', gap: space.s },
    settings: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.surface,
      alignItems: 'center',
    },
    hero: { marginTop: space.l, gap: space.l },
    heroTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: space.m,
    },
    heroLeft: { flex: 1, gap: space.xs },
    miniRow: { flexDirection: 'row', gap: space.s },
    mini: { flex: 1, backgroundColor: c.sunken, borderRadius: radii.md, padding: space.m, gap: 2 },
    miniValue: { flexDirection: 'row', alignItems: 'baseline', gap: space.xs },
    gauges: { flexDirection: 'row', gap: space.s, marginTop: space.s },
    gaugeTouch: { flex: 1 },
    gauge: { alignItems: 'center', gap: space.xs, paddingVertical: space.m },
    monthHead: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: space.xl,
      marginBottom: space.s,
    },
    timelineLink: { minWidth: 0, alignItems: 'flex-end' },
  }),
);
