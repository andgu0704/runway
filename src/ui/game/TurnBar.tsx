import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { GameState } from '../../engine';
import { useSettings } from '../../store/settings';
import { Button } from '../components/Button';
import { ConfirmSheet } from '../components/ConfirmSheet';
import { Text } from '../components/Text';
import { useText } from '../i18n';
import { makeStyles } from '../theme/ThemeProvider';
import { gutter, space } from '../theme/tokens';

export interface TurnBarProps {
  game: GameState;
  onEndTurn: () => void;
  onRespond: () => void;
}

/** Action points, the date, and the one button that moves time. Always in thumb reach. */
export function TurnBar({ game, onEndTurn, onRespond }: TurnBarProps) {
  const styles = useStyles();
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
    <View style={styles.bar}>
      <View
        style={styles.meta}
        accessible
        accessibilityLabel={t('ui.turn.a11y', { count: left, year, month })}
      >
        <View style={styles.pips}>
          {Array.from({ length: game.ap.max }, (_, i) => (
            <View key={i} style={[styles.pip, i < left ? styles.pipOn : null]} />
          ))}
        </View>
        <Text variant="figureS" color="textSecondary">
          {t('ui.turn.date', { year, month })}
        </Text>
      </View>
      <View style={styles.button}>
        <Button label={label} onPress={primary} />
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
      gap: space.l,
      paddingHorizontal: gutter,
      paddingTop: space.m,
      paddingBottom: space.s,
      backgroundColor: c.canvas,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.hairline,
    },
    meta: { gap: space.xs },
    pips: { flexDirection: 'row', gap: space.xs },
    pip: { width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: c.accent },
    pipOn: { backgroundColor: c.accent },
    button: { flex: 1 },
  }),
);
