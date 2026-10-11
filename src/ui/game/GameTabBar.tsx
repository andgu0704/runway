import type { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
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
  feed: 'feed',
  product: 'product',
  people: 'people',
  money: 'money',
  world: 'world',
  company: 'company',
};

export function GameTabBar({ state, navigation, top }: TabBarProps & { top: React.ReactNode }) {
  const styles = useStyles();
  const { t } = useText();
  const insets = useSafeAreaInsets();
  return (
    <View>
      {top}
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
                  name={TAB_ICONS[route.name] ?? 'feed'}
                  filled={focused}
                  color={focused ? 'accent' : 'textTertiary'}
                />
                <Text
                  variant="footnote"
                  color={focused ? 'accent' : 'textTertiary'}
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
    bar: {
      flexDirection: 'row',
      backgroundColor: c.canvas,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.hairline,
      paddingTop: space.xs,
    },
    tab: { flex: 1, alignItems: 'center' },
    inner: { alignItems: 'center', gap: 2 },
    label: { fontSize: 11, lineHeight: 14 },
  }),
);
