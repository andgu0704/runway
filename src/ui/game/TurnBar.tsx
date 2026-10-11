import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import type { GameState } from '../../engine';
import { useSettings } from '../../store/settings';
import { Button } from '../components/Button';
import { ConfirmSheet } from '../components/ConfirmSheet';
import { Text } from '../components/Text';
import { useText } from '../i18n';
import { layoutMotion } from '../motion';
import { makeStyles, useTheme } from '../theme/ThemeProvider';
import { cardShadow, motion, radii, space } from '../theme/tokens';

export interface TurnBarProps {
  game: GameState;
  onEndTurn: () => void;
  onRespond: () => void;
}

/** Moves left, the date, and the one button that moves time, floating in thumb reach. */
export function TurnBar({ game, onEndTurn, onRespond }: TurnBarProps) {
  const styles = useStyles();
  const { scheme, reduceMotion } = useTheme();
  const { t } = useText();
  const confirm = useSettings((s) => s.confirmEndTurn);
  const [asking, setAsking] = useState(false);
  const left = game.ap.max - game.ap.used;
  const year = Math.floor(game.month / 12) + 1;
  const month = (game.month % 12) + 1;

  const primary = () => {
    if (game.ending !== null) router.replace('/ending');
    else if (game.negotiation !== null) router.push('/negotiation');
    else if (game.pendingEvent !== null) onRespond();
    else if (confirm && left > 0) setAsking(true);
    else onEndTurn();
  };
  const label =
    game.ending !== null
      ? t('ui.turn.seeEnding')
      : game.negotiation !== null
        ? t('ui.turn.backToTable')
        : game.pendingEvent !== null
          ? t('ui.turn.respond')
          : t('ui.turn.next');

  return (
    <View style={[styles.bar, cardShadow(scheme)]}>
      <View
        style={styles.meta}
        accessible
        accessibilityLabel={t('ui.turn.a11y', { count: left, year, month })}
      >
        <View style={styles.pips}>
          {Array.from({ length: game.ap.max }, (_, i) => (
            <Animated.View
              key={`${String(i)}-${String(i < left)}`}
              {...layoutMotion(reduceMotion, FadeIn.duration(motion.quick))}
              style={[styles.pip, i < left ? styles.pipOn : null]}
            />
          ))}
        </View>
        <Animated.View
          key={game.month}
          {...layoutMotion(reduceMotion, FadeInDown.duration(motion.base))}
        >
          <Text variant="figureS" color="textSecondary">
            {t('ui.turn.dateShort', { year, month })}
          </Text>
        </Animated.View>
      </View>
      <View style={styles.button}>
        <Button
          label={label}
          onPress={primary}
          trailingIcon={game.pendingEvent !== null ? 'warning' : 'forward'}
        />
      </View>
      <ConfirmSheet
        visible={asking}
        title={t('ui.turn.confirmTitle', { count: left })}
        body={t('ui.turn.confirmBody')}
        confirmLabel={t('ui.turn.confirmAction')}
        cancelLabel={t('ui.turn.confirmCancel')}
        onCancel={() => {
          setAsking(false);
        }}
        onConfirm={() => {
          setAsking(false);
          onEndTurn();
        }}
      />
    </View>
  );
}

const useStyles = makeStyles((c) =>
  StyleSheet.create({
    bar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.m,
      padding: space.s,
      paddingLeft: space.l,
      backgroundColor: c.surface,
      borderRadius: radii.xl,
    },
    meta: { gap: space.xs, alignItems: 'center' },
    pips: { flexDirection: 'row', gap: 4 },
    pip: {
      width: 14,
      height: 20,
      borderRadius: 5,
      borderWidth: 2,
      borderColor: c.ink,
      backgroundColor: c.sunken,
    },
    pipOn: { backgroundColor: c.accent },
    button: { flex: 1 },
  }),
);
