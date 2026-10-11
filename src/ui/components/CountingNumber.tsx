import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../theme/ThemeProvider';
import { motion } from '../theme/tokens';
import { Text, type TextProps } from './Text';

export interface CountingNumberProps extends Omit<TextProps, 'children'> {
  value: number;
  format: (value: number) => string;
}

/** Counts from the previous value to the new one; jumps straight there with reduced motion. */
export function CountingNumber({ value, format, ...text }: CountingNumberProps) {
  const { reduceMotion } = useTheme();
  const [shown, setShown] = useState(value);
  const from = useRef(value);

  useEffect(() => {
    const start = from.current;
    from.current = value;
    if (reduceMotion || start === value) {
      setShown(value);
      return;
    }
    const duration = Math.min(
      motion.countMax,
      motion.count + Math.log10(Math.abs(value - start) + 1) * 40,
    );
    const began = Date.now();
    let frame = 0;
    const tick = () => {
      const t = Math.min(1, (Date.now() - began) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(start + (value - start) * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [value, reduceMotion]);

  return (
    <Text {...text} accessibilityLabel={format(value)}>
      {format(shown)}
    </Text>
  );
}
