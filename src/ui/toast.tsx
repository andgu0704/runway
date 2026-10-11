import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';
import { haptic } from '../platform/haptics';
import { layoutMotion } from './motion';
import { Text } from './components/Text';
import { useText } from './i18n';
import { makeStyles, useTheme } from './theme/ThemeProvider';
import { gutter, radii, space } from './theme/tokens';

interface ToastState {
  key: string | null;
  id: number;
}

const useToastStore = create<ToastState>(() => ({ key: null, id: 0 }));

export function showToast(key: string): void {
  haptic('warning');
  useToastStore.setState((s) => ({ key, id: s.id + 1 }));
}

/** A brief, polite message at the top of the screen, announced to screen readers. */
export function ToastHost() {
  const { key, id } = useToastStore();
  const { t } = useText();
  const styles = useStyles();
  const { reduceMotion } = useTheme();
  const insets = useSafeAreaInsets();
  useEffect(() => {
    if (key === null) return;
    const timer = setTimeout(() => {
      useToastStore.setState({ key: null });
    }, 2600);
    return () => {
      clearTimeout(timer);
    };
  }, [key, id]);
  if (key === null) return null;
  return (
    <View pointerEvents="none" style={[styles.host, { top: insets.top + space.s }]}>
      <Animated.View
        key={id}
        {...layoutMotion(reduceMotion, FadeInUp.duration(180), FadeOut.duration(180))}
        style={styles.toast}
        accessibilityLiveRegion="polite"
        accessibilityRole="alert"
      >
        <Text variant="callout" color="canvas">
          {t(key)}
        </Text>
      </Animated.View>
    </View>
  );
}

const useStyles = makeStyles((c) =>
  StyleSheet.create({
    host: { position: 'absolute', left: gutter, right: gutter, alignItems: 'center', zIndex: 10 },
    toast: {
      backgroundColor: c.textPrimary,
      borderRadius: radii.sm,
      paddingHorizontal: space.l,
      paddingVertical: space.m,
    },
  }),
);
