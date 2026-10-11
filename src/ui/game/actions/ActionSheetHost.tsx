import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  actionStatus,
  economy,
  paramOptions,
  type ActionParams,
  type GameState,
  type ParamOption,
} from '../../../engine';
import { loadContent } from '../../../content/runtime';
import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { Icon } from '../../components/Icon';
import { Sheet } from '../../components/Sheet';
import { Slider } from '../../components/Slider';
import { Text } from '../../components/Text';
import { useText } from '../../i18n';
import { describeRequirements } from '../../requirements';
import { space } from '../../theme/tokens';
import { OptionRow } from './OptionRow';
import { useActionSheet } from './store';

/** Renders whichever action sheet is open, with the right picker for its parameter. */
export function ActionSheetHost({
  game,
  onPerform,
}: {
  game: GameState;
  onPerform: (action: string, params: ActionParams) => boolean;
}) {
  const { action: actionId, preset, close } = useActionSheet();
  const { t, money } = useText();
  const content = loadContent();
  const [params, setParams] = useState<ActionParams>({});

  useEffect(() => {
    setParams(preset);
  }, [actionId, preset]);

  const action = actionId === null ? undefined : content.actions.get(actionId);
  if (action === undefined)
    return (
      <Sheet visible={false} onDismiss={close} label="">
        {null}
      </Sheet>
    );

  const status = actionStatus(game, content, action);
  const options = action.param === undefined ? [] : paramOptions(game, content, action.param);
  const ready = action.param === undefined || paramChosen(action.param.kind, params);
  const costs = [
    action.ap > 0 ? t('ui.action.ap', { count: action.ap }) : t('ui.action.free'),
    status.cost > 0 ? money(status.cost) : null,
  ].filter((c): c is string => c !== null);
  const unmet =
    status.reason === 'conditions'
      ? describeRequirements(action.when, game, content).filter((r) => !r.met)
      : [];

  return (
    <Sheet
      visible
      onDismiss={close}
      label={t(`action.${action.id}.name`)}
      footer={
        <Button
          label={t(
            action.param?.kind === 'policy' &&
              options.some((o) => o.kind === 'policy' && o.id === params.policy && o.active)
              ? 'ui.action.turnOff'
              : 'ui.action.confirm',
          )}
          detail={costs.join(' · ')}
          disabled={!status.available || !ready}
          onPress={() => {
            if (onPerform(action.id, params)) close();
          }}
        />
      }
    >
      <View style={styles.head}>
        <Text variant="title2" accessibilityRole="header">
          {t(`action.${action.id}.name`)}
        </Text>
        <Text variant="figureS" color="textSecondary">
          {costs.join(' · ')}
        </Text>
      </View>
      <Text variant="body" color="textSecondary">
        {t(`action.${action.id}.desc`)}
      </Text>
      {action.shady === true ? <Chip label={t('ui.action.shady')} tone="warn" /> : null}
      {!status.available ? (
        <View style={styles.blocked}>
          <View style={styles.blockedRow}>
            <Icon name="locked" size={16} color="textSecondary" />
            <Text variant="callout" color="textSecondary">
              {t(`ui.unavailable.${status.reason ?? 'conditions'}`)}
            </Text>
          </View>
          {unmet.map((r) => (
            <Text key={r.text} variant="footnote" color="textTertiary">
              {`· ${r.text}`}
            </Text>
          ))}
        </View>
      ) : null}
      {status.available && action.param !== undefined ? (
        <Picker
          game={game}
          kind={action.param.kind}
          options={options}
          params={params}
          onChange={setParams}
        />
      ) : null}
    </Sheet>
  );
}

function paramChosen(kind: string, params: ActionParams): boolean {
  switch (kind) {
    case 'feature':
      return params.feature !== undefined;
    case 'candidate':
      return params.candidate !== undefined;
    case 'employee':
      return params.employee !== undefined;
    case 'role':
      return params.role !== undefined;
    case 'policy':
      return params.policy !== undefined;
    case 'character':
      return params.character !== undefined;
    case 'model':
      return params.model !== undefined;
    case 'order':
      return params.order !== undefined;
    default:
      return params.amount !== undefined;
  }
}

function Picker({
  game,
  kind,
  options,
  params,
  onChange,
}: {
  game: GameState;
  kind: string;
  options: ParamOption[];
  params: ActionParams;
  onChange: (p: ActionParams) => void;
}) {
  const { t, money, percent } = useText();
  const content = loadContent();

  if (kind === 'feature') {
    const engineering =
      economy.capacity(game, content, 'engineering') * (1 - content.rules.baseBugShare);
    return (
      <View style={styles.list}>
        {options.flatMap((o) => {
          if (o.kind !== 'feature') return [];
          const feature = content.features.get(o.id);
          if (feature === undefined) return [];
          const months =
            engineering > 0 ? Math.max(1, Math.ceil(feature.cost / engineering)) : null;
          const appeal = feature.appeal * (feature.markets?.[game.setup.market] ?? 1);
          return [
            <OptionRow
              key={o.id}
              title={t(`feature.${o.id}.name`)}
              body={t(`feature.${o.id}.desc`)}
              meta={`${months === null ? t('ui.picker.noEngineers') : t('ui.picker.months', { count: months })} · ${t(appeal >= 12 ? 'ui.picker.appealHigh' : appeal >= 7 ? 'ui.picker.appealMedium' : 'ui.picker.appealLow')}`}
              selected={params.feature === o.id}
              onPress={() => {
                onChange({ feature: o.id });
              }}
            />,
          ];
        })}
      </View>
    );
  }

  if (kind === 'role') {
    return (
      <View style={styles.list}>
        {options.flatMap((o) => {
          if (o.kind !== 'role') return [];
          const role = content.roles.get(o.id);
          const salaryMul = content.stages.get(game.stage)?.salaryMul ?? 1;
          return [
            <OptionRow
              key={o.id}
              title={t(`role.${o.id}.name`)}
              meta={
                role === undefined
                  ? undefined
                  : t('ui.picker.salaryRange', {
                      low: money(role.salary[0] * salaryMul),
                      high: money(role.salary[1] * salaryMul),
                    })
              }
              selected={params.role === o.id}
              onPress={() => {
                onChange({ role: o.id });
              }}
            />,
          ];
        })}
      </View>
    );
  }

  if (kind === 'policy') {
    return (
      <View style={styles.list}>
        {options.flatMap((o) =>
          o.kind !== 'policy'
            ? []
            : [
                <OptionRow
                  key={o.id}
                  title={t(`policy.${o.id}.name`)}
                  body={t(`policy.${o.id}.desc`)}
                  selected={params.policy === o.id}
                  aside={o.active ? <Chip label={t('ui.picker.on')} tone="accent" /> : null}
                  onPress={() => {
                    onChange({ policy: o.id });
                  }}
                />,
              ],
        )}
      </View>
    );
  }

  if (kind === 'model') {
    return (
      <View style={styles.list}>
        {options.flatMap((o) =>
          o.kind !== 'model'
            ? []
            : [
                <OptionRow
                  key={o.id}
                  title={t(`model.${o.id}.name`)}
                  body={t(`model.${o.id}.desc`)}
                  selected={params.model === o.id}
                  onPress={() => {
                    onChange({ model: o.id });
                  }}
                />,
              ],
        )}
      </View>
    );
  }

  if (kind === 'order') {
    const role = params.order?.role;
    return (
      <View style={styles.list}>
        {options.flatMap((o) =>
          o.kind !== 'order' || o.role !== role
            ? []
            : [
                <OptionRow
                  key={o.order}
                  title={t(`order.${o.role}.${o.order}.name`)}
                  body={t(`order.${o.role}.${o.order}.desc`)}
                  selected={params.order?.order === o.order}
                  aside={o.active ? <Chip label={t('ui.picker.current')} tone="accent" /> : null}
                  onPress={() => {
                    if (!o.active) onChange({ order: { role: o.role, order: o.order } });
                  }}
                />,
              ],
        )}
      </View>
    );
  }

  const range = options[0];
  if (range !== undefined && (range.kind === 'price' || range.kind === 'budget')) {
    const value = params.amount ?? range.current;
    const config = range.kind === 'price' ? economy.marketModel(game, content) : null;
    const unit =
      range.kind === 'price' ? t(`model.${game.settings.model}.unit`) : t('ui.picker.perMonth');
    const format = (v: number) =>
      config !== null && economy.businessModel(game, content).priceUnit === 'percent'
        ? percent(v * 100)
        : money(v);
    return (
      <View style={styles.list}>
        <View style={styles.amount}>
          <Text variant="figureL">{format(value)}</Text>
          <Text variant="footnote" color="textSecondary">
            {unit}
          </Text>
        </View>
        <Slider
          value={value}
          min={range.min}
          max={range.max}
          step={range.step}
          label={t(range.kind === 'price' ? 'ui.picker.priceLabel' : 'ui.picker.budgetLabel')}
          valueText={`${format(value)} ${unit}`}
          onChange={(amount) => {
            onChange({ amount });
          }}
        />
        <Text variant="footnote" color="textTertiary">
          {config !== null
            ? t('ui.picker.fairPrice', { price: format(config.fairPrice) })
            : t('ui.picker.budgetHint', { current: money(range.current) })}
        </Text>
        {params.amount === undefined || params.amount === range.current ? (
          <Text variant="footnote" color="textSecondary">
            {t('ui.picker.moveSlider')}
          </Text>
        ) : null}
      </View>
    );
  }

  const person =
    kind === 'candidate'
      ? game.candidates.find((c) => c.id === params.candidate)
      : game.team.find((e) => e.id === params.employee);
  if (person === undefined) return null;
  return (
    <View style={styles.amount}>
      <Text variant="headline">{person.name}</Text>
      <Text variant="figureS" color="textSecondary">
        {`${t(`role.${person.role}.name`)} · ${money(person.salary)} ${t('ui.people.perYear')}${person.equityBps > 0 ? ` · ${percent(person.equityBps)}` : ''}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { gap: space.xs },
  blocked: { gap: space.xs },
  blockedRow: { flexDirection: 'row', alignItems: 'center', gap: space.s },
  list: { gap: space.s },
  amount: { gap: space.xxs },
});
