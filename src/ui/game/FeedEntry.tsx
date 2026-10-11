import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import type { FeedEntry as Entry } from '../../engine';
import { Chip } from '../components/Chip';
import { Icon } from '../components/Icon';
import { IconBadge } from '../components/IconBadge';
import { Text } from '../components/Text';
import { useText } from '../i18n';
import { layoutMotion } from '../motion';
import { makeStyles, useTheme } from '../theme/ThemeProvider';
import { cardShadow, motion, radii, space } from '../theme/tokens';
import { feedVisual } from './visuals';

/** The end-of-month numbers, shown as figures rather than a sentence. */
function MonthSummary({ entry }: { entry: Entry }) {
  const styles = useStyles();
  const { t, money, delta, compact } = useText();
  const p = entry.params;
  const num = (k: string) => (typeof p[k] === 'number' ? p[k] : 0);
  const launched = entry.key === 'feed.monthClosed';
  const usersDelta = num('usersDelta');
  return (
    <View
      style={styles.summary}
      accessible
      accessibilityLabel={t('ui.feed.summaryA11y', {
        users: compact(num('users')),
        mrr: money(num('mrr')),
        cash: money(num('cash')),
      })}
    >
      <Icon name="calendar" size={16} color="textTertiary" />
      <View style={styles.summaryRow}>
        {launched ? (
          <Chip
            label={`${delta(usersDelta)} ${t('ui.feed.usersShort')}`}
            tone={usersDelta >= 0 ? 'up' : 'down'}
          />
        ) : null}
        {launched ? (
          <Chip label={`${money(num('mrr'))} ${t('ui.feed.mrrShort')}`} tone="money" />
        ) : null}
        <Chip label={`${money(num('cash'))} ${t('ui.feed.cashShort')}`} />
        {!launched ? <Chip label={t('ui.feed.prelaunch')} /> : null}
      </View>
    </View>
  );
}

export const FeedEntryView = memo(function FeedEntryView({
  entry,
  fresh,
  delay,
}: {
  entry: Entry;
  fresh: boolean;
  delay: number;
}) {
  const styles = useStyles();
  const { reduceMotion, scheme } = useTheme();
  const { msg, t } = useText();
  if (entry.key.startsWith('feed.monthClosed')) return <MonthSummary entry={entry} />;
  const text = msg(entry.key, entry.params, entry.variant);
  const visual = feedVisual(entry);
  const cause =
    entry.cause === undefined
      ? null
      : t('ui.feed.because', {
          cause: t(entry.cause.key, entry.cause.params),
          month: entry.cause.month + 1,
        });
  const toneWord =
    entry.tone === 'warn' ? t('ui.feed.warning') : entry.tone === 'bad' ? t('ui.feed.bad') : '';
  return (
    <Animated.View
      {...layoutMotion(reduceMotion || !fresh, FadeInDown.duration(motion.base).delay(delay))}
      style={[styles.card, cardShadow(scheme), entry.tone === 'warn' ? styles.warnCard : null]}
      accessible
      accessibilityLabel={[toneWord, text, cause].filter((s) => s !== null && s !== '').join('. ')}
    >
      <IconBadge icon={visual.icon} color={visual.color} />
      <View style={styles.body}>
        {entry.tone === 'warn' ? (
          <Text variant="label" color="warn">
            {t('ui.feed.warningLabel')}
          </Text>
        ) : null}
        <Text variant="callout" color="textPrimary">
          {text}
        </Text>
        {cause !== null ? (
          <View style={styles.causeRow}>
            <Icon name="history" size={14} color="textTertiary" />
            <Text variant="footnote" color="textTertiary" style={styles.causeText}>
              {cause}
            </Text>
          </View>
        ) : null}
      </View>
    </Animated.View>
  );
});

const useStyles = makeStyles((c) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      gap: space.m,
      padding: space.m,
      backgroundColor: c.surface,
      borderRadius: radii.lg,
      marginBottom: space.s,
      alignItems: 'flex-start',
    },
    warnCard: { borderWidth: 1, borderColor: `${c.warn}55` },
    body: { flex: 1, gap: space.xs, paddingTop: 2 },
    causeRow: { flexDirection: 'row', gap: space.xs, alignItems: 'flex-start' },
    causeText: { flex: 1 },
    summary: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.s,
      paddingVertical: space.s,
      paddingHorizontal: space.xs,
      marginBottom: space.s,
    },
    summaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, flex: 1 },
  }),
);
