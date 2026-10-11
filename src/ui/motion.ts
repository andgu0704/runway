import type { EntryOrExitLayoutType } from 'react-native-reanimated';

/** Layout animation props that disappear entirely when motion is reduced. */
export function layoutMotion(
  reduce: boolean,
  entering?: EntryOrExitLayoutType,
  exiting?: EntryOrExitLayoutType,
): { entering?: EntryOrExitLayoutType; exiting?: EntryOrExitLayoutType } {
  if (reduce) return {};
  return {
    ...(entering === undefined ? {} : { entering }),
    ...(exiting === undefined ? {} : { exiting }),
  };
}
