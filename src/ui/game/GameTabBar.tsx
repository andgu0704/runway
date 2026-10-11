import type { Tabs } from 'expo-router';
import type { ComponentProps, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { haptic } from '../../platform/haptics';
import { Icon, type IconName } from '../components/Icon';
import { Text } from '../components/Text';
import { Touchable } from '../components/Touchable';
import { useText } from '../i18n';
import { makeStyles } from '../theme/ThemeProvider';
import { radii, space, stroke, type ColorName } from '../theme/tokens';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const TAB_ICONS: Record<string, IconName> = {
  feed: 'home',
  product: 'product',
  people: 'people',
  money: 'money',
  world: 'world',
  company: 'company',
};

const TAB_COLORS: Record<string, ColorName> = {
  feed: 'textPrimary',
  product: 'product',
  people: 'people',
  money: 'money',
  world: 'world',
  company: 'company',
};

/** Tab bar with the floating turn bar riding above it. */
export function GameTabBar({ state, navigation, top }: TabBarProps & { top: ReactNode }) {
  const styles = useStyles();
  const { t } = useText();
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.floating} pointerEvents="box-none">
        {top}
      </View>
      <View
        style={[styles.bar, { paddingBottom: Math.max(insets.bottom, space.s) }]}
        accessibilityRole="tablist"
      >
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const label = t(`ui.tab.${route.name}`);
          return (
            <Touchable
              key={route.key}
              feedback={false}
              accessibilityRole="tab"
              accessibilityLabel={label}
              accessibilityState={{ selected: focused }}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) {
                  haptic('select');
                  navigation.navigate(route.name);
                }
              }}
              style={styles.tab}
            >
              <View style={styles.inner}>
                <View style={[styles.pill, focused ? styles.pillOn : null]}>
                  <Icon
                    name={TAB_ICONS[route.name] ?? 'home'}
                    filled
                    size={22}
                    color={focused ? 'onAccent' : (TAB_COLORS[route.name] ?? 'textPrimary')}
                  />
                </View>
                <Text
                  variant="footnote"
                  color={focused ? 'textPrimary' : 'textTertiary'}
                  numberOfLines={1}
                  style={styles.label}
                >
                  {label}
                </Text>
              </View>
            </Touchable>
          );
        })}
      </View>
    </View>
  );
}

const useStyles = makeStyles((c) =>
  StyleSheet.create({
    wrap: { position: 'absolute', left: 0, right: 0, bottom: 0 },
    floating: { paddingHorizontal: space.l, paddingBottom: space.s },
    bar: {
      flexDirection: 'row',
      backgroundColor: c.surface,
      borderTopWidth: stroke.line,
      borderTopColor: c.ink,
      paddingTop: space.s,
    },
    tab: { flex: 1, alignItems: 'center' },
    inner: { alignItems: 'center', gap: 2 },
    pill: {
      width: 46,
      height: 32,
      borderRadius: radii.sm,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    pillOn: { backgroundColor: c.accent, borderColor: c.ink },
    label: { fontSize: 10.5, lineHeight: 13 },
  }),
);
