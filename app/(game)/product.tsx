import { StyleSheet, View } from 'react-native';
import { economy } from '../../src/engine';
import { Button } from '../../src/ui/components/Button';
import { KeyValue } from '../../src/ui/components/KeyValue';
import { Meter } from '../../src/ui/components/Meter';
import { Card, SectionHeader } from '../../src/ui/components/Surface';
import { TabPage } from '../../src/ui/components/TabPage';
import { Text } from '../../src/ui/components/Text';
import { ActionList } from '../../src/ui/game/actions/ActionList';
import { useActionSheet } from '../../src/ui/game/actions/store';
import { useRun } from '../../src/ui/hooks/useRun';
import { useText } from '../../src/ui/i18n';
import { space } from '../../src/ui/theme/tokens';

export default function Product() {
  const run = useRun();
  const { t, money, percent, number } = useText();
  const open = useActionSheet((s) => s.open);
  if (run === null) return null;
  const { game, content } = run;
  const { product, stats, settings } = game;
  const market = economy.market(game, content);
  const model = economy.businessModel(game, content);
  const engineering =
    economy.capacity(game, content, 'engineering') * (1 - content.rules.baseBugShare);
  const active = product.roadmap[0];
  const activeFeature = active === undefined ? undefined : content.features.get(active.feature);
  const price =
    model.priceUnit === 'percent' ? percent(settings.price * 100) : money(settings.price);
  const bugLevel = stats.bugs / market.bugTolerance;

  return (
    <TabPage title={t('ui.tab.product')} subtitle={t(`market.${game.setup.market}.name`)}>
      {!product.launched ? (
        <>
          <SectionHeader title={t('ui.product.launch')} />
          <Card style={styles.gap}>
            <Text variant="body">
              {t(
                product.shipped.includes('coreProduct')
                  ? 'ui.product.readyToLaunch'
                  : 'ui.product.notReady',
              )}
            </Text>
            <KeyValue
              label={t('ui.stat.quality.name')}
              value={`${Math.round(stats.quality)} / 100`}
            />
            <KeyValue label={t('ui.product.waitlist')} value={number(product.waitlist)} />
            {product.shipped.includes('coreProduct') ? (
              <Button
                label={t('action.launch.name')}
                onPress={() => {
                  open('launch');
                }}
              />
            ) : null}
          </Card>
        </>
      ) : null}

      <SectionHeader
        title={t('ui.product.roadmap')}
        aside={t('ui.product.capacity', { points: Math.round(engineering) })}
      />
      {active === undefined || activeFeature === undefined ? (
        <Card style={styles.gap}>
          <Text variant="body" color="textSecondary">
            {t(engineering > 0 ? 'ui.product.roadmapEmpty' : 'ui.product.noEngineers')}
          </Text>
          <Button
            kind="secondary"
            label={t('action.buildFeature.name')}
            onPress={() => {
              open('buildFeature');
            }}
          />
        </Card>
      ) : (
        <Card style={styles.gap}>
          <Text variant="label" color="textTertiary">
            {t('ui.product.building')}
          </Text>
          <Text variant="title2">{t(`feature.${active.feature}.name`)}</Text>
          <Meter
            value={active.progress / activeFeature.cost}
            label={t('ui.product.progressLabel')}
          />
          <Text variant="figureS" color="textSecondary">
            {engineering > 0
              ? t('ui.product.eta', {
                  count: Math.max(
                    1,
                    Math.ceil((activeFeature.cost - active.progress) / engineering),
                  ),
                })
              : t('ui.product.stalled')}
          </Text>
          {product.roadmap.slice(1).map((item, i) => (
            <Text key={item.feature} variant="callout" color="textSecondary">
              {t('ui.product.next', { index: i + 2, feature: item.feature })}
            </Text>
          ))}
        </Card>
      )}
      {product.shipped.length > 0 ? (
        <Text variant="footnote" color="textTertiary" style={styles.shipped}>
          {t('ui.product.shipped', {
            list: product.shipped.map((f) => t(`feature.${f}.name`)).join(', '),
          })}
        </Text>
      ) : null}

      <SectionHeader title={t('ui.product.health')} />
      <KeyValue
        label={t('ui.product.bugs')}
        value={number(stats.bugs)}
        color={bugLevel > 0.6 ? 'down' : bugLevel > 0.3 ? 'warn' : 'textPrimary'}
      />
      <View style={styles.meterRow}>
        <Text variant="callout" color="textSecondary">
          {t('ui.product.techDebt')}
        </Text>
        <Meter
          value={stats.techDebt / 100}
          color={stats.techDebt > 50 ? 'down' : 'warn'}
          label={t('ui.product.techDebt')}
        />
      </View>

      <SectionHeader title={t('ui.product.pricing')} />
      <KeyValue label={t(`model.${settings.model}.name`)} value={price} />
      <Text variant="footnote" color="textTertiary">
        {t(`model.${settings.model}.unit`)}
      </Text>

      <SectionHeader title={t('ui.product.actions')} />
      <ActionList game={game} content={content} tab="product" exclude={['launch']} />
    </TabPage>
  );
}

const styles = StyleSheet.create({
  gap: { gap: space.s },
  shipped: { marginTop: space.s },
  meterRow: { gap: space.xs, paddingVertical: space.xs },
});
