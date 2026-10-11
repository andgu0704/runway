import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { bpsFor, impliedPreMoney, type FundingRound, type Reaction } from '../src/engine';
import { useGame } from '../src/store/game';
import { Button } from '../src/ui/components/Button';
import { Chip } from '../src/ui/components/Chip';
import { Icon } from '../src/ui/components/Icon';
import { IconBadge } from '../src/ui/components/IconBadge';
import { KeyValue } from '../src/ui/components/KeyValue';
import { Screen } from '../src/ui/components/Screen';
import { Slider } from '../src/ui/components/Slider';
import { Card, SectionHeader } from '../src/ui/components/Surface';
import { Text } from '../src/ui/components/Text';
import { Touchable } from '../src/ui/components/Touchable';
import { useRun } from '../src/ui/hooks/useRun';
import { useText } from '../src/ui/i18n';
import { makeStyles } from '../src/ui/theme/ThemeProvider';
import { radii, space } from '../src/ui/theme/tokens';
import { ToastHost } from '../src/ui/toast';

const REACTIONS: Reaction[] = ['insulted', 'cool', 'interested', 'keen', 'eager'];

function roundStep(value: number): number {
  return value >= 2_000_000 ? 250_000 : value >= 500_000 ? 50_000 : 5_000;
}

/** The term-sheet table: set amount and equity, read the investor, then push or settle. */
export default function Negotiation() {
  const run = useRun();
  const styles = useStyles();
  const { t, money, percent } = useText();
  const signals = useGame((s) => s.lastSignals);
  const negotiation = run?.game.negotiation ?? null;
  const investor =
    negotiation === null ? undefined : run?.content.investors.get(negotiation.investor);
  const [amount, setAmount] = useState(negotiation?.offer.amount ?? 0);
  const [bps, setBps] = useState(negotiation?.offer.bps ?? 1000);
  const roundsBefore = useRef(run?.game.rounds.length ?? 0);
  const investorId = useRef(negotiation?.investor ?? '');

  useEffect(() => {
    if (negotiation !== null) {
      setAmount(negotiation.offer.amount);
      setBps(negotiation.offer.bps);
    }
  }, [negotiation?.investor]);

  if (run === null) return null;
  const { game, dispatch } = run;

  if (negotiation === null || investor === undefined) {
    const closed = game.rounds.length > roundsBefore.current && signals.includes('dealClosed');
    const round: FundingRound | undefined = game.rounds[game.rounds.length - 1];
    return (
      <Screen
        scroll={false}
        footer={
          <Button
            label={t('ui.negotiation.done')}
            onPress={() => {
              router.back();
            }}
          />
        }
        contentStyle={styles.center}
      >
        <Text variant="label" color={closed ? 'up' : 'textTertiary'} align="center">
          {t(closed ? 'ui.negotiation.closedKicker' : 'ui.negotiation.overKicker')}
        </Text>
        <Text variant="title1" align="center">
          {closed && round !== undefined
            ? t('ui.negotiation.closedTitle', { amount: money(round.amount) })
            : t('ui.negotiation.overTitle', { investor: investorId.current })}
        </Text>
        {closed && round !== undefined ? (
          <Text variant="body" color="textSecondary" align="center">
            {t('ui.negotiation.closedBody', {
              equity: percent(round.bps),
              pre: money(round.preMoney),
            })}
          </Text>
        ) : null}
      </Screen>
    );
  }

  const step = roundStep(investor.maxCheck);
  const minAmount = Math.max(step, Math.floor(investor.minCheck / 2 / step) * step);
  const maxAmount = Math.ceil((investor.maxCheck * 1.5) / step) * step;
  const pre = impliedPreMoney({ amount, bps });
  const offerPre = impliedPreMoney(negotiation.offer);
  const founderAfter = Math.round(
    ((game.capTable.find((e) => e.holder === 'founder')?.bps ?? 0) * (10_000 - bps)) / 10_000,
  );
  const signTerms =
    negotiation.acceptable && negotiation.lastProposal !== null
      ? negotiation.lastProposal
      : negotiation.offer;

  return (
    <Screen
      footer={
        <>
          {negotiation.acceptable ? (
            <Button
              label={t('ui.negotiation.sign')}
              detail={`${money(signTerms.amount)} · ${percent(signTerms.bps)}`}
              onPress={() => dispatch({ type: 'negotiate', move: { type: 'settle' } })}
            />
          ) : (
            <Button
              label={t('ui.negotiation.propose')}
              onPress={() =>
                dispatch({ type: 'negotiate', move: { type: 'propose', amount, bps } })
              }
            />
          )}
          <View style={styles.row}>
            <View style={styles.flex}>
              <Button
                kind="secondary"
                label={
                  negotiation.acceptable
                    ? t('ui.negotiation.propose')
                    : t('ui.negotiation.acceptTheirs')
                }
                onPress={() =>
                  negotiation.acceptable
                    ? dispatch({ type: 'negotiate', move: { type: 'propose', amount, bps } })
                    : dispatch({ type: 'negotiate', move: { type: 'settle' } })
                }
              />
            </View>
            <Button
              kind="tertiary"
              label={t('ui.negotiation.walk')}
              onPress={() => dispatch({ type: 'negotiate', move: { type: 'walkAway' } })}
            />
          </View>
        </>
      }
    >
      <View style={styles.top}>
        <Text variant="label" color="accent">
          {t('ui.negotiation.kicker')}
        </Text>
        <Touchable
          accessibilityLabel={t('ui.negotiation.close')}
          onPress={() => {
            router.back();
          }}
          style={styles.close}
        >
          <Icon name="close" color="textSecondary" />
        </Touchable>
      </View>
      <View style={styles.investor}>
        <IconBadge icon="handshake" color="money" size={48} />
        <Text variant="title1" style={styles.flex}>
          {t(`investor.${investor.id}.name`)}
        </Text>
      </View>
      <Text variant="callout" color="textSecondary">
        {t(`investor.${investor.id}.blurb`)}
      </Text>
      <View
        style={styles.patience}
        accessible
        accessibilityLabel={t('ui.negotiation.patienceA11y', { count: negotiation.patience })}
      >
        <Text variant="footnote" color="textTertiary">
          {t('ui.negotiation.patience')}
        </Text>
        {Array.from({ length: Math.max(0, negotiation.patience) }, (_, i) => (
          <View key={i} style={styles.patienceDot} />
        ))}
      </View>

      <View
        style={styles.reactions}
        accessible
        accessibilityLabel={
          negotiation.lastReaction === null
            ? t('ui.negotiation.noReaction')
            : t(`ui.negotiation.reactionName.${negotiation.lastReaction}`)
        }
      >
        {REACTIONS.map((r) => (
          <View
            key={r}
            style={[styles.reaction, negotiation.lastReaction === r ? styles.reactionOn : null]}
          >
            <Text
              variant="footnote"
              color={negotiation.lastReaction === r ? 'onAccent' : 'textTertiary'}
              align="center"
              numberOfLines={1}
            >
              {t(`ui.negotiation.reactionName.${r}`)}
            </Text>
          </View>
        ))}
      </View>
      <Text variant="bodySerif">
        {negotiation.lastReaction === null
          ? t('ui.negotiation.opening', { investor: investor.id })
          : t(`ui.negotiation.reaction.${negotiation.lastReaction}`, { investor: investor.id })}
      </Text>

      <SectionHeader title={t('ui.negotiation.theirOffer')} />
      <Card style={styles.gap}>
        <KeyValue label={t('ui.negotiation.amount')} value={money(negotiation.offer.amount)} />
        <KeyValue label={t('ui.negotiation.equity')} value={percent(negotiation.offer.bps)} />
        <KeyValue label={t('ui.negotiation.preMoney')} value={money(offerPre)} />
        {negotiation.offer.boardSeat ? (
          <Chip label={t('ui.negotiation.boardSeat')} tone="warn" />
        ) : null}
        {negotiation.offer.boardSeat ? (
          <Button
            kind="tertiary"
            label={t('ui.negotiation.pushSeat')}
            onPress={() =>
              dispatch({ type: 'negotiate', move: { type: 'push', target: 'boardSeat' } })
            }
          />
        ) : null}
        <Button
          kind="tertiary"
          label={t('ui.negotiation.pushValuation')}
          onPress={() =>
            dispatch({ type: 'negotiate', move: { type: 'push', target: 'valuation' } })
          }
        />
      </Card>

      <SectionHeader title={t('ui.negotiation.yourAsk')} />
      <KeyValue label={t('ui.negotiation.amount')} value={money(amount)} />
      <Slider
        value={amount}
        min={minAmount}
        max={maxAmount}
        step={step}
        onChange={setAmount}
        label={t('ui.negotiation.amount')}
        valueText={money(amount)}
      />
      <KeyValue label={t('ui.negotiation.equity')} value={percent(bps)} />
      <Slider
        value={bps}
        min={100}
        max={4000}
        step={50}
        onChange={setBps}
        label={t('ui.negotiation.equity')}
        valueText={percent(bps)}
      />
      <Text variant="callout" color="textSecondary">
        {t('ui.negotiation.implied', { pre: money(pre), after: percent(founderAfter) })}
      </Text>
      <Button
        kind="tertiary"
        label={t('ui.negotiation.matchValuation')}
        onPress={() => {
          setBps(Math.max(100, Math.min(4000, bpsFor(amount, offerPre))));
        }}
      />
      <ToastHost />
    </Screen>
  );
}

const useStyles = makeStyles((c) =>
  StyleSheet.create({
    center: { justifyContent: 'center', gap: space.m },
    top: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: space.s,
    },
    close: { alignItems: 'center' },
    patience: { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginTop: space.s },
    patienceDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.textSecondary },
    reactions: { flexDirection: 'row', gap: 2, marginTop: space.l, marginBottom: space.s },
    reaction: {
      flex: 1,
      paddingVertical: space.xs,
      borderRadius: radii.xs,
      backgroundColor: c.sunken,
    },
    reactionOn: { backgroundColor: c.accent },
    gap: { gap: space.xs },
    investor: { flexDirection: 'row', alignItems: 'center', gap: space.m },
    row: { flexDirection: 'row', alignItems: 'center', gap: space.s },
    flex: { flex: 1 },
  }),
);
