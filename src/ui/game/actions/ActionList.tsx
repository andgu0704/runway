import { StyleSheet, View } from 'react-native';
import {
  visibleActions,
  type ActionStatus,
  type ContentPack,
  type GameState,
} from '../../../engine';
import type { Tab } from '../../../content/schema/ids';
import { Icon } from '../../components/Icon';
import { IconBadge } from '../../components/IconBadge';
import { Text } from '../../components/Text';
import { Touchable } from '../../components/Touchable';
import { useText } from '../../i18n';
import { makeStyles, useTheme } from '../../theme/ThemeProvider';
import { cardShadow, radii, space } from '../../theme/tokens';
import { actionVisual } from '../visuals';
import { useActionSheet } from './store';

/** One move as a tile: icon, name, cost. Unavailable moves stay visible, dimmed, with a lock. */
export function ActionTile({ status }: { status: ActionStatus }) {
  const styles = useStyles();
  const { scheme } = useTheme();
  const { t, money } = useText();
  const open = useActionSheet((s) => s.open);
  const { action, available, reason, cost } = status;
  const visual = actionVisual(action.id, action.tab, action.shady === true);
  const costs = [
    action.ap > 0 ? t('ui.action.ap', { count: action.ap }) : t('ui.action.free'),
    cost > 0 ? money(cost) : null,
  ]
    .filter((c) => c !== null)
    .join(' · ');
  const name = t(`action.${action.id}.name`);
  return (
    <Touchable
      onPress={() => {
        open(action.id);
      }}
      style={[styles.tile, cardShadow(scheme), available ? null : styles.dim]}
      accessibilityLabel={`${name}. ${costs}${available ? '' : `. ${t(`ui.unavailable.${reason ?? 'conditions'}`)}`}`}
      accessibilityHint={t(`action.${action.id}.desc`)}
    >
      <View style={styles.top}>
        <IconBadge icon={visual.icon} color={visual.color} size={38} />
        {!available ? <Icon name="locked" size={16} color="textTertiary" /> : null}
      </View>
      <View style={styles.text}>
        <Text variant="headline" numberOfLines={2}>
          {name}
        </Text>
        <Text variant="footnote" color="textTertiary" numberOfLines={1}>
          {available ? costs : t(`ui.unavailable.${reason ?? 'conditions'}`)}
        </Text>
      </View>
    </Touchable>
  );
}

/** A tab's moves as a two-column grid, minus those a screen surfaces in context. */
export function ActionList({
  game,
  content,
  tab,
  exclude = [],
  only,
}: {
  game: GameState;
  content: ContentPack;
  tab: Tab;
  exclude?: string[];
  only?: (id: string, shady: boolean) => boolean;
}) {
  const styles = useStyles();
  const statuses = visibleActions(game, content).filter(
    (s) =>
      s.action.tab === tab &&
      !exclude.includes(s.action.id) &&
      (only === undefined || only(s.action.id, s.action.shady === true)),
  );
  return (
    <View style={styles.grid}>
      {statuses.map((s) => (
        <View key={s.action.id} style={styles.cell}>
          <ActionTile status={s} />
        </View>
      ))}
    </View>
  );
}

const useStyles = makeStyles((c) =>
  StyleSheet.create({
    grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -space.xs },
    cell: { width: '50%', padding: space.xs },
    tile: {
      backgroundColor: c.surface,
      borderRadius: radii.lg,
      padding: space.m,
      gap: space.m,
      minHeight: 124,
      justifyContent: 'space-between',
    },
    dim: { opacity: 0.55 },
    top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    text: { gap: 2 },
  }),
);
