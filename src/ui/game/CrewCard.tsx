import { StyleSheet, View } from 'react-native';
import Svg from 'react-native-svg';
import { Icon, type IconName } from '../components/Icon';
import { Text } from '../components/Text';
import { Touchable } from '../components/Touchable';
import { makeStyles, useTheme } from '../theme/ThemeProvider';
import { cardShadow, radii, space, type ColorName } from '../theme/tokens';
import { Bust, lookFor, type Shirt } from './characterArt';

export interface CrewCardProps {
  name: string;
  role: string;
  color: ColorName;
  icon: IconName;
  /** 1–5 stars, or null for people without a skill rating (founder, co-founder). */
  skill: number | null;
  mood: number;
  onPress: () => void;
}

const SHIRT_FOR: Partial<Record<ColorName, Shirt>> = {
  product: 'product',
  people: 'people',
  money: 'money',
  world: 'world',
  company: 'company',
};

/** A collectible-style card for one person: portrait, role badge, stars and name. */
export function CrewCard({ name, role, color, icon, skill, mood, onPress }: CrewCardProps) {
  const styles = useStyles();
  const { colors, scheme } = useTheme();
  const look = lookFor(name, SHIRT_FOR[color] ?? 'founder');
  return (
    <Touchable
      onPress={onPress}
      accessibilityLabel={`${name}, ${role}`}
      style={[
        styles.card,
        cardShadow(scheme),
        { backgroundColor: `${colors[color]}${scheme === 'dark' ? '55' : '40'}` },
      ]}
    >
      <View style={styles.top}>
        <View style={styles.stars}>
          {skill === null ? (
            <Icon name="crown" size={14} filled color="people" />
          ) : (
            Array.from({ length: skill }, (_, i) => (
              <Icon key={i} name="star" size={11} filled color="people" />
            ))
          )}
        </View>
        <View style={styles.badge}>
          <Icon name={icon} size={13} filled color={color} />
        </View>
      </View>
      <Svg width={92} height={78} viewBox="0 6 100 98">
        <Bust look={look} mood={mood} />
      </Svg>
      <View style={styles.name}>
        <Text variant="footnote" numberOfLines={1} style={styles.nameText}>
          {name.split(' ')[0]}
        </Text>
      </View>
    </Touchable>
  );
}

const useStyles = makeStyles((c) =>
  StyleSheet.create({
    card: {
      width: 100,
      height: 134,
      borderRadius: radii.md,
      overflow: 'hidden',
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    top: {
      position: 'absolute',
      top: 5,
      left: 6,
      right: 6,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      zIndex: 1,
    },
    stars: { flexDirection: 'row' },
    badge: {
      width: 22,
      height: 22,
      borderRadius: 7,
      backgroundColor: c.surface,
      borderWidth: 1.5,
      borderColor: c.ink,
      alignItems: 'center',
      justifyContent: 'center',
    },
    name: {
      alignSelf: 'stretch',
      backgroundColor: c.surface,
      borderTopWidth: 2,
      borderTopColor: c.ink,
      paddingVertical: 3,
      paddingHorizontal: space.xs,
    },
    nameText: { textAlign: 'center' },
  }),
);
