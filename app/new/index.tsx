import { router } from 'expo-router';
import { View } from 'react-native';
import { loadContent } from '../../src/content/runtime';
import { useDraft } from '../../src/store/draft';
import { Button } from '../../src/ui/components/Button';
import { Screen } from '../../src/ui/components/Screen';
import { StepHeader } from '../../src/ui/components/StepHeader';
import { Text } from '../../src/ui/components/Text';
import { OptionRow } from '../../src/ui/game/actions/OptionRow';
import { useText } from '../../src/ui/i18n';
import { space } from '../../src/ui/theme/tokens';

export default function PickBackground() {
  const { t } = useText();
  const background = useDraft((s) => s.background);
  const set = useDraft((s) => s.set);
  return (
    <Screen
      footer={
        <Button
          label={t('ui.new.continue')}
          disabled={background === null}
          onPress={() => {
            router.push('/new/market');
          }}
        />
      }
    >
      <StepHeader
        step={1}
        total={4}
        title={t('ui.new.backgroundTitle')}
        body={t('ui.new.backgroundBody')}
      />
      <View style={{ gap: space.s }}>
        {loadContent().data.backgrounds.map((b) => (
          <OptionRow
            key={b.id}
            title={t(`background.${b.id}.name`)}
            body={t(`background.${b.id}.desc`)}
            meta={t(`background.${b.id}.drawback`)}
            selected={background === b.id}
            onPress={() => {
              set({ background: b.id });
            }}
          />
        ))}
      </View>
      <Text variant="footnote" color="textTertiary" style={{ marginTop: space.l }}>
        {t('ui.new.backgroundNote')}
      </Text>
    </Screen>
  );
}
