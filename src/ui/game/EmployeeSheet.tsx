import { StyleSheet, View } from 'react-native';
import { actionStatus, type Employee, type GameState } from '../../engine';
import { loadContent } from '../../content/runtime';
import { Button } from '../components/Button';
import { KeyValue } from '../components/KeyValue';
import { Sheet } from '../components/Sheet';
import { SectionHeader } from '../components/Surface';
import { Text } from '../components/Text';
import { useText } from '../i18n';
import { space } from '../theme/tokens';
import { useActionSheet } from './actions/store';
import { SkillDots, TraitChips } from './PersonViews';

const PERSON_ACTIONS = ['oneOnOne', 'giveRaise', 'grantEquity', 'fire'];

/** One person: who they are, what you know about them, and what you can do for (or to) them. */
export function EmployeeSheet({
  game,
  employee,
  onDismiss,
}: {
  game: GameState;
  employee: Employee | null;
  onDismiss: () => void;
}) {
  const { t, money, percent } = useText();
  const open = useActionSheet((s) => s.open);
  const content = loadContent();
  if (employee === null)
    return (
      <Sheet visible={false} onDismiss={onDismiss} label="">
        {null}
      </Sheet>
    );
  const role = content.roles.get(employee.role);
  const order =
    role?.orders === undefined
      ? null
      : (game.settings.orders[employee.role] ?? role.defaultOrder ?? null);
  const months = game.month - employee.hiredMonth;

  const go = (action: string, params: Parameters<typeof open>[1]) => {
    onDismiss();
    open(action, params);
  };

  return (
    <Sheet visible onDismiss={onDismiss} label={employee.name}>
      <View style={styles.head}>
        <Text variant="label" color="accent">
          {t(`role.${employee.role}.name`)}
        </Text>
        <Text variant="title1">{employee.name}</Text>
        <SkillDots skill={employee.skill} />
      </View>
      <TraitChips traits={employee.traits} revealed={employee.revealed} />
      {employee.revealed.map((id) => (
        <Text key={id} variant="footnote" color="textSecondary">
          {`${t(`trait.${id}.name`)}: ${t(`trait.${id}.desc`)}`}
        </Text>
      ))}
      <View>
        <KeyValue label={t('ui.people.salary')} value={money(employee.salary)} />
        <KeyValue label={t('ui.people.equity')} value={percent(employee.equityBps)} />
        <KeyValue label={t('ui.people.tenure')} value={t('ui.people.months', { count: months })} />
      </View>
      {order !== null ? (
        <>
          <SectionHeader title={t('ui.people.standingOrder')} />
          <Text variant="headline">{t(`order.${employee.role}.${order}.name`)}</Text>
          <Text variant="callout" color="textSecondary">
            {t(`order.${employee.role}.${order}.desc`)}
          </Text>
          <Button
            kind="secondary"
            label={t('action.setOrder.name')}
            onPress={() => {
              go('setOrder', { order: { role: employee.role, order } });
            }}
          />
        </>
      ) : null}
      <View style={styles.actions}>
        {PERSON_ACTIONS.map((id) => {
          const action = content.actions.get(id);
          if (action === undefined) return null;
          const status = actionStatus(game, content, action);
          return (
            <Button
              key={id}
              kind={id === 'fire' ? 'destructive' : 'secondary'}
              label={t(`action.${id}.name`)}
              detail={t('ui.action.ap', { count: action.ap })}
              disabled={!status.available}
              onPress={() => {
                go(id, { employee: employee.id });
              }}
            />
          );
        })}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  head: { gap: space.xs },
  actions: { gap: space.s },
});
