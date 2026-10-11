import { StyleSheet, View } from 'react-native';
import { economy } from '../../src/engine';
import { Button } from '../../src/ui/components/Button';
import { Chip } from '../../src/ui/components/Chip';
import { IconBadge } from '../../src/ui/components/IconBadge';
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
  const shipped = new Map<string, number>();
  for (const id of product.shipped) shipped.set(id, (shipped.get(id) ?? 0) + 1);

  return (
    <TabPage title={t('ui.tab.product')} subtitle={t(`market.${game.setup.market}.name`)}>
      {!product.launched ? (
        <Card style={[styles.gap, styles.first]}>
          <View style={styles.row}>
            <IconBadge icon="megaphone" color="product" />
            <View style={styles.flex}>
              <Text variant="label" color="textTertiary">
                {t('ui.product.launch')}
              </Text>
              <Text variant="headline">
                {t(
                  product.shipped.includes('coreProduct')
                    ? 'ui.product.readyShort'
                    : 'ui.product.notReadyShort',
                )}
              </Text>
            </View>
          </View>
          <View style={styles.chips}>
            <Chip
              label={t('ui.product.qualityChip', { value: Math.round(stats.quality) })}
              tone="product"
            />
            <Chip
              label={t('ui.product.waitlistChip', { value: number(product.waitlist) })}
              tone="world"
            />
          </View>
          {product.shipped.includes('coreProduct') ? (
            <Button
              label={t('action.launch.name')}
              trailingIcon="rocket"
              onPress={() => {
                open('launch');
              }}
            />
          ) : null}
        </Card>
      ) : null}

      <SectionHeader
        title={t('ui.product.roadmap')}
        aside={t('ui.product.capacity', { points: Math.round(engineering) })}
      />
      {active === undefined || activeFeature === undefined ? (
        <Card style={styles.gap}>
          <View style={styles.row}>
            <IconBadge icon="rocket" color="product" />
            <Text variant="callout" color="textSecondary" style={styles.flex}>
              {t(engineering > 0 ? 'ui.product.roadmapEmpty' : 'ui.product.noEngineers')}
            </Text>
          </View>
          <Button
            kind="secondary"
            label={t('action.buildFeature.name')}
            icon="add"
            onPress={() => {
              open('buildFeature');
            }}
          />
        </Card>
      ) : (
        <Card style={styles.gap}>
          <View style={styles.row}>
            <IconBadge icon="rocket" color="product" />
            <View style={styles.flex}>
              <Text variant="label" color="textTertiary">
                {t('ui.product.building')}
              </Text>
              <Text variant="headline">{t(`feature.${active.feature}.name`)}</Text>
            </View>
            <Text variant="figureL">{`${Math.min(99, Math.round((active.progress / activeFeature.cost) * 100))}%`}</Text>
          </View>
          <Meter
            value={active.progress / activeFeature.cost}
            color="product"
            label={t('ui.product.progressLabel')}
          />
          <View style={styles.between}>
            <Text variant="footnote" color="textSecondary">
              {engineering > 0
                ? t('ui.product.eta', {
                    count: Math.max(
                      1,
                      Math.ceil((activeFeature.cost - active.progress) / engineering),
                    ),
                  })
                : t('ui.product.stalled')}
            </Text>
            {product.roadmap[1] !== undefined ? (
              <Text variant="footnote" color="textSecondary">
                {t('ui.product.nextUp', { feature: product.roadmap[1].feature })}
              </Text>
            ) : null}
          </View>
        </Card>
      )}

      <View style={styles.pair}>
        <Card style={[styles.flex, styles.gapSmall]}>
          <Text variant="label" color="textTertiary">
            {t('ui.product.bugs')}
          </Text>
          <View style={styles.row}>
            <Text variant="figureL">{number(stats.bugs)}</Text>
            <Chip
              label={t(
                bugLevel > 0.6
                  ? 'ui.product.levelHigh'
                  : bugLevel > 0.3
                    ? 'ui.product.levelMedium'
                    : 'ui.product.levelLow',
              )}
              tone={bugLevel > 0.6 ? 'down' : bugLevel > 0.3 ? 'warn' : 'up'}
            />
          </View>
        </Card>
        <Card style={[styles.flex, styles.gapSmall]}>
          <Text variant="label" color="textTertiary">
            {t('ui.product.techDebt')}
          </Text>
          <View style={styles.meterWrap}>
            <Meter
              value={stats.techDebt / 100}
              color={stats.techDebt > 50 ? 'down' : 'warn'}
              label={t('ui.product.techDebt')}
            />
          </View>
        </Card>
      </View>
      <Card style={[styles.row, styles.pricing]}>
        <IconBadge icon="target" color="company" />
        <View style={styles.flex}>
          <Text variant="label" color="textTertiary">
            {t(`model.${settings.model}.name`)}
          </Text>
          <Text variant="footnote" color="textSecondary">
            {t(`model.${settings.model}.unit`)}
          </Text>
        </View>
        <Text variant="figureL">{price}</Text>
      </Card>

      {shipped.size > 0 ? (
        <>
          <SectionHeader
            title={t('ui.product.shippedTitle')}
            aside={String(product.shipped.length)}
          />
          <View style={styles.chips}>
            {[...shipped.entries()].map(([id, count]) => (
              <Chip
                key={id}
                label={count > 1 ? `${t(`feature.${id}.name`)} ×${count}` : t(`feature.${id}.name`)}
                tone="product"
                icon="check"
              />
            ))}
          </View>
        </>
      ) : null}

      <SectionHeader title={t('ui.product.actions')} />
      <ActionList game={game} content={content} tab="product" exclude={['launch']} />
    </TabPage>
  );
}

const styles = StyleSheet.create({
  first: { marginTop: space.l },
  gap: { gap: space.m },
  gapSmall: { gap: space.s },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.m },
  between: { flexDirection: 'row', justifyContent: 'space-between', gap: space.m },
  flex: { flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  pair: { flexDirection: 'row', gap: space.s, marginTop: space.s },
  meterWrap: { flex: 1, justifyContent: 'center', minHeight: 30 },
  pricing: { marginTop: space.s },
});
