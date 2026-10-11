import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useText } from '../i18n';
import { space } from '../theme/tokens';
import { Icon } from './Icon';
import { Text } from './Text';
import { Touchable } from './Touchable';

/** Onboarding header: back, step count, and the question being asked. */
export function StepHeader({
  step,
  total,
  title,
  body,
}: {
  step: number;
  total: number;
  title: string;
  body?: string;
}) {
  const { t } = useText();
  return (
    <View style={styles.wrap}>
      <View style={styles.top}>
        <Touchable
          accessibilityLabel={t('ui.new.back')}
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace('/');
          }}
        >
          <Icon name="back" color="textSecondary" />
        </Touchable>
        <Text variant="label" color="textTertiary">
          {t('ui.new.step', { step, total })}
        </Text>
      </View>
      <Text variant="title1" accessibilityRole="header">
        {title}
      </Text>
      {body !== undefined ? (
        <Text variant="body" color="textSecondary">
          {body}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.s, marginBottom: space.l },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
