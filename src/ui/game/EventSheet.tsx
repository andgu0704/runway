import { StyleSheet, View } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';
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
import { makeStyles, useTheme } from '../theme/ThemeProvider';
import { radii, space, stroke, type ColorName } from '../theme/tokens';
import { Bust, lookFor, type Shirt } from './characterArt';
import { eventVisual, roleColor } from './visuals';

export interface EventSheetProps {
  game: GameState;
  visible: boolean;
  onDismiss: () => void;
  onChoose: (option: string) => void;
}

/** Choices cycle through these so each one reads as its own big game button. */
const OPTION_COLORS: ColorName[] = ['world', 'company', 'product', 'money'];

/** Sun rays behind the portrait, centred in a 340×150 panel. */
function Rays({ color }: { color: string }) {
  const rays = Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * Math.PI * 2;
    const b = a + Math.PI / 14;
    const r = 260;
    return `M170,150 L${String(170 + Math.cos(a) * r)},${String(150 + Math.sin(a) * r)} L${String(170 + Math.cos(b) * r)},${String(150 + Math.sin(b) * r)}Z`;
  });
  return <Path d={rays.join(' ')} fill={color} opacity={0.22} />;
}

/** The month's event as a card: who it is about, what happened, and big buttons to respond. */
export function EventSheet({ game, visible, onDismiss, onChoose }: EventSheetProps) {
  const styles = useStyles();
  const { colors, scheme } = useTheme();
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
  const disaster = event.disaster === true;
  const visual = eventVisual(event.tone, disaster);
  const mood =
    event.tone === 'good' || event.tone === 'milestone' ? 1 : event.tone === 'neutral' ? 0 : -1;
  const look =
    subject === undefined
      ? lookFor(game.setup.founderName, 'founder')
      : lookFor(subject.name, roleColor(subject.role) as Shirt);
  const options = event.options
    .map((o) => ({ option: o, status: optionState(game, content, o.id) }))
    .filter((o) => o.status?.visible === true);
  const onColor: ColorName = scheme === 'dark' ? 'ink' : 'surface';

  return (
    <Sheet visible={visible} onDismiss={onDismiss} label={t(`event.${event.id}.title`, params)}>
      <View
        style={[
          styles.art,
          { backgroundColor: `${colors[visual.color]}${scheme === 'dark' ? '55' : '33'}` },
        ]}
      >
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 340 150"
          preserveAspectRatio="xMidYMid slice"
          style={StyleSheet.absoluteFill}
        >
          <Rays color={colors[visual.color]} />
          <G transform="translate(110,30) scale(1.2)">
            <Bust look={look} mood={mood} />
          </G>
        </Svg>
        <View style={styles.tag}>
          <Chip
            label={t(disaster ? 'ui.event.kickerDisaster' : 'ui.event.kicker')}
            tone={disaster ? 'down' : visual.color === 'up' ? 'up' : 'world'}
            icon="lightning"
            solid
          />
        </View>
        <View style={styles.badge}>
          <IconBadge icon={visual.icon} color={visual.color} size={48} />
        </View>
      </View>
      <View style={styles.text}>
        <Text variant="title1" accessibilityRole="header">
          {t(`event.${event.id}.title`, params)}
        </Text>
        <Text variant="body" color="textSecondary">
          {t(`event.${event.id}.body`, params)}
        </Text>
      </View>
      {pending.cause !== null ? (
        <View style={styles.cause}>
          <Icon name="history" size={16} color="textTertiary" />
          <Text variant="footnote" color="textTertiary" style={styles.flex}>
            {t('ui.event.because', {
              cause: t(pending.cause.key, pending.cause.params),
              month: pending.cause.month + 1,
            })}
          </Text>
        </View>
      ) : null}
      <View style={styles.options}>
        {options.map(({ option, status }, i) => {
          const unlocked = status?.unlocked === true;
          const needs = unlocked
            ? []
            : describeRequirements(option.requires, game, content).filter((r) => !r.met);
          const label = t(`event.${event.id}.option.${option.id}.label`, params);
          const needsText = needs.map((r) => r.text).join(' · ');
          const chips = unlocked ? effectChips(option.effects, game) : [];
          const color = OPTION_COLORS[i % OPTION_COLORS.length] ?? 'world';
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
              style={(pressed) => [
                styles.option,
                unlocked ? { backgroundColor: colors[color] } : styles.locked,
                pressed && unlocked ? styles.pressed : null,
              ]}
            >
              <View style={styles.optionRow}>
                <Text
                  variant="headline"
                  color={unlocked ? onColor : 'textTertiary'}
                  style={styles.flex}
                >
                  {label}
                </Text>
                <Icon
                  name={unlocked ? 'next' : 'locked'}
                  size={18}
                  color={unlocked ? onColor : 'textTertiary'}
                />
              </View>
              {unlocked && chips.length > 0 ? (
                <View style={styles.chips}>
                  {chips.map((c) => (
                    <Chip key={c.label} label={c.label} tone={c.tone} solid />
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
    art: {
      height: 150,
      borderRadius: radii.lg,
      borderWidth: stroke.line,
      borderColor: c.ink,
      overflow: 'hidden',
    },
    tag: { position: 'absolute', top: space.s, left: space.s },
    badge: { position: 'absolute', top: space.s, right: space.s },
    text: { gap: space.s },
    cause: { flexDirection: 'row', gap: space.s, alignItems: 'flex-start' },
    flex: { flex: 1 },
    options: { gap: space.m },
    option: {
      borderRadius: radii.lg,
      paddingHorizontal: space.l,
      paddingVertical: space.m,
      gap: space.s,
      borderWidth: stroke.line,
      borderBottomWidth: stroke.buttonEdge,
      borderColor: c.ink,
    },
    pressed: {
      borderBottomWidth: stroke.line,
      marginTop: stroke.buttonEdge - stroke.line,
    },
    locked: {
      backgroundColor: 'transparent',
      borderStyle: 'dashed',
      borderBottomWidth: stroke.line,
      borderColor: c.rule,
    },
    optionRow: { flexDirection: 'row', alignItems: 'center', gap: space.m },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  }),
);
