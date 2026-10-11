import * as Sharing from 'expo-sharing';
import { Redirect, router } from 'expo-router';
import { useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { useText } from '../src/ui/i18n';
import { gameStore } from '../src/store/game';
import { Button } from '../src/ui/components/Button';
import { KeyValue } from '../src/ui/components/KeyValue';
import { Screen } from '../src/ui/components/Screen';
import { SectionHeader } from '../src/ui/components/Surface';
import { Text } from '../src/ui/components/Text';
import { useRun } from '../src/ui/hooks/useRun';
import { makeStyles } from '../src/ui/theme/ThemeProvider';
import { fonts, space } from '../src/ui/theme/tokens';

function grade(legacy: number): string {
  if (legacy >= 85) return 'A';
  if (legacy >= 70) return 'B';
  if (legacy >= 55) return 'C';
  if (legacy >= 40) return 'D';
  return 'E';
}

/** The run's front page: a headline written from what actually happened. */
export default function Ending() {
  const run = useRun();
  const styles = useStyles();
  const { t, msg, money, percent, number } = useText();
  const card = useRef<View>(null);
  const [sharing, setSharing] = useState(false);
  if (run === null) return <Redirect href="/" />;
  const { game, content } = run;
  const ending = game.ending;
  if (ending === null) return <Redirect href="/feed" />;
  const kind = content.endings.get(ending.id)?.kind ?? 'failure';
  const raised = game.rounds.reduce((acc, r) => acc + r.amount, 0);
  const peakUsers = Math.max(game.stats.users, ...game.history.map((h) => h.users));
  const year = Math.floor(ending.month / 12) + 1;
  const month = (ending.month % 12) + 1;
  const moments = game.timeline
    .filter((e) => e.kind !== 'decision')
    .slice(-5)
    .reverse();

  const share = async () => {
    setSharing(true);
    try {
      const uri = await captureRef(card, { format: 'png', quality: 1 });
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: t('ui.ending.shareTitle'),
      });
    } catch {
      return;
    } finally {
      setSharing(false);
    }
  };

  return (
    <Screen
      footer={
        <>
          {Platform.OS !== 'web' ? (
            <Button
              label={t('ui.ending.share')}
              icon="share"
              busy={sharing}
              onPress={() => {
                share().catch(() => undefined);
              }}
            />
          ) : null}
          <Button
            kind={Platform.OS === 'web' ? 'primary' : 'secondary'}
            label={t('ui.ending.newRun')}
            onPress={() => {
              gameStore.getState().discardRun();
              router.replace('/new');
            }}
          />
        </>
      }
    >
      <View ref={card} collapsable={false} style={styles.paper}>
        <View style={styles.mastheadRule} />
        <Text variant="title2" align="center" style={styles.masthead}>
          {t('ui.ending.masthead')}
        </Text>
        <View style={styles.dateline}>
          <Text variant="label" color="textTertiary">
            {t('ui.ending.dateline', { year, month })}
          </Text>
          <Text variant="label" color="textTertiary">
            {t('ui.ending.price')}
          </Text>
        </View>
        <View style={styles.rule} />
        <Text variant="label" color={kind === 'failure' ? 'down' : 'accent'} style={styles.kicker}>
          {t(`ending.${ending.id}.title`)}
        </Text>
        <Text variant="display" accessibilityRole="header">
          {msg(`ending.${ending.id}.headline`, {}, ending.headline)}
        </Text>
        <Text variant="bodySerif" color="textSecondary" style={styles.deck}>
          {t(`ending.${ending.id}.deck`)}
        </Text>
        <Text variant="footnote" color="textTertiary">
          {t('ui.ending.byline')}
        </Text>
        <Text variant="bodySerif" style={styles.article}>
          {t('ui.ending.article', {
            founder: game.setup.founderName,
            who: t(`background.${game.setup.background}.article`),
            market: game.setup.market,
            months: ending.month + 1,
            users: number(peakUsers),
            raised: money(raised),
            team: game.team.length + 1 + (game.cofounderPresent ? 1 : 0),
          })}
        </Text>
      </View>

      <SectionHeader title={t('ui.ending.scoreTitle')} />
      <KeyValue label={t('ui.ending.valuation')} value={money(ending.valuation)} />
      <KeyValue label={t('ui.ending.stake')} value={percent(ending.ownershipBps)} />
      <KeyValue label={t('ui.ending.netWorth')} value={money(ending.netWorth)} />
      <KeyValue
        label={t('ui.ending.legacy')}
        value={`${grade(ending.legacy)} · ${ending.legacy}/100`}
      />
      <KeyValue label={t('ui.ending.score')} value={number(ending.score)} color="accent" />

      {moments.length > 0 ? (
        <>
          <SectionHeader title={t('ui.ending.moments')} />
          {moments.map((m) => (
            <View key={m.id} style={styles.moment}>
              <Text variant="figureS" color="textTertiary">
                {t('ui.timeline.monthShort', { month: m.month + 1 })}
              </Text>
              <Text variant="callout" style={styles.momentText}>
                {t(m.key, m.params)}
              </Text>
            </View>
          ))}
        </>
      ) : null}
    </Screen>
  );
}

const useStyles = makeStyles((c) =>
  StyleSheet.create({
    paper: { backgroundColor: c.canvas, paddingTop: space.l, paddingBottom: space.m, gap: space.s },
    mastheadRule: { height: 3, backgroundColor: c.rule },
    masthead: { fontSize: 26, lineHeight: 32, letterSpacing: 0.5 },
    dateline: { flexDirection: 'row', justifyContent: 'space-between' },
    rule: { height: StyleSheet.hairlineWidth, backgroundColor: c.rule, marginBottom: space.s },
    kicker: { marginTop: space.s },
    deck: { fontFamily: fonts.serifItalic },
    article: { marginTop: space.s },
    moment: { flexDirection: 'row', gap: space.m, paddingVertical: space.xs },
    momentText: { flex: 1 },
  }),
);
