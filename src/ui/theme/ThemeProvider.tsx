import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useSettings } from '../../store/settings';
import { palettes, type Palette, type Scheme } from './tokens';

export interface Theme {
  scheme: Scheme;
  colors: Palette;
  reduceMotion: boolean;
}

const ThemeContext = createContext<Theme>({
  scheme: 'light',
  colors: palettes.light,
  reduceMotion: false,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const preference = useSettings((s) => s.theme);
  const motion = useSettings((s) => s.motion);
  const systemReduced = useReducedMotion();
  const scheme: Scheme =
    preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;
  const reduceMotion = motion === 'system' ? systemReduced : motion === 'reduced';
  const value = useMemo(
    () => ({ scheme, colors: palettes[scheme], reduceMotion }),
    [scheme, reduceMotion],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

/** Builds a style hook whose styles are recomputed only when the colour scheme changes. */
export function makeStyles<T>(factory: (colors: Palette) => T): () => T {
  const cache = new Map<Scheme, T>();
  return function useStyles() {
    const { scheme, colors } = useTheme();
    let styles = cache.get(scheme);
    if (styles === undefined) {
      styles = factory(colors);
      cache.set(scheme, styles);
    }
    return styles;
  };
}
