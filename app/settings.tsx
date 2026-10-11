import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { gameStore, useGame } from '../src/store/game';
import { useSettings, type MotionPreference, type ThemePreference } from '../src/store/settings';
import { Button } from '../src/ui/components/Button';
import { ConfirmSheet } from '../src/ui/components/ConfirmSheet';
import { Icon } from '../src/ui/components/Icon';
import { Screen } from '../src/ui/components/Screen';
import { SegmentedControl } from '../src/ui/components/SegmentedControl';
import { SectionHeader } from '../src/ui/components/Surface';
import { Text } from '../src/ui/components/Text';
import { Touchable } from '../src/ui/components/Touchable';
import { useText } from '../src/ui/i18n';
import { useTheme } from '../src/ui/theme/ThemeProvider';
import { space } from '../src/ui/theme/tokens';

const STYLE_GUIDE_TAPS = 7;

/** React Native Web paints the active thumb teal unless told otherwise; native ignores this prop. */
const WEB_THUMB = (color: string) => ({ activeThumbColor: color }) as object;

function ToggleRow({
  label,
  body,
  value,
  onChange,
}: {
  label: string;
  body: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const { colors } = useTheme();
  return (
    <Touchable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityHint={body}
      accessibilityState={{ checked: value }}
      aria-checked={value}
      onPress={() => {
        onChange(!value);
      }}
      style={styles.toggle}
    >
      <View style={styles.toggleText}>
        <Text variant="headline">{label}</Text>
        <Text variant="footnote" color="textSecondary">
          {body}
        </Text>
      </View>
      <View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        aria-hidden
      >
        <Switch
          value={value}
          trackColor={{ true: colors.accent, false: colors.sunken }}
          thumbColor={colors.raised}
          ios_backgroundColor={colors.sunken}
          {...WEB_THUMB(colors.raised)}
        />
      </View>
    </Touchable>
  );
}

export default function Settings() {
  const { t } = useText();
  const settings = useSettings();
  const game = useGame((s) => s.game);
  const [abandoning, setAbandoning] = useState(false);
  const taps = useRef(0);
  const version = Constants.expoConfig?.version ?? '0.1.0';

  return (
    <Screen>
      <View style={styles.top}>
        <Text variant="title1" accessibilityRole="header">
          {t('ui.settings.title')}
        </Text>
        <Touchable
          accessibilityLabel={t('ui.settings.close')}
          onPress={() => {
            router.back();
          }}
        >
          <Icon name="close" color="textSecondary" />
        </Touchable>
      </View>

      <SectionHeader title={t('ui.settings.appearance')} />
      <SegmentedControl<ThemePreference>
        label={t('ui.settings.theme')}
        value={settings.theme}
        onChange={(theme) => {
          settings.update({ theme });
        }}
        segments={[
          { value: 'system', label: t('ui.settings.system') },
          { value: 'light', label: t('ui.settings.light') },
          { value: 'dark', label: t('ui.settings.dark') },
        ]}
      />
      <Text variant="label" color="textSecondary" style={styles.subhead}>
        {t('ui.settings.motion')}
      </Text>
      <SegmentedControl<MotionPreference>
        label={t('ui.settings.motion')}
        value={settings.motion}
        onChange={(motion) => {
          settings.update({ motion });
        }}
        segments={[
          { value: 'system', label: t('ui.settings.system') },
          { value: 'reduced', label: t('ui.settings.reduced') },
          { value: 'full', label: t('ui.settings.full') },
        ]}
      />

      <SectionHeader title={t('ui.settings.play')} />
      <ToggleRow
        label={t('ui.settings.haptics')}
        body={t('ui.settings.hapticsBody')}
        value={settings.haptics}
        onChange={(haptics) => {
          settings.update({ haptics });
        }}
      />
      <ToggleRow
        label={t('ui.settings.confirm')}
        body={t('ui.settings.confirmBody')}
        value={settings.confirmEndTurn}
        onChange={(confirmEndTurn) => {
          settings.update({ confirmEndTurn });
        }}
      />

      {game !== null && game.ending === null ? (
        <>
          <SectionHeader title={t('ui.settings.run')} />
          <Button
            kind="destructive"
            label={t('ui.settings.abandon')}
            onPress={() => {
              setAbandoning(true);
            }}
          />
        </>
      ) : null}

      <SectionHeader title={t('ui.settings.about')} />
      <Text variant="callout" color="textSecondary">
        {t('ui.settings.aboutBody')}
      </Text>
      <Touchable
        feedback={false}
        accessibilityRole="text"
        accessibilityLabel={t('ui.settings.version', { version })}
        onPress={() => {
          taps.current += 1;
          if (taps.current >= STYLE_GUIDE_TAPS) {
            taps.current = 0;
            router.push('/style-guide');
          }
        }}
      >
        <Text variant="figureS" color="textTertiary">
          {t('ui.settings.version', { version })}
        </Text>
      </Touchable>

      <ConfirmSheet
        visible={abandoning}
        title={t('ui.settings.abandonTitle')}
        body={t('ui.settings.abandonBody')}
        confirmLabel={t('ui.settings.abandonConfirm')}
        cancelLabel={t('ui.settings.abandonCancel')}
        destructive
        onCancel={() => {
          setAbandoning(false);
        }}
        onConfirm={() => {
          setAbandoning(false);
          gameStore.getState().dispatch({ type: 'abandon' });
          router.replace('/ending');
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space.l,
  },
  subhead: { marginTop: space.l, marginBottom: space.s },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: space.l, paddingVertical: space.m },
  toggleText: { flex: 1, gap: 2 },
});
