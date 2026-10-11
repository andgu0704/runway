import { StyleSheet, View } from 'react-native';
import { CHARACTER_IDS } from '../../src/content/schema/ids';
import { SectionHeader } from '../../src/ui/components/Surface';
import { TabPage } from '../../src/ui/components/TabPage';
import { Text } from '../../src/ui/components/Text';
import { ActionList } from '../../src/ui/game/actions/ActionList';
import { CharacterCard } from '../../src/ui/game/CharacterCard';
import { useRun } from '../../src/ui/hooks/useRun';
import { useText } from '../../src/ui/i18n';
import { makeStyles } from '../../src/ui/theme/ThemeProvider';
import { radii, space } from '../../src/ui/theme/tokens';

function rivalMood(threat: number): 'calm' | 'watching' | 'circling' | 'attacking' {
  if (threat < 30) return 'calm';
  if (threat < 55) return 'watching';
  if (threat < 80) return 'circling';
  return 'attacking';
}

export default function World() {
  const run = useRun();
  const styles = useStyles();
  const { t } = useText();
  if (run === null) return null;
  const { game, content } = run;
  const characters = CHARACTER_IDS.filter((id) => id !== 'cofounder' || game.cofounderPresent);

  return (
    <TabPage title={t('ui.tab.world')}>
      <SectionHeader title={t('ui.world.rival')} />
      <Text variant="title2">{content.markets.get(game.setup.market)?.rivalCompany ?? ''}</Text>
      <Text variant="body" color="textSecondary">
        {t(`ui.world.rivalMood.${rivalMood(game.meters.rivalThreat)}`)}
      </Text>

      <SectionHeader title={t('ui.world.people')} />
      {characters.map((id) => (
        <CharacterCard key={id} game={game} id={id} />
      ))}

      <SectionHeader title={t('ui.world.moves')} />
      <ActionList game={game} content={content} tab="world" only={(_id, shady) => !shady} />

      <View style={styles.shady}>
        <Text variant="title2" color="textSecondary">
          {t('ui.world.shadyTitle')}
        </Text>
        <Text variant="footnote" color="textTertiary">
          {t('ui.world.shadyBody')}
        </Text>
        <ActionList game={game} content={content} tab="world" only={(_id, shady) => shady} />
      </View>
    </TabPage>
  );
}

const useStyles = makeStyles((c) =>
  StyleSheet.create({
    shady: {
      marginTop: space.x3,
      padding: space.l,
      gap: space.xs,
      borderRadius: radii.md,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: c.hairline,
      backgroundColor: c.sunken,
    },
  }),
);
