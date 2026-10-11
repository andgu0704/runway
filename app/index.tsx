import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { economy } from '../src/engine';
import { loadContent } from '../src/content/runtime';
import { useGame, gameStore } from '../src/store/game';
import { Button } from '../src/ui/components/Button';
import { ConfirmSheet } from '../src/ui/components/ConfirmSheet';
import { Chip } from '../src/ui/components/Chip';
import { Icon } from '../src/ui/components/Icon';
import { IconBadge } from '../src/ui/components/IconBadge';
import { Screen } from '../src/ui/components/Screen';
import { ErrorState } from '../src/ui/components/States';
import { Card } from '../src/ui/components/Surface';
import { Text } from '../src/ui/components/Text';
import { Touchable } from '../src/ui/components/Touchable';
import { lookFor } from '../src/ui/game/characterArt';
import { OfficeScene, type SceneModel } from '../src/ui/game/OfficeScene';
import { useText } from '../src/ui/i18n';
import { makeStyles } from '../src/ui/theme/ThemeProvider';
import { gutter, space } from '../src/ui/theme/tokens';

/** A garage that is just getting going, drawn behind the title. */
const TITLE_SCENE: SceneModel = {
  stage: 'garage',
  month: 0,
  launched: false,
  people: [
    { id: 'a', look: lookFor('Alex Doe', 'founder'), mood: 1 },
    { id: 'b', look: lookFor('Priya Raman', 'people'), mood: 1 },
    { id: 'c', look: lookFor('Sam Okafor', 'product'), mood: 1 },
  ],
};

export default function Title() {
  const styles = useStyles();
  const { t, money } = useText();
  const status = useGame((s) => s.status);
  const problem = useGame((s) => s.problem);
  const game = useGame((s) => s.game);
  const [confirming, setConfirming] = useState(false);
  const { width } = useWindowDimensions();

  if (status === 'error') {
    const body =
      problem === 'tooNew'
        ? 'ui.error.loadTooNew'
        : problem === 'corrupt'
          ? 'ui.error.loadCorrupt'
          : 'ui.error.loadUnrecoverable';
    return (
      <Screen scroll={false} contentStyle={styles.center}>
        <ErrorState
          title={t('ui.error.loadTitle')}
          body={t(body)}
          action={{
            label: t('ui.error.startFresh'),
            onPress: () => {
              gameStore.getState().discardRun();
              router.push('/new');
            },
          }}
        />
      </Screen>
    );
  }

  const startNew = () => {
    if (game !== null && game.ending === null) setConfirming(true);
    else router.push('/new');
  };

  return (
    <Screen
      scroll={false}
      footer={
        game === null ? (
          <Button label={t('ui.title.start')} onPress={startNew} />
        ) : (
          <>
            <Button
              label={t(game.ending === null ? 'ui.title.continue' : 'ui.title.seeEnding')}
              onPress={() => {
                router.replace(game.ending === null ? '/feed' : '/ending');
              }}
            />
            <Button label={t('ui.title.newRun')} kind="secondary" onPress={startNew} />
          </>
        )
      }
    >
      <View style={styles.top}>
        <Touchable
          accessibilityLabel={t('ui.title.settings')}
          onPress={() => {
            router.push('/settings');
          }}
          style={styles.settings}
        >
          <Icon name="settings" color="textSecondary" />
        </Touchable>
      </View>
      <View
        style={styles.scene}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <OfficeScene model={TITLE_SCENE} width={width} fadeTop />
      </View>
      <View style={styles.masthead}>
        <Text variant="display" style={styles.wordmark} accessibilityRole="header">
          {t('ui.title.wordmark')}
        </Text>
        <Text variant="body" color="textSecondary" style={styles.tagline}>
          {t('ui.title.tagline')}
        </Text>
      </View>
      {game !== null ? (
        <Card style={styles.card}>
          <View style={styles.cardHead}>
            <IconBadge icon="company" color="product" />
            <View style={styles.cardText}>
              <Text variant="headline">{game.setup.companyName}</Text>
              <Text variant="footnote" color="textSecondary">
                {game.ending === null
                  ? t('ui.title.continueMetaShort', { stage: game.stage, month: game.month + 1 })
                  : t('ui.title.endedMeta', { month: game.ending.month + 1 })}
              </Text>
            </View>
          </View>
          {game.ending === null ? (
            <View style={styles.chips}>
              <Chip label={money(game.stats.cash)} tone="money" icon="money" />
              <Chip
                label={t('ui.runway.months', {
                  count: Math.floor(Math.min(99, economy.runwayMonths(game, loadContent()))),
                })}
                icon="clock"
              />
            </View>
          ) : null}
        </Card>
      ) : null}
      <ConfirmSheet
        visible={confirming}
        title={t('ui.title.confirmTitle')}
        body={t('ui.title.confirmBody')}
        confirmLabel={t('ui.title.confirmAction')}
        cancelLabel={t('ui.title.cancel')}
        destructive
        onCancel={() => {
          setConfirming(false);
        }}
        onConfirm={() => {
          setConfirming(false);
          gameStore.getState().discardRun();
          router.push('/new');
        }}
      />
    </Screen>
  );
}

const useStyles = makeStyles((c) =>
  StyleSheet.create({
    center: { justifyContent: 'center' },
    top: { flexDirection: 'row', justifyContent: 'flex-end' },
    settings: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.surface,
      alignItems: 'center',
      borderWidth: 2.5,
      borderBottomWidth: 4,
      borderColor: c.ink,
    },
    scene: { marginHorizontal: -gutter, marginTop: space.s },
    masthead: { marginTop: space.l, gap: space.s, alignItems: 'center' },
    wordmark: { fontSize: 60, lineHeight: 66 },
    tagline: { maxWidth: 320, textAlign: 'center' },
    card: { marginTop: space.xxl, gap: space.m },
    cardHead: { flexDirection: 'row', alignItems: 'center', gap: space.m },
    cardText: { flex: 1, gap: 2 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  }),
);
