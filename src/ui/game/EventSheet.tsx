import { StyleSheet, View } from 'react-native';
import { optionState, type GameState } from '../../engine';
import { loadContent } from '../../content/runtime';
import { Icon } from '../components/Icon';
import { Sheet } from '../components/Sheet';
import { Text } from '../components/Text';
import { Touchable } from '../components/Touchable';
import { useText } from '../i18n';
import { describeRequirements } from '../requirements';
import { makeStyles } from '../theme/ThemeProvider';
import { radii, space } from '../theme/tokens';

export interface EventSheetProps {
  game: GameState;
  visible: boolean;
  onDismiss: () => void;
  onChoose: (option: string) => void;
}

/** The month's event: what happened, why, and three or four ways to respond. */
export function EventSheet({ game, visible, onDismiss, onChoose }: EventSheetProps) {
  const styles = useStyles();
  const { t } = useText();
  const content = loadContent();
  const pending = game.pendingEvent;
  const event = pending === null ? undefined : content.events.get(pending.event);
  if (pending === null || event === undefined)
    return (
      <Sheet visible={false} onDismiss={onDismiss} label="">
        {null}
      </Sheet>
    );

  const subject = game.team.find((e) => e.id === pending.subject);
  const params = subject === undefined ? {} : { name: subject.name, role: subject.role };
  const options = event.options
    .map((o) => ({ option: o, status: optionState(game, content, o.id) }))
    .filter((o) => o.status?.visible === true);

  return (
    <Sheet visible={visible} onDismiss={onDismiss} label={t(`event.${event.id}.title`, params)}>
      <View style={styles.head}>
        <Text variant="label" color={event.disaster === true ? 'down' : 'accent'}>
          {t(event.disaster === true ? 'ui.event.kickerDisaster' : 'ui.event.kicker')}
        </Text>
        <Text variant="title1" accessibilityRole="header">
          {t(`event.${event.id}.title`, params)}
        </Text>
      </View>
      <Text variant="bodySerif">{t(`event.${event.id}.body`, params)}</Text>
      {pending.cause !== null ? (
        <View style={styles.cause}>
          <Icon name="history" size={16} color="textSecondary" />
          <Text variant="footnote" color="textSecondary" style={styles.causeText}>
            {t('ui.event.because', {
              cause: t(pending.cause.key, pending.cause.params),
              month: pending.cause.month + 1,
            })}
          </Text>
        </View>
      ) : null}
      <View style={styles.options}>
        {options.map(({ option, status }) => {
          const unlocked = status?.unlocked === true;
          const needs = unlocked
            ? []
            : describeRequirements(option.requires, game, content).filter((r) => !r.met);
          const label = t(`event.${event.id}.option.${option.id}.label`, params);
          const needsText = needs.map((r) => r.text).join(' · ');
          return (
            <Touchable
              key={option.id}
              disabled={!unlocked}
              onPress={() => {
                onChoose(option.id);
              }}
              accessibilityLabel={
                unlocked ? label : `${label}. ${t('ui.event.locked')}: ${needsText}`
              }
              accessibilityState={{ disabled: !unlocked }}
              style={[styles.option, unlocked ? null : styles.locked]}
            >
              <View style={styles.optionRow}>
                <Text
                  variant="headline"
                  color={unlocked ? 'textPrimary' : 'textTertiary'}
                  style={styles.optionLabel}
                >
                  {label}
                </Text>
                <Icon
                  name={unlocked ? 'next' : 'locked'}
                  size={18}
                  color={unlocked ? 'accent' : 'textTertiary'}
                />
              </View>
              {!unlocked ? (
                <Text variant="footnote" color="textTertiary">
                  {t('ui.event.needs', { needs: needsText })}
                </Text>
              ) : null}
            </Touchable>
          );
        })}
      </View>
    </Sheet>
  );
}

const useStyles = makeStyles((c) =>
  StyleSheet.create({
    head: { gap: space.xs },
    cause: { flexDirection: 'row', gap: space.s, alignItems: 'flex-start' },
    causeText: { flex: 1 },
    options: { gap: space.s },
    option: {
      borderRadius: radii.sm,
      borderWidth: 1,
      borderColor: c.hairline,
      backgroundColor: c.surface,
      paddingHorizontal: space.l,
      paddingVertical: space.m,
      gap: space.xs,
    },
    locked: { backgroundColor: 'transparent', borderStyle: 'dashed' },
    optionRow: { flexDirection: 'row', alignItems: 'center', gap: space.m },
    optionLabel: { flex: 1 },
  }),
);
