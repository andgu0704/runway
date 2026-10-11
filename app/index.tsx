import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { economy } from '../src/engine';
import { loadContent } from '../src/content/runtime';
import { useGame, gameStore } from '../src/store/game';
import { Button } from '../src/ui/components/Button';
import { ConfirmSheet } from '../src/ui/components/ConfirmSheet';
import { Icon } from '../src/ui/components/Icon';
import { Screen } from '../src/ui/components/Screen';
import { ErrorState } from '../src/ui/components/States';
import { Card } from '../src/ui/components/Surface';
import { Text } from '../src/ui/components/Text';
import { Touchable } from '../src/ui/components/Touchable';
import { useText } from '../src/ui/i18n';
import { makeStyles } from '../src/ui/theme/ThemeProvider';
import { space } from '../src/ui/theme/tokens';

export default function Title() {
  const styles = useStyles();
  const { t, money } = useText();
  const status = useGame((s) => s.status);
  const problem = useGame((s) => s.problem);
  const game = useGame((s) => s.game);
  const [confirming, setConfirming] = useState(false);

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
      <View style={styles.masthead}>
        <View style={styles.rule} />
        <Text variant="display" style={styles.wordmark} accessibilityRole="header">
          {t('ui.title.wordmark')}
        </Text>
        <View style={styles.thinRule} />
        <Text variant="bodySerif" color="textSecondary" style={styles.tagline}>
          {t('ui.title.tagline')}
        </Text>
      </View>
      {game !== null ? (
        <Card style={styles.card}>
          <Text variant="title2">{game.setup.companyName}</Text>
          <Text variant="figureS" color="textSecondary">
            {game.ending === null
              ? t('ui.title.continueMeta', {
                  stage: game.stage,
                  month: game.month + 1,
                  cash: money(game.stats.cash),
                })
              : t('ui.title.endedMeta', { month: game.ending.month + 1 })}
          </Text>
          {game.ending === null ? (
            <Text variant="footnote" color="textTertiary">
              {t('ui.runway.months', {
                count: Math.floor(Math.min(99, economy.runwayMonths(game, loadContent()))),
              })}
            </Text>
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
    settings: { alignItems: 'center' },
    masthead: { marginTop: space.x4, gap: space.m },
    rule: { height: 3, backgroundColor: c.rule },
    thinRule: { height: StyleSheet.hairlineWidth, backgroundColor: c.rule },
    wordmark: { fontSize: 56, lineHeight: 60, letterSpacing: -1 },
    tagline: { maxWidth: 320 },
    card: { marginTop: space.x3, gap: space.xs },
  }),
);
