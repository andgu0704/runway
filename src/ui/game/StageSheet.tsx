import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import type { GameState } from '../../engine';
import { loadContent } from '../../content/runtime';
import { Button } from '../components/Button';
import { Chip } from '../components/Chip';
import type { IconName } from '../components/Icon';
import { IconBadge } from '../components/IconBadge';
import { Sheet } from '../components/Sheet';
import { Text } from '../components/Text';
import { useText } from '../i18n';
import { layoutMotion } from '../motion';
import { useTheme } from '../theme/ThemeProvider';
import { motion, space, type ColorName } from '../theme/tokens';

export interface StageSheetProps {
  game: GameState;
  /** The stage the company just left; null hides the sheet. */
  from: string | null;
  onDismiss: () => void;
}

interface Change {
  icon: IconName;
  color: ColorName;
  text: string;
}

/** A short celebration when the company moves up a stage, listing what is different now. */
export function StageSheet({ game, from, onDismiss }: StageSheetProps) {
  const { t, money } = useText();
  const { reduceMotion } = useTheme();
  const content = loadContent();
  const before = from === null ? undefined : content.stages.get(from);
  const after = content.stages.get(game.stage);
  const visible = before !== undefined && after !== undefined && after.order > before.order;

  const changes: Change[] = [];
  if (before !== undefined && after !== undefined) {
    const roles = [...content.roles.values()]
      .filter((r) => r.minStage === after.id)
      .map((r) => t(`role.${r.id}.name`));
    if (roles.length > 0) {
      changes.push({
        icon: 'people',
        color: 'people',
        text: t('ui.stage.roles', { roles: roles.join(', ') }),
      });
    }
    if (after.officePerHead > before.officePerHead) {
      changes.push({
        icon: 'briefcase',
        color: 'money',
        text: t('ui.stage.office', { value: money(after.officePerHead) }),
      });
    }
    if (after.arrMultiple !== before.arrMultiple) {
      changes.push({
        icon: 'chart',
        color: 'company',
        text: t('ui.stage.multiple', { value: after.arrMultiple }),
      });
    }
    if (after.actionPoints !== before.actionPoints) {
      changes.push({
        icon: 'target',
        color: 'product',
        text: t('ui.stage.moves', { count: after.actionPoints }),
      });
    }
  }
  const next = after === undefined ? undefined : content.stageOrder[after.order + 1];

  return (
    <Sheet
      visible={visible}
      onDismiss={onDismiss}
      label={t('ui.stage.title', { stage: game.stage })}
      footer={<Button label={t('ui.stage.continue')} onPress={onDismiss} />}
    >
      <Animated.View
        {...layoutMotion(reduceMotion, ZoomIn.duration(motion.slow).springify())}
        style={styles.badge}
      >
        <IconBadge icon="trophy" color="company" size={72} />
      </Animated.View>
      <View style={styles.head}>
        <View style={styles.chip}>
          <Chip
            label={`${t(`stage.${from ?? game.stage}.name`)} → ${t(`stage.${game.stage}.name`)}`}
            tone="company"
          />
        </View>
        <Text variant="title1" accessibilityRole="header" style={styles.center}>
          {t('ui.stage.title', { stage: game.stage })}
        </Text>
        <Text variant="body" color="textSecondary" style={styles.center}>
          {t(`stage.${game.stage}.desc`)}
        </Text>
      </View>
      <View style={styles.list}>
        {changes.map((c, i) => (
          <Animated.View
            key={c.text}
            {...layoutMotion(
              reduceMotion,
              FadeInDown.duration(motion.base).delay(motion.slow + i * 80),
            )}
            style={styles.row}
          >
            <IconBadge icon={c.icon} color={c.color} size={36} />
            <Text variant="callout" style={styles.flex}>
              {c.text}
            </Text>
          </Animated.View>
        ))}
      </View>
      {next !== undefined ? (
        <Text variant="footnote" color="textTertiary" style={styles.center}>
          {t('ui.stage.next', { stage: next.id })}
        </Text>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  badge: { alignItems: 'center', marginTop: space.s },
  head: { alignItems: 'center', gap: space.s },
  chip: { alignItems: 'center' },
  center: { textAlign: 'center' },
  list: { gap: space.s },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.m },
  flex: { flex: 1 },
});
