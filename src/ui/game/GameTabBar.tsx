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
import { space } from '../theme/tokens';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const TAB_ICONS: Record<string, IconName> = {
  feed: 'home',
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
                <Icon
                  name={TAB_ICONS[route.name] ?? 'home'}
                  filled={focused}
                  size={24}
                  color={focused ? 'textPrimary' : 'textTertiary'}
                />
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
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.hairline,
      paddingTop: space.s,
    },
    tab: { flex: 1, alignItems: 'center' },
    inner: { alignItems: 'center', gap: 3 },
    label: { fontSize: 10.5, lineHeight: 13 },
  }),
);
