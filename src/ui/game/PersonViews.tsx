import { StyleSheet, View } from 'react-native';
import type { Candidate, Employee } from '../../engine';
import { Button } from '../components/Button';
import { Chip } from '../components/Chip';
import { Text } from '../components/Text';
import { Touchable } from '../components/Touchable';
import { Icon } from '../components/Icon';
import { useText } from '../i18n';
import { makeStyles } from '../theme/ThemeProvider';
import { radii, space } from '../theme/tokens';

export function SkillDots({ skill }: { skill: number }) {
  const styles = useStyles();
  const { t } = useText();
  return (
    <View style={styles.dots} accessible accessibilityLabel={t('ui.people.skill', { skill })}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={[styles.dot, i <= skill ? styles.dotOn : null]} />
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
        <Chip key={id} label={t(`trait.${id}.name`)} />
      ))}
      {hidden > 0 ? (
        <Chip label={t('ui.people.unknownTraits', { count: hidden })} tone="warn" />
      ) : null}
    </View>
  );
}

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
  const { t } = useText();
  const mood = morale + employee.mood;
  const moodKey = mood >= 70 ? 'happy' : mood >= 45 ? 'fine' : mood >= 25 ? 'restless' : 'unhappy';
  return (
    <Touchable
      onPress={onPress}
      style={styles.row}
      accessibilityLabel={`${employee.name}, ${t(`role.${employee.role}.name`)}, ${t(`ui.people.mood.${moodKey}`)}`}
    >
      <View style={styles.rowInner}>
        <View style={styles.rowText}>
          <Text variant="headline">{employee.name}</Text>
          <Text variant="footnote" color="textSecondary">
            {`${t(`role.${employee.role}.name`)} · ${t(`ui.people.mood.${moodKey}`)}`}
          </Text>
        </View>
        <SkillDots skill={employee.skill} />
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
  const { t, money, percent } = useText();
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <View style={styles.rowText}>
          <Text variant="label" color="accent">
            {t(`role.${candidate.role}.name`)}
          </Text>
          <Text variant="title2">{candidate.name}</Text>
        </View>
        <SkillDots skill={candidate.skill} />
      </View>
      <Text variant="figureS" color="textSecondary">
        {t('ui.people.ask', {
          salary: money(candidate.salary),
          equity: percent(candidate.equityBps),
        })}
      </Text>
      <TraitChips traits={candidate.traits} revealed={candidate.revealed} />
      <Button
        kind="secondary"
        label={t('ui.people.makeOffer')}
        onPress={onHire}
        disabled={!canHire}
      />
    </View>
  );
}

const useStyles = makeStyles((c) =>
  StyleSheet.create({
    dots: { flexDirection: 'row', gap: 3 },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: c.sunken,
      borderWidth: 1,
      borderColor: c.hairline,
    },
    dotOn: { backgroundColor: c.textSecondary, borderColor: c.textSecondary },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
    row: {
      paddingVertical: space.m,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.hairline,
    },
    rowInner: { flexDirection: 'row', alignItems: 'center', gap: space.m },
    rowText: { flex: 1, gap: 2 },
    card: {
      width: 280,
      backgroundColor: c.surface,
      borderRadius: radii.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.hairline,
      padding: space.l,
      gap: space.s,
    },
    cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: space.m },
  }),
);
