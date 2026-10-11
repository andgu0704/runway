import { StyleSheet, View } from 'react-native';
import { CHARACTER_IDS } from '../../src/content/schema/ids';
import { Chip } from '../../src/ui/components/Chip';
import { IconBadge } from '../../src/ui/components/IconBadge';
import { Card, SectionHeader } from '../../src/ui/components/Surface';
import { TabPage } from '../../src/ui/components/TabPage';
import { Text } from '../../src/ui/components/Text';
import { ActionList } from '../../src/ui/game/actions/ActionList';
import { CharacterCard } from '../../src/ui/game/CharacterCard';
import { useRun } from '../../src/ui/hooks/useRun';
import { useText } from '../../src/ui/i18n';
import { makeStyles } from '../../src/ui/theme/ThemeProvider';
import { radii, space } from '../../src/ui/theme/tokens';

type RivalMood = 'calm' | 'watching' | 'circling' | 'attacking';

function rivalMood(threat: number): RivalMood {
  if (threat < 30) return 'calm';
  if (threat < 55) return 'watching';
  if (threat < 80) return 'circling';
  return 'attacking';
}

const MOOD_TONE = { calm: 'up', watching: 'neutral', circling: 'warn', attacking: 'down' } as const;

export default function World() {
  const run = useRun();
  const styles = useStyles();
  const { t } = useText();
  if (run === null) return null;
  const { game, content } = run;
  const characters = CHARACTER_IDS.filter((id) => id !== 'cofounder' || game.cofounderPresent);
  const mood = rivalMood(game.meters.rivalThreat);

  return (
    <TabPage title={t('ui.tab.world')}>
      <Card style={[styles.rival, styles.first]}>
        <IconBadge icon="target" color="company" size={48} />
        <View style={styles.flex}>
          <Text variant="label" color="textTertiary">
            {t('ui.world.rival')}
          </Text>
          <Text variant="title2">{content.markets.get(game.setup.market)?.rivalCompany ?? ''}</Text>
          <Text variant="footnote" color="textSecondary">
            {t(`ui.world.rivalMood.${mood}`)}
          </Text>
        </View>
        <Chip label={t(`ui.world.rivalLevel.${mood}`)} tone={MOOD_TONE[mood]} />
      </Card>

      <SectionHeader title={t('ui.world.people')} />
      {characters.map((id) => (
        <CharacterCard key={id} game={game} id={id} />
      ))}

      <SectionHeader title={t('ui.world.moves')} />
      <ActionList game={game} content={content} tab="world" only={(_id, shady) => !shady} />

      <View style={styles.shady}>
        <View style={styles.shadyHead}>
          <IconBadge icon="warning" color="warn" size={36} />
          <View style={styles.flex}>
            <Text variant="title2">{t('ui.world.shadyTitle')}</Text>
            <Text variant="footnote" color="textSecondary">
              {t('ui.world.shadyBody')}
            </Text>
          </View>
        </View>
        <ActionList game={game} content={content} tab="world" only={(_id, shady) => shady} />
      </View>
    </TabPage>
  );
}

const useStyles = makeStyles((c) =>
  StyleSheet.create({
    first: { marginTop: space.l },
    rival: { flexDirection: 'row', alignItems: 'center', gap: space.m },
    flex: { flex: 1, gap: 2 },
    shady: {
      marginTop: space.xxl,
      padding: space.m,
      gap: space.m,
      borderRadius: radii.xl,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: `${c.warn}66`,
    },
    shadyHead: { flexDirection: 'row', alignItems: 'center', gap: space.m },
  }),
);
