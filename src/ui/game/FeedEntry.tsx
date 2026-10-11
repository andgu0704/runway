import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import type { FeedEntry as Entry } from '../../engine';
import { Icon } from '../components/Icon';
import { Text } from '../components/Text';
import { useText } from '../i18n';
import { layoutMotion } from '../motion';
import { makeStyles, useTheme } from '../theme/ThemeProvider';
import { motion, space, type ColorName } from '../theme/tokens';

const RULE: Record<Entry['tone'], ColorName> = {
  neutral: 'hairline',
  good: 'up',
  bad: 'down',
  warn: 'warn',
  milestone: 'accent',
  quote: 'textTertiary',
};

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
  const { colors, reduceMotion } = useTheme();
  const { msg, t } = useText();
  const text = msg(entry.key, entry.params, entry.variant);
  const serif = entry.tone === 'milestone' || entry.tone === 'quote';
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
      style={styles.entry}
      accessible
      accessibilityLabel={[toneWord, text, cause].filter((s) => s !== null && s !== '').join('. ')}
    >
      <View style={[styles.rule, { backgroundColor: colors[RULE[entry.tone]] }]} />
      <View style={styles.body}>
        {entry.tone === 'warn' ? (
          <View style={styles.warnRow}>
            <Icon name="warning" size={14} color="warn" />
            <Text variant="label" color="warn">
              {t('ui.feed.warningLabel')}
            </Text>
          </View>
        ) : null}
        <Text
          variant={serif ? 'bodySerif' : 'body'}
          color={entry.tone === 'quote' ? 'textSecondary' : 'textPrimary'}
        >
          {text}
        </Text>
        {cause !== null ? (
          <Text variant="footnote" color="textSecondary">
            {cause}
          </Text>
        ) : null}
      </View>
    </Animated.View>
  );
});

const useStyles = makeStyles(() =>
  StyleSheet.create({
    entry: { flexDirection: 'row', gap: space.m, paddingVertical: space.s },
    rule: { width: 2, borderRadius: 1 },
    body: { flex: 1, gap: space.xs },
    warnRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  }),
);
