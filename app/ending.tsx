import * as Sharing from 'expo-sharing';
import { Redirect, router } from 'expo-router';
import { useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { gameStore } from '../src/store/game';
import { Button } from '../src/ui/components/Button';
import { Chip } from '../src/ui/components/Chip';
import { IconBadge } from '../src/ui/components/IconBadge';
import { Ring } from '../src/ui/components/Ring';
import { Screen } from '../src/ui/components/Screen';
import { Card, SectionHeader } from '../src/ui/components/Surface';
import { Text } from '../src/ui/components/Text';
import { feedVisual } from '../src/ui/game/visuals';
import { useRun } from '../src/ui/hooks/useRun';
import { useText } from '../src/ui/i18n';
import { makeStyles, useTheme } from '../src/ui/theme/ThemeProvider';
import { cardShadow, radii, space } from '../src/ui/theme/tokens';

function grade(legacy: number): string {
  if (legacy >= 85) return 'A';
  if (legacy >= 70) return 'B';
  if (legacy >= 55) return 'C';
  if (legacy >= 40) return 'D';
  return 'E';
}

/** The run's front page: a headline written from what happened, and the final numbers. */
export default function Ending() {
  const run = useRun();
  const styles = useStyles();
  const { scheme } = useTheme();
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
  const tone = kind === 'failure' ? 'down' : kind === 'success' ? 'up' : 'money';

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

  const figures = [
    { label: t('ui.ending.valuation'), value: money(ending.valuation) },
    { label: t('ui.ending.stake'), value: percent(ending.ownershipBps) },
    { label: t('ui.ending.netWorth'), value: money(ending.netWorth) },
    { label: t('ui.ending.peakUsers'), value: number(peakUsers) },
  ];

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
      <View ref={card} collapsable={false} style={[styles.card, cardShadow(scheme)]}>
        <View style={styles.masthead}>
          <Text variant="label" color="textTertiary">
            {t('ui.ending.masthead')}
          </Text>
          <Text variant="label" color="textTertiary">
            {t('ui.ending.dateline', { year, month })}
          </Text>
        </View>
        <Chip
          label={t(`ending.${ending.id}.title`)}
          tone={tone}
          icon={kind === 'failure' ? 'warning' : 'trophy'}
        />
        <Text variant="display" accessibilityRole="header">
          {msg(`ending.${ending.id}.headline`, {}, ending.headline)}
        </Text>
        <Text variant="body" color="textSecondary">
          {t(`ending.${ending.id}.deck`)}
        </Text>
        <Text variant="callout" color="textSecondary">
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

      <View style={styles.grid}>
        {figures.map((f) => (
          <View key={f.label} style={styles.cell}>
            <Card style={styles.figure}>
              <Text variant="label" color="textTertiary">
                {f.label}
              </Text>
              <Text variant="figureL" numberOfLines={1} adjustsFontSizeToFit>
                {f.value}
              </Text>
            </Card>
          </View>
        ))}
      </View>
      <Card style={styles.scoreCard}>
        <Ring value={ending.legacy} color="company" size={56} />
        <View style={styles.scoreText}>
          <Text variant="label" color="textTertiary">
            {t('ui.ending.legacy')}
          </Text>
          <Text variant="title2">{t('ui.ending.grade', { grade: grade(ending.legacy) })}</Text>
        </View>
        <View style={styles.score}>
          <Text variant="label" color="textTertiary">
            {t('ui.ending.score')}
          </Text>
          <Text variant="figureL">{number(ending.score)}</Text>
        </View>
      </Card>

      {moments.length > 0 ? (
        <>
          <SectionHeader title={t('ui.ending.moments')} />
          {moments.map((m) => {
            const visual = feedVisual({
              id: m.id,
              month: m.month,
              key: m.key,
              params: m.params,
              tone: m.tone,
              variant: 0,
            });
            return (
              <View key={m.id} style={styles.moment}>
                <IconBadge icon={visual.icon} color={visual.color} size={34} />
                <View style={styles.momentText}>
                  <Text variant="callout">{t(m.key, m.params)}</Text>
                  <Text variant="footnote" color="textTertiary">
                    {t('ui.timeline.month', { month: m.month + 1 })}
                  </Text>
                </View>
              </View>
            );
          })}
        </>
      ) : null}
    </Screen>
  );
}

const useStyles = makeStyles((c) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: radii.xl,
      padding: space.xl,
      gap: space.m,
      marginTop: space.l,
    },
    masthead: { flexDirection: 'row', justifyContent: 'space-between' },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -space.xs,
      marginTop: space.m,
    },
    cell: { width: '50%', padding: space.xs },
    figure: { gap: space.xs },
    scoreCard: { flexDirection: 'row', alignItems: 'center', gap: space.m, marginTop: space.s },
    scoreText: { flex: 1, gap: 2 },
    score: { alignItems: 'flex-end', gap: 2 },
    moment: { flexDirection: 'row', gap: space.m, alignItems: 'center', paddingVertical: space.xs },
    momentText: { flex: 1, gap: 2 },
  }),
);
