import { StyleSheet, View } from 'react-native';
import { optionState, type GameState } from '../../engine';
import { loadContent } from '../../content/runtime';
import { Chip } from '../components/Chip';
import { Icon } from '../components/Icon';
import { IconBadge } from '../components/IconBadge';
import { Sheet } from '../components/Sheet';
import { Text } from '../components/Text';
import { Touchable } from '../components/Touchable';
import { effectChips } from '../effectChips';
import { useText } from '../i18n';
import { describeRequirements } from '../requirements';
import { makeStyles } from '../theme/ThemeProvider';
import { radii, space } from '../theme/tokens';
import { eventVisual } from './visuals';

export interface EventSheetProps {
  game: GameState;
  visible: boolean;
  onDismiss: () => void;
  onChoose: (option: string) => void;
}

/** The month's event: what happened, why, and three or four ways to respond, each with its likely effects. */
export function EventSheet({ game, visible, onDismiss, onChoose }: EventSheetProps) {
  const styles = useStyles();
  const { t } = useText();
  const content = loadContent();
  const pending = game.pendingEvent;
  const event = pending === null ? undefined : content.events.get(pending.event);
  if (pending === null || event === undefined) {
    return (
      <Sheet visible={false} onDismiss={onDismiss} label="">
        {null}
      </Sheet>
    );
  }

  const subject = game.team.find((e) => e.id === pending.subject);
  const params = subject === undefined ? {} : { name: subject.name, role: subject.role };
  const visual = eventVisual(event.tone, event.disaster === true);
  const options = event.options
    .map((o) => ({ option: o, status: optionState(game, content, o.id) }))
    .filter((o) => o.status?.visible === true);

  return (
    <Sheet visible={visible} onDismiss={onDismiss} label={t(`event.${event.id}.title`, params)}>
      <View style={styles.head}>
        <IconBadge icon={visual.icon} color={visual.color} size={56} />
        <View style={styles.headText}>
          <Chip
            label={t(event.disaster === true ? 'ui.event.kickerDisaster' : 'ui.event.kicker')}
            tone={event.disaster === true ? 'down' : 'world'}
          />
          <Text variant="title1" accessibilityRole="header">
            {t(`event.${event.id}.title`, params)}
          </Text>
        </View>
      </View>
      <Text variant="body" color="textSecondary">
        {t(`event.${event.id}.body`, params)}
      </Text>
      {pending.cause !== null ? (
        <View style={styles.cause}>
          <Icon name="history" size={16} color="textTertiary" />
          <Text variant="footnote" color="textTertiary" style={styles.causeText}>
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
          const chips = unlocked ? effectChips(option.effects, game) : [];
          return (
            <Touchable
              key={option.id}
              disabled={!unlocked}
              onPress={() => {
                onChoose(option.id);
              }}
              accessibilityLabel={
                unlocked
                  ? [label, ...chips.map((c) => c.label)].join('. ')
                  : `${label}. ${t('ui.event.locked')}: ${needsText}`
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
                <Icon name={unlocked ? 'next' : 'locked'} size={18} color="textTertiary" />
              </View>
              {unlocked && chips.length > 0 ? (
                <View style={styles.chips}>
                  {chips.map((c) => (
                    <Chip key={c.label} label={c.label} tone={c.tone} />
                  ))}
                </View>
              ) : null}
              {!unlocked ? (
                <Chip label={t('ui.event.needs', { needs: needsText })} icon="locked" />
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
    head: { flexDirection: 'row', gap: space.m, alignItems: 'center' },
    headText: { flex: 1, gap: space.xs },
    cause: { flexDirection: 'row', gap: space.s, alignItems: 'flex-start' },
    causeText: { flex: 1 },
    options: { gap: space.s },
    option: {
      borderRadius: radii.lg,
      backgroundColor: c.sunken,
      paddingHorizontal: space.l,
      paddingVertical: space.m,
      gap: space.s,
    },
    locked: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: c.hairline,
    },
    optionRow: { flexDirection: 'row', alignItems: 'center', gap: space.m },
    optionLabel: { flex: 1 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  }),
);
