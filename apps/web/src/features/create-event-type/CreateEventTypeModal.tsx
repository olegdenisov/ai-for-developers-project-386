import { Button, Group, Modal, NumberInput, Stack, Textarea, TextInput } from '@mantine/core';
import { reatomComponent } from '@reatom/react';
import { createEventTypeForm, isCreateEventTypeModalOpen } from './model/model';

interface CreateEventTypeModalProps {
  /** Коллбэк, вызываемый после успешного создания типа события */
  onSuccess: () => void;
}

/**
 * Модалка создания нового типа события
 */
export const CreateEventTypeModal = reatomComponent(
  ({ onSuccess }: CreateEventTypeModalProps) => {
    const isOpen = isCreateEventTypeModalOpen();
    const isPending = !createEventTypeForm.submit.ready();

    const handleClose = () => {
      isCreateEventTypeModalOpen.set(false);
      createEventTypeForm.reset();
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      await createEventTypeForm.submit();
      if (!createEventTypeForm.submit.error()) {
        handleClose();
        onSuccess();
      }
    };

    return (
      <Modal opened={isOpen} onClose={handleClose} title="Создать тип события" centered>
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <TextInput
              label="Название"
              placeholder="Например: Техническое ревью"
              required
              value={createEventTypeForm.fields.name()}
              onChange={(e) => createEventTypeForm.fields.name.set(e.target.value)}
            />
            <Textarea
              label="Описание"
              placeholder="Краткое описание встречи"
              autosize
              minRows={2}
              value={createEventTypeForm.fields.description()}
              onChange={(e) => createEventTypeForm.fields.description.set(e.target.value)}
            />
            <NumberInput
              label="Длительность (минуты)"
              placeholder="30"
              required
              min={1}
              max={480}
              value={createEventTypeForm.fields.durationMinutes()}
              onChange={(value) =>
                createEventTypeForm.fields.durationMinutes.set(Number(value))
              }
            />
            <Group justify="flex-end" mt="sm">
              <Button variant="subtle" color="gray" onClick={handleClose}>
                Отмена
              </Button>
              <Button type="submit" loading={isPending} color="orange">
                Создать
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    );
  },
  'CreateEventTypeModal',
);
