import { Button, Group, Modal, Text } from '@mantine/core';
import { reatomComponent } from '@reatom/react';
import {
  closeDeleteEventType,
  confirmDeleteEventType,
  deletingEventType,
} from './model/model';

interface DeleteEventTypeModalProps {
  /** Коллбэк, вызываемый после успешного удаления типа события */
  onSuccess: () => void;
}

/**
 * Модалка подтверждения удаления типа события
 */
export const DeleteEventTypeModal = reatomComponent(
  ({ onSuccess }: DeleteEventTypeModalProps) => {
    const et = deletingEventType();
    const isPending = !confirmDeleteEventType.ready();

    const handleClose = () => {
      closeDeleteEventType();
    };

    const handleConfirm = async () => {
      await confirmDeleteEventType(onSuccess);
    };

    return (
      <Modal
        opened={et !== null}
        onClose={handleClose}
        title="Удалить тип события"
        centered
        size="sm"
      >
        <Text mb="lg">
          Вы уверены, что хотите удалить тип события{' '}
          <Text component="span" fw={600}>
            «{et?.name}»
          </Text>
          ? Это действие нельзя отменить.
        </Text>
        <Group justify="flex-end">
          <Button variant="subtle" color="gray" onClick={handleClose}>
            Отмена
          </Button>
          <Button color="red" loading={isPending} onClick={handleConfirm}>
            Удалить
          </Button>
        </Group>
      </Modal>
    );
  },
  'DeleteEventTypeModal',
);
