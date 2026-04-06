import { Alert } from '@mantine/core';
import { IconAlertCircle } from '@mantine/icons';

interface ErrorMessageProps {
  message: string;
  onClose?: () => void;
}

export function ErrorMessage({ message, onClose }: ErrorMessageProps) {
  return (
    <Alert
      icon={<IconAlertCircle size={16} />}
      title="Ошибка"
      color="red"
      withCloseButton={!!onClose}
      onClose={onClose}
      mb="md"
    >
      {message}
    </Alert>
  );
}
