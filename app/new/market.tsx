import { router } from 'expo-router';
import { View } from 'react-native';
import { loadContent } from '../../src/content/runtime';
import { useDraft } from '../../src/store/draft';
import { Button } from '../../src/ui/components/Button';
import { Screen } from '../../src/ui/components/Screen';
import { StepHeader } from '../../src/ui/components/StepHeader';
import { SectionHeader } from '../../src/ui/components/Surface';
import { OptionRow } from '../../src/ui/game/actions/OptionRow';
import { MARKET_VISUALS, MODEL_VISUALS } from '../../src/ui/game/visuals';
import { useText } from '../../src/ui/i18n';
import { space } from '../../src/ui/theme/tokens';

export default function PickMarket() {
  const { t } = useText();
  const { market, model, set } = useDraft();
  const content = loadContent();
  const chosen = market === null ? undefined : content.markets.get(market);
  return (
    <Screen
      footer={
        <Button
          label={t('ui.new.continue')}
          disabled={market === null || model === null}
          onPress={() => {
            router.push('/new/cofounder');
          }}
        />
      }
    >
      <StepHeader
        step={2}
        total={4}
        title={t('ui.new.marketTitle')}
        body={t('ui.new.marketBody')}
      />
      <View style={{ gap: space.s }}>
        {content.data.markets.map((m) => (
          <OptionRow
            key={m.id}
            title={t(`market.${m.id}.name`)}
            body={t(`market.${m.id}.pitch`)}
            selected={market === m.id}
            icon={MARKET_VISUALS[m.id]?.icon ?? 'product'}
            color={MARKET_VISUALS[m.id]?.color ?? 'product'}
            onPress={() => {
              set({ market: m.id, model: m.models[0]?.model ?? null });
            }}
          />
        ))}
      </View>
      {chosen !== undefined ? (
        <>
          <SectionHeader title={t('ui.new.modelTitle')} />
          <View style={{ gap: space.s }}>
            {chosen.models.map((m) => (
              <OptionRow
                key={m.model}
                title={t(`model.${m.model}.name`)}
                body={t(`model.${m.model}.desc`)}
                selected={model === m.model}
                icon={MODEL_VISUALS[m.model]?.icon ?? 'money'}
                color={MODEL_VISUALS[m.model]?.color ?? 'money'}
                onPress={() => {
                  set({ model: m.model });
                }}
              />
            ))}
          </View>
        </>
      ) : null}
    </Screen>
  );
}
