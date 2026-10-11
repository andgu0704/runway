import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { loadContent } from '../src/content/runtime';
import { newRun, visibleActions, type FeedEntry, type TimelineEntry } from '../src/engine';
import { useGame } from '../src/store/game';
import { Button } from '../src/ui/components/Button';
import { Chip } from '../src/ui/components/Chip';
import { CountingNumber } from '../src/ui/components/CountingNumber';
import { Icon, type IconName } from '../src/ui/components/Icon';
import { KeyValue } from '../src/ui/components/KeyValue';
import { Meter } from '../src/ui/components/Meter';
import { Screen } from '../src/ui/components/Screen';
import { SegmentedControl } from '../src/ui/components/SegmentedControl';
import { Slider } from '../src/ui/components/Slider';
import { Sparkline } from '../src/ui/components/Sparkline';
import { EmptyState, ErrorState, Skeleton } from '../src/ui/components/States';
import { Card, SectionHeader } from '../src/ui/components/Surface';
import { Text } from '../src/ui/components/Text';
import { Touchable } from '../src/ui/components/Touchable';
import { ActionTile } from '../src/ui/game/actions/ActionList';
import { OptionRow } from '../src/ui/game/actions/OptionRow';
import { CharacterCard } from '../src/ui/game/CharacterCard';
import { FeedEntryView } from '../src/ui/game/FeedEntry';
import { OwnershipBar } from '../src/ui/game/Ownership';
import Svg from 'react-native-svg';
import { Bust, lookFor, type Age, type Outfit, type Shirt } from '../src/ui/game/characterArt';
import { CandidateCard, EmployeeRow } from '../src/ui/game/PersonViews';
import { Timeline } from '../src/ui/game/Timeline';
import { useText } from '../src/ui/i18n';
import { useTheme } from '../src/ui/theme/ThemeProvider';
import {
  palettes,
  radii,
  space,
  type as typeScale,
  type ColorName,
  type TypeName,
} from '../src/ui/theme/tokens';

const ICONS: IconName[] = [
  'home',
  'product',
  'people',
  'money',
  'world',
  'company',
  'settings',
  'close',
  'next',
  'back',
  'forward',
  'locked',
  'warning',
  'check',
  'up',
  'down',
  'history',
  'share',
  'add',
  'info',
];
const TONES: FeedEntry['tone'][] = ['neutral', 'good', 'bad', 'warn', 'milestone', 'quote'];

/** Every component in every state, in the current theme. Reached from Settings. */
/** A spread of faces, outfits and moods, to check the character art at a glance. */
const CAST: [string, Shirt, Outfit, Age][] = [
  ['Robin Vale', 'founder', 'hoodie', 'young'],
  ['Priya Raman', 'people', 'collar', 'young'],
  ['Farid Pemberton', 'product', 'hoodie', 'young'],
  ['Odette Yilmaz', 'product', 'tee', 'young'],
  ['Hollis Fairbairn', 'company', 'blazer', 'senior'],
  ['Yusuf Fenn', 'money', 'collar', 'adult'],
  ['Mina Okafor', 'world', 'tee', 'young'],
  ['Tomas Reyes', 'people', 'tee', 'young'],
  ['Ada Lindqvist', 'product', 'hoodie', 'young'],
  ['Kofi Mensah', 'money', 'blazer', 'senior'],
  ['June Park', 'company', 'tee', 'young'],
  ['Lars Becker', 'world', 'hoodie', 'adult'],
  ['Noor Haddad', 'product', 'tee', 'young'],
  ['Eli Brandt', 'people', 'collar', 'young'],
  ['Sofia Russo', 'money', 'tee', 'adult'],
  ['Marcus Bell', 'company', 'hoodie', 'young'],
];

export default function StyleGuide() {
  const { colors, scheme } = useTheme();
  const { t } = useText();
  const current = useGame((s) => s.game);
  const content = loadContent();
  const game = useMemo(
    () =>
      current ??
      newRun(
        7,
        {
          founderName: 'Robin Vale',
          companyName: 'Fernworks',
          background: 'designer',
          market: 'saas',
          model: 'subscription',
          cofounder: 'jun',
        },
        content,
      ),
    [current, content],
  );
  const [segment, setSegment] = useState<'a' | 'b' | 'c'>('a');
  const [slider, setSlider] = useState(40);
  const [count, setCount] = useState(48_250);
  const statuses = visibleActions(game, content);
  const sampleFeed: FeedEntry[] = TONES.map((tone, i) => ({
    id: 10_000 + i,
    month: 3,
    key:
      tone === 'warn'
        ? 'meter.burnout.warn1'
        : tone === 'milestone'
          ? 'feed.stageReached'
          : tone === 'quote'
            ? 'action.coffeeWithJournalist.feed'
            : 'feed.shipped',
    params: { company: game.setup.companyName, feature: 'darkMode', stage: 'startup' },
    tone,
    variant: i,
    ...(tone === 'bad'
      ? { cause: { month: 1, key: 'event.securityChecklist.option.skipIt.cause', params: {} } }
      : {}),
  }));
  const sampleTimeline: TimelineEntry[] = [
    {
      id: 1,
      month: 1,
      kind: 'decision',
      key: 'timeline.eventChoice',
      params: { event: 'securityChecklist', option: 'skipIt' },
      tone: 'warn',
    },
    {
      id: 2,
      month: 9,
      kind: 'consequence',
      key: 'consequence.breachFromSkippedReview.timeline',
      params: {},
      tone: 'bad',
      cause: { month: 1, key: 'event.securityChecklist.option.skipIt.cause', params: {} },
    },
    {
      id: 3,
      month: 12,
      kind: 'milestone',
      key: 'timeline.stageReached',
      params: { stage: 'startup' },
      tone: 'milestone',
    },
  ];
  const employee = {
    id: 'sg1',
    name: 'Ada Pemberton',
    role: 'engineer',
    skill: 4,
    salary: 128_000,
    traits: ['meticulous', 'loyal'],
    revealed: ['meticulous'],
    equityBps: 40,
    hiredMonth: 0,
    mood: 5,
  };

  return (
    <Screen>
      <View style={styles.top}>
        <Text variant="title1" accessibilityRole="header">
          {t('ui.styleGuide.title')}
        </Text>
        <Touchable
          accessibilityLabel={t('ui.settings.close')}
          onPress={() => {
            router.back();
          }}
        >
          <Icon name="close" color="textSecondary" />
        </Touchable>
      </View>
      <Text variant="callout" color="textSecondary">
        {t('ui.styleGuide.body', { scheme })}
      </Text>

      <SectionHeader title={t('ui.styleGuide.colour')} />
      <View style={styles.swatches}>
        {(Object.keys(palettes.light) as ColorName[]).map((name) => (
          <View key={name} style={styles.swatch}>
            <View style={[styles.chip, { backgroundColor: colors[name] }]} />
            <Text variant="footnote" color="textSecondary">
              {name}
            </Text>
          </View>
        ))}
      </View>

      <SectionHeader title={t('ui.styleGuide.type')} />
      {(Object.keys(typeScale) as TypeName[]).map((name) => (
        <Text key={name} variant={name} numberOfLines={1}>
          {name.startsWith('figure') ? '$1,284,500' : `${name} · ${t('ui.title.wordmark')}`}
        </Text>
      ))}

      <SectionHeader title={t('ui.styleGuide.icons')} />
      <View style={styles.icons}>
        {ICONS.map((name) => (
          <Icon key={name} name={name} />
        ))}
      </View>

      <SectionHeader title={t('ui.styleGuide.buttons')} />
      <View style={styles.gap}>
        <Button label={t('ui.turn.next')} onPress={() => undefined} />
        <Button label={t('ui.negotiation.sign')} detail="$1.5M · 18%" onPress={() => undefined} />
        <Button kind="secondary" label={t('ui.title.newRun')} onPress={() => undefined} />
        <Button kind="tertiary" label={t('ui.new.suggest')} onPress={() => undefined} />
        <Button kind="destructive" label={t('ui.settings.abandon')} onPress={() => undefined} />
        <Button label={t('ui.turn.next')} disabled onPress={() => undefined} />
        <Button label={t('ui.turn.next')} busy onPress={() => undefined} />
      </View>

      <SectionHeader title={t('ui.styleGuide.controls')} />
      <View style={styles.gap}>
        <SegmentedControl
          label="segment"
          value={segment}
          onChange={setSegment}
          segments={[
            { value: 'a', label: t('ui.timeline.all') },
            { value: 'b', label: t('ui.timeline.decisions') },
            { value: 'c', label: t('ui.timeline.consequences') },
          ]}
        />
        <Slider
          value={slider}
          min={0}
          max={100}
          step={5}
          onChange={setSlider}
          label="slider"
          valueText={String(slider)}
        />
        <View style={styles.row}>
          <Chip label={t('trait.loyal.name')} />
          <Chip label={t('ui.picker.on')} tone="accent" />
          <Chip label={t('ui.negotiation.boardSeat')} tone="warn" />
          <Chip label="+12" tone="up" />
          <Chip label="−4" tone="down" />
        </View>
        <Meter value={0.35} label="meter" />
        <Meter value={0.8} color="up" label="meter" />
        <Meter value={0.2} color="down" label="meter" />
        <OptionRow
          title={t('feature.darkMode.name')}
          body={t('feature.darkMode.desc')}
          meta="~1 month"
          selected={false}
          onPress={() => undefined}
        />
        <OptionRow
          title={t('feature.search.name')}
          body={t('feature.search.desc')}
          meta="~2 months"
          selected
          onPress={() => undefined}
        />
      </View>

      <SectionHeader title={t('ui.styleGuide.figures')} />
      <Card style={styles.gap}>
        <CountingNumber
          variant="figureL"
          value={count}
          format={(v) => `$${Math.round(v).toLocaleString('en')}`}
        />
        <Sparkline values={[3, 5, 4, 8, 7, 11, 14, 13, 18]} width={280} height={48} />
        <KeyValue label={t('ui.money.revenue')} value="$42k" color="up" />
        <KeyValue label={t('ui.money.spend')} value="$61k" color="down" />
        <Button
          kind="secondary"
          label={t('ui.styleGuide.count')}
          onPress={() => {
            setCount(count + 12_345);
          }}
        />
      </Card>

      <SectionHeader title={t('ui.styleGuide.feed')} />
      {sampleFeed.map((e) => (
        <FeedEntryView key={e.id} entry={e} fresh={false} delay={0} />
      ))}

      <SectionHeader title={t('ui.styleGuide.actions')} />
      {statuses.slice(0, 2).map((s) => (
        <ActionTile key={s.action.id} status={s} />
      ))}
      {statuses
        .filter((s) => !s.available)
        .slice(0, 1)
        .map((s) => (
          <ActionTile key={s.action.id} status={s} />
        ))}

      <SectionHeader title={t('ui.styleGuide.characters')} />
      <View style={styles.cast}>
        {CAST.map(([seed, shirt, outfit, age], i) => (
          <Svg key={seed} width={76} height={76} viewBox="0 0 100 100">
            <Bust look={lookFor(seed, shirt, outfit, age)} mood={[1, 0.5, 0, -1][i % 4] ?? 1} />
          </Svg>
        ))}
      </View>

      <SectionHeader title={t('ui.styleGuide.people')} />
      <EmployeeRow employee={employee} morale={60} onPress={() => undefined} />
      <View style={styles.card}>
        <CandidateCard
          candidate={{ ...employee, id: 'sg2', expires: 9 }}
          canHire
          onHire={() => undefined}
        />
      </View>
      <CharacterCard game={game} id="investor" />

      <SectionHeader title={t('ui.styleGuide.company')} />
      <OwnershipBar game={game} />
      <View style={styles.space} />
      <Timeline entries={sampleTimeline} />

      <SectionHeader title={t('ui.styleGuide.states')} />
      <Card>
        <EmptyState
          title={t('ui.people.noCandidatesTitle')}
          body={t('ui.people.noCandidatesBody')}
          action={{ label: t('action.openRole.name'), onPress: () => undefined }}
        />
      </Card>
      <View style={styles.space} />
      <Card>
        <ErrorState
          title={t('ui.error.loadTitle')}
          body={t('ui.error.loadCorrupt')}
          action={{ label: t('ui.error.startFresh'), onPress: () => undefined }}
        />
      </Card>
      <Skeleton />
    </Screen>
  );
}

const styles = StyleSheet.create({
  cast: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space.l,
  },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: space.m },
  swatch: { width: 100, gap: space.xs },
  chip: {
    height: 36,
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#8888',
  },
  icons: { flexDirection: 'row', flexWrap: 'wrap', gap: space.l },
  gap: { gap: space.s },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  card: { marginVertical: space.m },
  space: { height: space.l },
});
