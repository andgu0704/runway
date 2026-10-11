import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { haptic } from '../../platform/haptics';
import { Text } from '../components/Text';
import { Touchable } from '../components/Touchable';
import { useText } from '../i18n';
import { makeStyles } from '../theme/ThemeProvider';
import { radii, space, stroke } from '../theme/tokens';
import { OfficeScene, type SceneModel } from './OfficeScene';
import { floorCount, onFloor } from './officeLayout';

/**
 * The office, one floor at a time. With more than one floor you can swipe between them
 * or tap a floor button; the garage and small offices are a single room.
 */
export function OfficeFloors({ model, width }: { model: SceneModel; width: number }) {
  const styles = useStyles();
  const { t } = useText();
  const floors = floorCount(model.stage, model.people.length);
  const [current, setCurrent] = useState(0);
  const pager = useRef<ScrollView>(null);
  const floor = Math.min(current, floors - 1);

  if (floors <= 1) return <OfficeScene model={model} width={width} />;

  const go = (index: number) => {
    setCurrent(index);
    pager.current?.scrollTo({ x: index * width, animated: true });
  };

  return (
    <View>
      <ScrollView
        ref={pager}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={32}
        onScroll={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          if (index !== floor && index >= 0 && index < floors) {
            haptic('select');
            setCurrent(index);
          }
        }}
      >
        {Array.from({ length: floors }, (_, i) => (
          <View key={i} style={{ width }}>
            <OfficeScene model={model} width={width} floor={i} />
          </View>
        ))}
      </ScrollView>
      <View style={styles.tabs} accessibilityRole="tablist">
        {Array.from({ length: floors }, (_, i) => {
          const count = onFloor(model.stage, model.people, i).length;
          const selected = i === floor;
          return (
            <Touchable
              key={i}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={t('ui.office.floorA11y', { floor: i + 1, count })}
              onPress={() => {
                go(i);
              }}
              style={[styles.tab, selected ? styles.tabOn : null]}
            >
              <Text variant="headline" color={selected ? 'onAccent' : 'textSecondary'}>
                {t('ui.office.floorShort', { floor: i + 1 })}
              </Text>
            </Touchable>
          );
        })}
      </View>
    </View>
  );
}

const useStyles = makeStyles((c) =>
  StyleSheet.create({
    tabs: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: space.s,
      marginTop: space.xs,
    },
    tab: {
      minWidth: 52,
      height: 44,
      paddingHorizontal: space.m,
      borderRadius: radii.full,
      alignItems: 'center',
      backgroundColor: c.surface,
      borderWidth: stroke.line,
      borderBottomWidth: 4,
      borderColor: c.ink,
    },
    tabOn: { backgroundColor: c.accent },
  }),
);
