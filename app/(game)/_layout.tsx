import { Redirect, Tabs, router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ActionSheetHost } from '../../src/ui/game/actions/ActionSheetHost';
import { EventSheet } from '../../src/ui/game/EventSheet';
import { GameTabBar } from '../../src/ui/game/GameTabBar';
import { StatBar } from '../../src/ui/game/StatBar';
import { TurnBar } from '../../src/ui/game/TurnBar';
import { useRun } from '../../src/ui/hooks/useRun';
import { useTheme } from '../../src/ui/theme/ThemeProvider';
import { ToastHost } from '../../src/ui/toast';

export default function GameLayout() {
  const run = useRun();
  const { colors } = useTheme();
  const [eventOpen, setEventOpen] = useState(false);
  const game = run === null ? null : run.game;
  const pendingKey = game?.pendingEvent == null ? null : `${game.month}:${game.pendingEvent.event}`;
  const negotiating = game !== null && game.negotiation !== null;
  const ended = game !== null && game.ending !== null;
  const wasNegotiating = useRef(negotiating);

  useEffect(() => {
    if (pendingKey !== null) setEventOpen(true);
  }, [pendingKey]);

  useEffect(() => {
    if (negotiating && !wasNegotiating.current) router.push('/negotiation');
    wasNegotiating.current = negotiating;
  }, [negotiating]);

  useEffect(() => {
    if (!ended) return;
    const timer = setTimeout(() => {
      router.replace('/ending');
    }, 900);
    return () => {
      clearTimeout(timer);
    };
  }, [ended]);

  if (run === null) return <Redirect href="/" />;
  const { dispatch } = run;
  const current = run.game;

  return (
    <View style={[styles.root, { backgroundColor: colors.canvas }]}>
      <StatBar game={current} />
      <Tabs
        screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.canvas } }}
        tabBar={(props) => (
          <GameTabBar
            {...props}
            top={
              <TurnBar
                game={current}
                onEndTurn={() => dispatch({ type: 'endTurn' })}
                onRespond={() => {
                  setEventOpen(true);
                }}
              />
            }
          />
        )}
      >
        <Tabs.Screen name="feed" />
        <Tabs.Screen name="product" />
        <Tabs.Screen name="people" />
        <Tabs.Screen name="money" />
        <Tabs.Screen name="world" />
        <Tabs.Screen name="company" />
      </Tabs>
      <EventSheet
        game={current}
        visible={eventOpen && current.pendingEvent !== null}
        onDismiss={() => {
          setEventOpen(false);
        }}
        onChoose={(option) => {
          if (dispatch({ type: 'resolveEvent', option })) setEventOpen(false);
        }}
      />
      <ActionSheetHost
        game={current}
        onPerform={(action, params) => dispatch({ type: 'performAction', action, params })}
      />
      <ToastHost />
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
