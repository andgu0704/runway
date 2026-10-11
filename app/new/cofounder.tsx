import { router } from 'expo-router';
import { View } from 'react-native';
import { loadContent } from '../../src/content/runtime';
import { useDraft } from '../../src/store/draft';
import { Button } from '../../src/ui/components/Button';
import { Screen } from '../../src/ui/components/Screen';
import { StepHeader } from '../../src/ui/components/StepHeader';
import { OptionRow } from '../../src/ui/game/actions/OptionRow';
import { useText } from '../../src/ui/i18n';
import { space } from '../../src/ui/theme/tokens';

export default function PickCofounder() {
  const { t, percent } = useText();
  const { cofounder, set } = useDraft();
  return (
    <Screen
      footer={
        <Button
          label={t('ui.new.continue')}
          disabled={cofounder === undefined}
          onPress={() => {
            router.push('/new/name');
          }}
        />
      }
    >
      <StepHeader
        step={3}
        total={4}
        title={t('ui.new.cofounderTitle')}
        body={t('ui.new.cofounderBody')}
      />
      <View style={{ gap: space.s }}>
        {loadContent().data.cofounders.map((c) => (
          <OptionRow
            key={c.id}
            title={c.name}
            body={t(`cofounder.${c.id}.pitch`)}
            meta={t('ui.new.cofounderEquity', { equity: percent(c.equityBps) })}
            selected={cofounder === c.id}
            onPress={() => {
              set({ cofounder: c.id });
            }}
          />
        ))}
        <OptionRow
          title={t('ui.new.solo')}
          body={t('ui.new.soloBody')}
          selected={cofounder === null}
          onPress={() => {
            set({ cofounder: null });
          }}
        />
      </View>
    </Screen>
  );
}
