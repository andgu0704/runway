import { StyleSheet, View } from 'react-native';
import type { Candidate, Employee } from '../../engine';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { Chip } from '../components/Chip';
import { Icon } from '../components/Icon';
import { Text } from '../components/Text';
import { Touchable } from '../components/Touchable';
import { useText } from '../i18n';
import { makeStyles, useTheme } from '../theme/ThemeProvider';
import { cardShadow, radii, space } from '../theme/tokens';
import { ageFor, outfitFor } from './characterArt';
import { roleColor } from './visuals';

export function SkillDots({ skill }: { skill: number }) {
  const styles = useStyles();
  const { t } = useText();
  return (
    <View style={styles.dots} accessible accessibilityLabel={t('ui.people.skill', { skill })}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon
          key={i}
          name="star"
          size={13}
          filled={i <= skill}
          color={i <= skill ? 'people' : 'textTertiary'}
        />
      ))}
    </View>
  );
}

export function TraitChips({ traits, revealed }: { traits: string[]; revealed: string[] }) {
  const styles = useStyles();
  const { t } = useText();
  const hidden = traits.length - revealed.length;
  return (
    <View style={styles.chips}>
      {revealed.map((id) => (
        <Chip key={id} label={t(`trait.${id}.name`)} tone="people" />
      ))}
      {hidden > 0 ? (
        <Chip label={t('ui.people.unknownTraits', { count: hidden })} icon="info" />
      ) : null}
    </View>
  );
}

const MOOD_TONE = { happy: 'up', fine: 'neutral', restless: 'warn', unhappy: 'down' } as const;

export function EmployeeRow({
  employee,
  onPress,
  morale,
}: {
  employee: Employee;
  onPress: () => void;
  morale: number;
}) {
  const styles = useStyles();
  const { scheme } = useTheme();
  const { t } = useText();
  const mood = morale + employee.mood;
  const moodKey = mood >= 70 ? 'happy' : mood >= 45 ? 'fine' : mood >= 25 ? 'restless' : 'unhappy';
  return (
    <Touchable
      onPress={onPress}
      style={[styles.row, cardShadow(scheme)]}
      accessibilityLabel={`${employee.name}, ${t(`role.${employee.role}.name`)}, ${t(`ui.people.mood.${moodKey}`)}`}
    >
      <View style={styles.rowInner}>
        <Avatar
          name={employee.name}
          color={roleColor(employee.role)}
          outfit={outfitFor(employee.role)}
          age={ageFor(employee.role, employee.name)}
        />
        <View style={styles.rowText}>
          <Text variant="headline">{employee.name}</Text>
          <Text variant="footnote" color="textSecondary">
            {t(`role.${employee.role}.name`)}
          </Text>
        </View>
        <View style={styles.rowRight}>
          <Chip label={t(`ui.people.mood.${moodKey}`)} tone={MOOD_TONE[moodKey]} />
          <SkillDots skill={employee.skill} />
        </View>
        <Icon name="next" size={16} color="textTertiary" />
      </View>
    </Touchable>
  );
}

export function CandidateCard({
  candidate,
  onHire,
  canHire,
}: {
  candidate: Candidate;
  onHire: () => void;
  canHire: boolean;
}) {
  const styles = useStyles();
  const { scheme } = useTheme();
  const { t, money, percent } = useText();
  return (
    <View style={[styles.card, cardShadow(scheme)]}>
      <View style={styles.cardHead}>
        <Avatar
          name={candidate.name}
          color={roleColor(candidate.role)}
          outfit={outfitFor(candidate.role)}
          age={ageFor(candidate.role, candidate.name)}
          size={52}
        />
        <View style={styles.rowText}>
          <Text variant="headline">{candidate.name}</Text>
          <Text variant="footnote" color="textSecondary">
            {t(`role.${candidate.role}.name`)}
          </Text>
          <SkillDots skill={candidate.skill} />
        </View>
      </View>
      <View style={styles.chips}>
        <Chip label={t('ui.people.salaryChip', { salary: money(candidate.salary) })} tone="money" />
        <Chip label={t('ui.people.equityChip', { equity: percent(candidate.equityBps) })} />
      </View>
      <TraitChips traits={candidate.traits} revealed={candidate.revealed} />
      <Button
        label={t('ui.people.makeOffer')}
        onPress={onHire}
        disabled={!canHire}
        icon="userPlus"
      />
    </View>
  );
}

const useStyles = makeStyles((c) =>
  StyleSheet.create({
    dots: { flexDirection: 'row', gap: 1 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
    row: {
      backgroundColor: c.surface,
      borderRadius: radii.lg,
      padding: space.m,
      marginBottom: space.s,
    },
    rowInner: { flexDirection: 'row', alignItems: 'center', gap: space.m },
    rowText: { flex: 1, gap: 3 },
    rowRight: { alignItems: 'flex-end', gap: space.xs },
    card: {
      width: 284,
      backgroundColor: c.surface,
      borderRadius: radii.xl,
      padding: space.l,
      gap: space.m,
    },
    cardHead: { flexDirection: 'row', alignItems: 'center', gap: space.m },
  }),
);
