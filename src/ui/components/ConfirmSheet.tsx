import { useEffect } from 'react';
import { View } from 'react-native';
import { haptic } from '../../platform/haptics';
import { space } from '../theme/tokens';
import { Button } from './Button';
import { Sheet } from './Sheet';
import { Text } from './Text';

export interface ConfirmSheetProps {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmSheet({
  visible,
  title,
  body,
  confirmLabel,
  cancelLabel,
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmSheetProps) {
  useEffect(() => {
    if (visible && destructive) haptic('warning');
  }, [visible, destructive]);
  return (
    <Sheet visible={visible} onDismiss={onCancel} label={title}>
      <Text variant="title2">{title}</Text>
      <Text variant="body" color="textSecondary">
        {body}
      </Text>
      <View style={{ gap: space.s }}>
        <Button
          label={confirmLabel}
          kind={destructive ? 'destructive' : 'primary'}
          onPress={onConfirm}
        />
        <Button label={cancelLabel} kind="tertiary" onPress={onCancel} />
      </View>
    </Sheet>
  );
}
