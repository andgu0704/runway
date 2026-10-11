import { StyleSheet, View } from 'react-native';
import { haptic } from '../../platform/haptics';
import { makeStyles } from '../theme/ThemeProvider';
import { radii, space } from '../theme/tokens';
import { Text } from './Text';
import { Touchable } from './Touchable';

export interface Segment<T extends string> {
  value: T;
  label: string;
}

export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  label,
}: {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  const styles = useStyles();
  return (
    <View style={styles.track} accessibilityRole="tablist" accessibilityLabel={label}>
      {segments.map((s) => {
        const selected = s.value === value;
        return (
          <Touchable
            key={s.value}
            feedback={false}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => {
              haptic('select');
              onChange(s.value);
            }}
            style={[styles.segment, selected ? styles.selected : null]}
          >
            <Text
              variant="callout"
              color={selected ? 'textPrimary' : 'textSecondary'}
              align="center"
            >
              {s.label}
            </Text>
          </Touchable>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles((c) =>
  StyleSheet.create({
    track: {
      flexDirection: 'row',
      backgroundColor: c.sunken,
      borderRadius: radii.sm,
      padding: space.xxs,
    },
    segment: {
      flex: 1,
      borderRadius: radii.sm - 2,
      alignItems: 'center',
      paddingHorizontal: space.s,
    },
    selected: {
      backgroundColor: c.raised,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.hairline,
    },
  }),
);
