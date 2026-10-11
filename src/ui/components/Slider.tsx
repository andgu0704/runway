import { useRef, useState } from 'react';
import { PanResponder, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { haptic } from '../../platform/haptics';
import { makeStyles } from '../theme/ThemeProvider';
import { minTouch, radii } from '../theme/tokens';

export interface SliderProps {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  label: string;
  valueText: string;
}

const THUMB = 28;

/** A stepped slider with a 44pt touch row and screen-reader increment and decrement. */
export function Slider({ value, min, max, step, onChange, label, valueText }: SliderProps) {
  const styles = useStyles();
  const [width, setWidth] = useState(0);
  const latest = useRef({ value, width, min, max, step, onChange });
  latest.current = { value, width, min, max, step, onChange };

  const snap = (raw: number) => {
    const { min: lo, max: hi, step: s } = latest.current;
    const clamped = Math.min(hi, Math.max(lo, raw));
    return Math.round((clamped - lo) / s) * s + lo;
  };
  const setFromX = (x: number) => {
    const { width: w, min: lo, max: hi } = latest.current;
    if (w <= 0) return;
    const next = snap(lo + ((x - THUMB / 2) / (w - THUMB)) * (hi - lo));
    if (next !== latest.current.value) {
      haptic('select');
      latest.current.onChange(next);
    }
  };

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => {
        setFromX(e.nativeEvent.locationX);
      },
      onPanResponderMove: (e) => {
        setFromX(e.nativeEvent.locationX);
      },
    }),
  ).current;

  const fraction = max === min ? 0 : (value - min) / (max - min);
  const left = fraction * Math.max(0, width - THUMB);

  return (
    <View
      style={styles.row}
      onLayout={(e: LayoutChangeEvent) => {
        setWidth(e.nativeEvent.layout.width);
      }}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ text: valueText }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => {
        onChange(snap(value + (e.nativeEvent.actionName === 'increment' ? step : -step)));
      }}
      {...responder.panHandlers}
    >
      <View style={styles.track} pointerEvents="none">
        <View style={[styles.fill, { width: left + THUMB / 2 }]} />
      </View>
      <View style={[styles.thumb, { left }]} pointerEvents="none" />
    </View>
  );
}

const useStyles = makeStyles((c) =>
  StyleSheet.create({
    row: { height: minTouch, justifyContent: 'center' },
    track: { height: 4, borderRadius: radii.full, backgroundColor: c.sunken, overflow: 'hidden' },
    fill: { height: 4, backgroundColor: c.accent },
    thumb: {
      position: 'absolute',
      width: THUMB,
      height: THUMB,
      borderRadius: THUMB / 2,
      backgroundColor: c.raised,
      borderWidth: 1,
      borderColor: c.hairline,
      shadowColor: c.shadow,
      shadowOpacity: 0.18,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
  }),
);
