import { Button, Group, Modal, NumberInput, Stack, Textarea, TextInput } from '@mantine/core';
import { reatomComponent } from '@reatom/react';
import {
  closeEditEventType,
  editEventTypeForm,
  editingEventType,
} from './model/model';

interface EditEventTypeModalProps {
  /** Коллбэк, вызываемый после успешного обновления типа события */
  onSuccess: () => void;
}

/**
 * Модалка редактирования типа события
 */
export const EditEventTypeModal = reatomComponent(
  ({ onSuccess }: EditEventTypeModalProps) => {
    const et = editingEventType();
    const isPending = !editEventTypeForm.submit.ready();

    const handleClose = () => {
      closeEditEventType();
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      await editEventTypeForm.submit();
      if (!editEventTypeForm.submit.error()) {
        handleClose();
        onSuccess();
      }
    };

    return (
      <Modal opened={et !== null} onClose={handleClose} title="Редактировать тип события" centered>
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <TextInput
              label="Название"
              placeholder="Например: Техническое ревью"
              required
              value={editEventTypeForm.fields.name()}
              onChange={(e) => editEventTypeForm.fields.name.set(e.target.value)}
            />
            <Textarea
              label="Описание"
              placeholder="Краткое описание встречи"
              autosize
              minRows={2}
              value={editEventTypeForm.fields.description()}
              onChange={(e) => editEventTypeForm.fields.description.set(e.target.value)}
            />
            <NumberInput
              label="Длительность (минуты)"
              placeholder="30"
              required
              min={1}
              max={480}
              value={editEventTypeForm.fields.durationMinutes()}
              onChange={(value) =>
                editEventTypeForm.fields.durationMinutes.set(Number(value))
              }
            />
            <Group justify="flex-end" mt="sm">
              <Button variant="subtle" color="gray" onClick={handleClose}>
                Отмена
              </Button>
              <Button type="submit" loading={isPending} color="orange">
                Сохранить
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    );
  },
  'EditEventTypeModal',
);
