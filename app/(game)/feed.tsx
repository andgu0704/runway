import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { economy, type FeedEntry } from '../../src/engine';
import { useGame } from '../../src/store/game';
import { Chip } from '../../src/ui/components/Chip';
import { CountingNumber } from '../../src/ui/components/CountingNumber';
import { Icon, type IconName } from '../../src/ui/components/Icon';
import { Ring } from '../../src/ui/components/Ring';
import { Card, SectionHeader } from '../../src/ui/components/Surface';
import { BOTTOM_CLEARANCE } from '../../src/ui/components/TabPage';
import { Text } from '../../src/ui/components/Text';
import { Touchable } from '../../src/ui/components/Touchable';
import { ageFor, outfitFor } from '../../src/ui/game/characterArt';
import { CrewCard } from '../../src/ui/game/CrewCard';
import { FeedEntryView } from '../../src/ui/game/FeedEntry';
import { OfficeScene, sceneFromGame } from '../../src/ui/game/OfficeScene';
import { QuestCard } from '../../src/ui/game/QuestCard';
import { StatSheet, type StatKey } from '../../src/ui/game/StatSheet';
import { roleColor } from '../../src/ui/game/visuals';
import { useRun } from '../../src/ui/hooks/useRun';
import { useText } from '../../src/ui/i18n';
import { makeStyles, useTheme } from '../../src/ui/theme/ThemeProvider';
import { gutter, radii, space, stroke, type ColorName } from '../../src/ui/theme/tokens';

const MONTHS_SHOWN = 12;
const CREW_SHOWN = 12;
const GAUGES: { stat: 'quality' | 'morale' | 'reputation'; color: ColorName }[] = [
  { stat: 'quality', color: 'product' },
  { stat: 'morale', color: 'people' },
  { stat: 'reputation', color: 'world' },
];
const ROLE_ICONS: Record<string, IconName> = {
  engineer: 'wrench',
  designer: 'brush',
  marketer: 'megaphone',
  salesRep: 'handshake',
  support: 'chat',
};

/** Home: your office as a little scene, the next stage as a quest, your crew, and this month's news. */
export default function Home() {
  const run = useRun();
  const fresh = useGame((s) => s.fresh);
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { t, money, number, compact } = useText();
  const [open, setOpen] = useState<StatKey | null>(null);
  const freshIds = useMemo(() => new Map(fresh.map((f, i) => [f.id, i])), [fresh]);

  const scene = useMemo(() => (run === null ? null : sceneFromGame(run.game, run.content)), [run]);
  const months = useMemo(() => {
    const byMonth = new Map<number, FeedEntry[]>();
    for (const entry of run?.game.feed ?? []) {
      const list = byMonth.get(entry.month) ?? [];
      list.push(entry);
      byMonth.set(entry.month, list);
    }
    return [...byMonth.entries()].sort((a, b) => b[0] - a[0]).slice(0, MONTHS_SHOWN);
  }, [run?.game.feed]);

  if (run === null || scene === null) return null;
  const { game, content } = run;
  const runway = economy.runwayMonths(game, content);
  const mrr = economy.mrr(game, content);
  const year = Math.floor(game.month / 12) + 1;
  const month = (game.month % 12) + 1;
  const morale = (game.stats.morale - 50) / 25;
  const cofounder =
    game.cofounderPresent && game.setup.cofounder !== null
      ? content.cofounders.get(game.setup.cofounder)
      : undefined;
  const toPeople = () => {
    router.push('/people');
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: colors.canvas }}
      >
        <View style={[styles.sky, { paddingTop: insets.top + space.s }]}>
          <View style={styles.hud}>
            <Touchable
              feedback={false}
              onPress={() => {
                setOpen('cash');
              }}
              accessibilityLabel={`${t('ui.home.cash')} ${money(game.stats.cash)}`}
              accessibilityHint={t('ui.stat.hint')}
              style={styles.pill}
            >
              <View style={styles.pillInner}>
                <View style={[styles.coin, { backgroundColor: colors.accent }]}>
                  <Icon name="coin" size={16} filled color="onAccent" />
                </View>
                <CountingNumber
                  variant="figureM"
                  value={game.stats.cash}
                  format={money}
                  numberOfLines={1}
                />
              </View>
            </Touchable>
            <Touchable
              feedback={false}
              onPress={() => {
                setOpen('users');
              }}
              accessibilityLabel={`${t('ui.home.users')} ${number(game.stats.users)}`}
              accessibilityHint={t('ui.stat.hint')}
              style={styles.pill}
            >
              <View style={styles.pillInner}>
                <View style={[styles.coin, { backgroundColor: colors.world }]}>
                  <Icon name="people" size={15} filled color="surface" />
                </View>
                <CountingNumber
                  variant="figureM"
                  value={game.stats.users}
                  format={compact}
                  numberOfLines={1}
                />
              </View>
            </Touchable>
            <View
              style={[styles.pill, styles.date]}
              accessible
              accessibilityLabel={t('ui.home.dateA11y', { year, month })}
            >
              <Text variant="figureM" color="onAccent">
                {t('ui.turn.dateShort', { year, month })}
              </Text>
            </View>
            <Touchable
              accessibilityLabel={t('ui.title.settings')}
              onPress={() => {
                router.push('/settings');
              }}
              style={styles.settings}
            >
              <Icon name="settings" color="textPrimary" filled />
            </Touchable>
          </View>
          <View style={styles.title}>
            <Text variant="title1" numberOfLines={1} accessibilityRole="header" style={styles.flex}>
              {game.setup.companyName}
            </Text>
            <Chip label={t(`stage.${game.stage}.name`)} tone="product" icon="company" />
          </View>
        </View>

        <OfficeScene model={scene} width={width} />

        <View style={styles.body}>
          <View style={styles.tiles}>
            <Card style={styles.tile}>
              <Text variant="label" color="textTertiary">
                {t('ui.home.revenue')}
              </Text>
              <CountingNumber variant="figureL" value={mrr} format={money} numberOfLines={1} />
            </Card>
            <Card style={styles.tile}>
              <Text variant="label" color="textTertiary">
                {t('ui.home.runwayLabel')}
              </Text>
              <Text
                variant="figureL"
                color={runway < 4 ? 'down' : runway < 9 ? 'warn' : 'textPrimary'}
              >
                {runway >= economy.RUNWAY_INFINITE
                  ? t('ui.home.profitable')
                  : t('ui.home.runwayShort', { count: Math.floor(runway) })}
              </Text>
            </Card>
          </View>

          <QuestCard game={game} content={content} />

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
                  <Ring value={game.stats[stat]} color={color} size={50} />
                  <Text variant="footnote" color="textSecondary">
                    {t(`ui.stat.${stat}.name`)}
                  </Text>
                </Card>
              </Touchable>
            ))}
          </View>

          <SectionHeader
            title={t('ui.home.crew')}
            aside={t('ui.home.crewCount', {
              count: game.team.length + 1 + (cofounder === undefined ? 0 : 1),
            })}
          />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.crew}
        >
          <CrewCard
            name={game.setup.founderName}
            role={t('ui.home.you')}
            color="accent"
            icon="rocket"
            skill={null}
            mood={morale}
            outfit="hoodie"
            age="young"
            onPress={toPeople}
          />
          {cofounder !== undefined ? (
            <CrewCard
              name={cofounder.name}
              role={t('character.cofounder.role')}
              color="people"
              icon="handshake"
              skill={null}
              mood={morale}
              outfit="collar"
              age="young"
              onPress={toPeople}
            />
          ) : null}
          {game.team.slice(0, CREW_SHOWN).map((e) => (
            <CrewCard
              key={e.id}
              name={e.name}
              role={t(`role.${e.role}.name`)}
              color={roleColor(e.role)}
              icon={ROLE_ICONS[e.role] ?? 'crown'}
              skill={e.skill}
              mood={morale + e.mood / 25}
              outfit={outfitFor(e.role)}
              age={ageFor(e.role, e.name)}
              onPress={toPeople}
            />
          ))}
          <Touchable onPress={toPeople} accessibilityLabel={t('ui.home.hire')} style={styles.hire}>
            <Icon name="userPlus" size={26} color="textSecondary" />
            <Text variant="footnote" color="textSecondary" style={styles.center}>
              {game.team.length > CREW_SHOWN
                ? t('ui.home.more', { count: game.team.length - CREW_SHOWN })
                : t('ui.home.hire')}
            </Text>
          </Touchable>
        </ScrollView>

        <View style={styles.body}>
          {months.map(([m, entries], index) => (
            <View key={m}>
              <View style={styles.monthHead}>
                <Text
                  variant={index === 0 ? 'title2' : 'label'}
                  color={index === 0 ? 'textPrimary' : 'textTertiary'}
                  accessibilityRole="header"
                >
                  {index === 0
                    ? t('ui.feed.thisMonth')
                    : t('ui.feed.earlier', {
                        year: Math.floor(m / 12) + 1,
                        month: (m % 12) + 1,
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
        </View>
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
    content: { paddingBottom: BOTTOM_CLEARANCE },
    sky: { backgroundColor: c.sky, paddingHorizontal: gutter, paddingBottom: space.xs },
    hud: { flexDirection: 'row', alignItems: 'center', gap: space.s },
    pill: {
      height: 44,
      paddingRight: space.m,
      paddingLeft: 4,
      borderRadius: radii.full,
      backgroundColor: c.surface,
      borderWidth: stroke.line,
      borderBottomWidth: 4,
      borderColor: c.ink,
      justifyContent: 'center',
    },
    pillInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    coin: {
      width: 26,
      height: 26,
      borderRadius: 13,
      borderWidth: 2,
      borderColor: c.ink,
      alignItems: 'center',
      justifyContent: 'center',
    },
    date: { backgroundColor: c.accent, paddingLeft: space.m, marginLeft: 'auto' },
    settings: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.surface,
      borderWidth: stroke.line,
      borderBottomWidth: 4,
      borderColor: c.ink,
      alignItems: 'center',
    },
    title: { flexDirection: 'row', alignItems: 'center', gap: space.s, marginTop: space.m },
    flex: { flex: 1 },
    body: { paddingHorizontal: gutter },
    tiles: { flexDirection: 'row', gap: space.s, marginTop: -space.xl },
    tile: { flex: 1, gap: 2, paddingVertical: space.m },
    gauges: { flexDirection: 'row', gap: space.s, marginTop: space.m },
    gaugeTouch: { flex: 1 },
    gauge: { alignItems: 'center', gap: space.xs, paddingVertical: space.m },
    crew: { paddingHorizontal: gutter, gap: space.s, paddingBottom: space.s },
    hire: {
      width: 100,
      height: 134,
      borderRadius: radii.md,
      borderWidth: 2.5,
      borderStyle: 'dashed',
      borderColor: c.rule,
      alignItems: 'center',
      justifyContent: 'center',
      gap: space.xs,
      padding: space.s,
    },
    center: { textAlign: 'center' },
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
