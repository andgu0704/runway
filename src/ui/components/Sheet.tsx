import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
import { useText } from '../i18n';
import { makeStyles, useTheme } from '../theme/ThemeProvider';
import { gutter, motion, radii, space } from '../theme/tokens';

export interface SheetProps {
  visible: boolean;
  onDismiss: () => void;
  children: ReactNode;
  /** Mandatory sheets bounce back instead of closing when swiped. */
  dismissible?: boolean;
  label: string;
  /** Pinned below the scrolling content, in thumb reach. */
  footer?: ReactNode;
}

const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 900;
const OUT = { duration: motion.quick, easing: Easing.in(Easing.cubic) };

/** Bottom sheet sized to its content, with a scrim, swipe-down to dismiss and reduced-motion support. */
export function Sheet({
  visible,
  onDismiss,
  children,
  dismissible = true,
  label,
  footer,
}: SheetProps) {
  const styles = useStyles();
  const { reduceMotion } = useTheme();
  const { t } = useText();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);
  const offset = useSharedValue(height);
  const scrim = useSharedValue(0);

  const wanted = useRef(visible);
  wanted.current = visible;
  const finishHide = useCallback(() => {
    if (!wanted.current) setMounted(false);
  }, []);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      offset.value = height;
      if (reduceMotion) {
        offset.value = withTiming(0, { duration: 1 });
        scrim.value = withTiming(1, { duration: motion.instant });
      } else {
        offset.value = withSpring(0, motion.sheetSpring);
        scrim.value = withTiming(1, { duration: motion.base });
      }
      return;
    }
    if (!mounted) return;
    scrim.value = withTiming(0, OUT);
    offset.value = withTiming(height, reduceMotion ? { duration: 1 } : OUT, (done) => {
      if (done === true) scheduleOnRN(finishHide);
    });
    // Only `visible` should start a show or hide; the rest are read at that moment.
  }, [visible]);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      const drag = Math.max(0, e.translationY);
      offset.value = dismissible ? drag : drag * 0.15;
    })
    .onEnd((e) => {
      if (dismissible && (e.translationY > DISMISS_DISTANCE || e.velocityY > DISMISS_VELOCITY)) {
        scheduleOnRN(onDismiss);
      } else {
        offset.value = withSpring(0, motion.sheetSpring);
      }
    });

  const panelStyle = useAnimatedStyle(() => ({ transform: [{ translateY: offset.value }] }));
  const scrimStyle = useAnimatedStyle(() => ({ opacity: scrim.value }));

  if (!mounted) return null;
  return (
    <Modal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={dismissible ? onDismiss : () => undefined}
    >
      <GestureHandlerRootView style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, scrimStyle]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={dismissible ? onDismiss : undefined}
            accessibilityRole="button"
            accessibilityLabel={t('ui.sheet.close')}
            disabled={!dismissible}
          />
        </Animated.View>
        <Animated.View
          style={[styles.panel, { maxHeight: height - insets.top - space.l }, panelStyle]}
          accessibilityViewIsModal
          accessibilityLabel={label}
        >
          <GestureDetector gesture={pan}>
            <View style={styles.handleArea} accessible={false}>
              <View style={styles.handle} />
            </View>
          </GestureDetector>
          <ScrollView
            bounces={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              styles.content,
              { paddingBottom: footer === undefined ? insets.bottom + space.l : space.l },
            ]}
          >
            {children}
          </ScrollView>
          {footer !== undefined ? (
            <View style={[styles.footer, { paddingBottom: insets.bottom + space.m }]}>
              {footer}
            </View>
          ) : null}
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const useStyles = makeStyles((c) =>
  StyleSheet.create({
    root: { flex: 1, justifyContent: 'flex-end' },
    scrim: { backgroundColor: c.scrim },
    panel: {
      backgroundColor: c.raised,
      borderTopLeftRadius: radii.lg,
      borderTopRightRadius: radii.lg,
      shadowColor: c.shadow,
      shadowOpacity: 0.16,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: -4 },
      elevation: 12,
    },
    handleArea: {
      alignItems: 'center',
      paddingTop: space.s,
      paddingBottom: space.xs,
      minHeight: 28,
    },
    handle: { width: 40, height: 5, borderRadius: radii.full, backgroundColor: c.hairline },
    content: { paddingHorizontal: gutter, paddingTop: space.s, gap: space.l },
    footer: {
      paddingHorizontal: gutter,
      paddingTop: space.m,
      gap: space.s,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.hairline,
    },
  }),
);
