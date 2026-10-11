import { Stack } from 'expo-router';
import { useTheme } from '../../src/ui/theme/ThemeProvider';

export default function NewRunLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }}
    />
  );
}
