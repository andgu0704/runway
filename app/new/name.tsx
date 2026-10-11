import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { gameStore } from '../../src/store/game';
import { useDraft } from '../../src/store/draft';
import { Button } from '../../src/ui/components/Button';
import { Screen } from '../../src/ui/components/Screen';
import { StepHeader } from '../../src/ui/components/StepHeader';
import { Text } from '../../src/ui/components/Text';
import { i18n, useText } from '../../src/ui/i18n';
import { makeStyles, useTheme } from '../../src/ui/theme/ThemeProvider';
import { fonts, radii, space } from '../../src/ui/theme/tokens';

const MAX = 40;

function suggestions(): string[] {
  const list: unknown = i18n.t('ui.new.suggestions', { returnObjects: true });
  return Array.isArray(list) ? list.filter((s): s is string => typeof s === 'string') : [];
}

export default function NameIt() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useText();
  const draft = useDraft();
  const [index, setIndex] = useState(0);
  const company = draft.companyName.trim();
  const founder = draft.founderName.trim();
  const valid = company.length > 0 && founder.length > 0;

  const start = () => {
    if (
      !valid ||
      draft.background === null ||
      draft.market === null ||
      draft.model === null ||
      draft.cofounder === undefined
    )
      return;
    gameStore.getState().startRun({
      founderName: founder,
      companyName: company,
      background: draft.background,
      market: draft.market,
      model: draft.model,
      cofounder: draft.cofounder,
    });
    draft.reset();
    router.replace('/feed');
  };

  const field = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    placeholder: string,
  ) => (
    <View style={styles.field}>
      <Text variant="label" color="textSecondary">
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={(v) => {
          onChange(v.slice(0, MAX));
        }}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        style={styles.input}
        accessibilityLabel={label}
        autoCorrect={false}
        maxLength={MAX}
        returnKeyType="done"
      />
    </View>
  );

  return (
    <Screen footer={<Button label={t('ui.new.start')} disabled={!valid} onPress={start} />}>
      <StepHeader step={4} total={4} title={t('ui.new.nameTitle')} body={t('ui.new.nameBody')} />
      {field(
        t('ui.new.founderName'),
        draft.founderName,
        (v) => {
          draft.set({ founderName: v });
        },
        t('ui.new.founderPlaceholder'),
      )}
      {field(
        t('ui.new.companyName'),
        draft.companyName,
        (v) => {
          draft.set({ companyName: v });
        },
        t('ui.new.companyPlaceholder'),
      )}
      <Button
        kind="tertiary"
        label={t('ui.new.suggest')}
        onPress={() => {
          const list = suggestions();
          if (list.length === 0) return;
          draft.set({ companyName: list[index % list.length] ?? '' });
          setIndex(index + 1);
        }}
      />
    </Screen>
  );
}

const useStyles = makeStyles((c) =>
  StyleSheet.create({
    field: { gap: space.xs, marginBottom: space.l },
    input: {
      fontFamily: fonts.serif,
      fontSize: 22,
      color: c.textPrimary,
      minHeight: 52,
      paddingHorizontal: space.m,
      borderRadius: radii.sm,
      borderWidth: 1,
      borderColor: c.hairline,
      backgroundColor: c.surface,
    },
  }),
);
