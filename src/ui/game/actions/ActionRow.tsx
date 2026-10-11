import { StyleSheet, View } from 'react-native';
import type { ActionStatus } from '../../../engine';
import { Icon } from '../../components/Icon';
import { Text } from '../../components/Text';
import { Touchable } from '../../components/Touchable';
import { useText } from '../../i18n';
import { makeStyles } from '../../theme/ThemeProvider';
import { space } from '../../theme/tokens';
import { useActionSheet } from './store';

/** One action in a tab list: what it is, what it costs, and why it might not be possible yet. */
export function ActionRow({ status }: { status: ActionStatus }) {
  const styles = useStyles();
  const { t, money } = useText();
  const open = useActionSheet((s) => s.open);
  const { action, available, reason, cost } = status;
  const costs = [
    action.ap > 0 ? t('ui.action.ap', { count: action.ap }) : t('ui.action.free'),
    cost > 0 ? money(cost) : null,
  ].filter((c) => c !== null);
  const name = t(`action.${action.id}.name`);
  return (
    <Touchable
      onPress={() => {
        open(action.id);
      }}
      style={styles.row}
      accessibilityLabel={`${name}. ${costs.join(', ')}${available ? '' : `. ${t(`ui.unavailable.${reason ?? 'conditions'}`)}`}`}
      accessibilityHint={t(`action.${action.id}.desc`)}
    >
      <View style={styles.inner}>
        <View style={styles.text}>
          <Text variant="headline" color={available ? 'textPrimary' : 'textTertiary'}>
            {name}
          </Text>
          <Text variant="footnote" color="textSecondary" numberOfLines={2}>
            {available
              ? t(`action.${action.id}.desc`)
              : t(`ui.unavailable.${reason ?? 'conditions'}`)}
          </Text>
        </View>
        <View style={styles.cost}>
          <Text variant="figureS" color={available ? 'textSecondary' : 'textTertiary'}>
            {costs.join(' · ')}
          </Text>
          <Icon name="next" size={16} color="textTertiary" />
        </View>
      </View>
    </Touchable>
  );
}

const useStyles = makeStyles((c) =>
  StyleSheet.create({
    row: {
      paddingVertical: space.m,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.hairline,
    },
    inner: { flexDirection: 'row', alignItems: 'center', gap: space.m },
    text: { flex: 1, gap: 2 },
    cost: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  }),
);
