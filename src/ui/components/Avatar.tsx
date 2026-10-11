import { View } from 'react-native';
import Svg, { ClipPath, Defs, Circle as SvgCircle, G } from 'react-native-svg';
import { Bust, lookFor, type Age, type Outfit, type Shirt } from '../game/characterArt';
import { useTheme } from '../theme/ThemeProvider';
import type { ColorName } from '../theme/tokens';

const SHIRT_FOR: Partial<Record<ColorName, Shirt>> = {
  product: 'product',
  people: 'people',
  money: 'money',
  world: 'world',
  company: 'company',
};

/** An illustrated portrait in a round frame; the same name always draws the same face. */
export function Avatar({
  name,
  color,
  size = 44,
  mood = 1,
  seed,
  outfit,
  age,
}: {
  name: string;
  /** What decides the face; defaults to the name. Use the person's id where there is one. */
  seed?: string;
  outfit?: Outfit;
  age?: Age;
  color: ColorName;
  size?: number;
  mood?: number;
}) {
  const { colors, scheme } = useTheme();
  const look = lookFor(seed ?? name, SHIRT_FOR[color] ?? 'founder', outfit, age);
  const clip = `clip-${String(size)}`;
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: `${colors[color]}${scheme === 'dark' ? '55' : '33'}`,
        borderWidth: 2,
        borderColor: colors.ink,
        overflow: 'hidden',
      }}
    >
      <Svg width={size - 4} height={size - 4} viewBox="14 12 72 72">
        <Defs>
          <ClipPath id={clip}>
            <SvgCircle cx={50} cy={48} r={36} />
          </ClipPath>
        </Defs>
        <G clipPath={`url(#${clip})`}>
          <G transform="translate(0,4)">
            <Bust look={look} mood={mood} />
          </G>
        </G>
      </Svg>
    </View>
  );
}
