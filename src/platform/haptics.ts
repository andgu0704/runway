import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export type HapticKind =
  'tap' | 'select' | 'turnEnd' | 'success' | 'warning' | 'disaster' | 'milestone';

let enabled = true;

export function setHapticsEnabled(value: boolean): void {
  enabled = value;
}

/** One place maps meaningful moments to haptic patterns; web has none. */
export function haptic(kind: HapticKind): void {
  if (!enabled || Platform.OS === 'web') return;
  const run = (): Promise<void> => {
    switch (kind) {
      case 'tap':
        return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      case 'select':
        return Haptics.selectionAsync();
      case 'turnEnd':
        return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      case 'milestone':
        return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      case 'success':
        return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      case 'warning':
        return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      case 'disaster':
        return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };
  run().catch(() => undefined);
}
