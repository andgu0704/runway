import { Rubik_500Medium } from '@expo-google-fonts/rubik/500Medium';
import { Rubik_600SemiBold } from '@expo-google-fonts/rubik/600SemiBold';
import { Rubik_700Bold } from '@expo-google-fonts/rubik/700Bold';
import { Rubik_800ExtraBold } from '@expo-google-fonts/rubik/800ExtraBold';
import { useFonts } from 'expo-font';
import { Stack, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { gameStore, useGame } from '../src/store/game';
import { ErrorState } from '../src/ui/components/States';
import { i18n } from '../src/ui/i18n';
import { ThemeProvider, useTheme } from '../src/ui/theme/ThemeProvider';

SplashScreen.preventAutoHideAsync().catch(() => undefined);
SplashScreen.setOptions({ duration: 300, fade: true });

function Shell() {
  const { colors, scheme } = useTheme();
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.canvas).catch(() => undefined);
  }, [colors.canvas]);
  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.canvas },
          animation: 'default',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="new" />
        <Stack.Screen name="(game)" options={{ gestureEnabled: false, animation: 'fade' }} />
        <Stack.Screen name="negotiation" options={{ presentation: 'modal' }} />
        <Stack.Screen name="ending" options={{ gestureEnabled: false, animation: 'fade' }} />
        <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
        <Stack.Screen name="style-guide" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Rubik_500Medium,
    Rubik_600SemiBold,
    Rubik_700Bold,
    Rubik_800ExtraBold,
  });
  const status = useGame((s) => s.status);

  useEffect(() => {
    gameStore.getState().boot();
  }, []);

  const ready = (fontsLoaded || fontError !== null) && status !== 'booting';
  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => undefined);
  }, [ready]);

  if (!ready) return null;
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider>
          <Shell />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/** Shown if a screen crashes: a calm explanation and a way back, never a blank screen. */
export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return (
    <ThemeProvider>
      <BoundaryBody retry={retry} />
    </ThemeProvider>
  );
}

function BoundaryBody({ retry }: { retry: () => Promise<void> }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.boundary, { backgroundColor: colors.canvas }]}>
      <ErrorState
        title={i18n.t('ui.error.crashTitle')}
        body={i18n.t('ui.error.crashBody')}
        action={{
          label: i18n.t('ui.error.retry'),
          onPress: () => {
            retry().catch(() => undefined);
          },
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  boundary: { flex: 1, justifyContent: 'center' },
});
