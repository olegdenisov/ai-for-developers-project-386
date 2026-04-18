import { reatomComponent } from '@reatom/react'
import { Modal, Stack, Text, Group, Button } from '@mantine/core'
import type { createCancelForm } from '../model/model'

interface CancelBookingModalProps {
  cancelForm: ReturnType<typeof createCancelForm>
}

/**
 * Модальное окно подтверждения отмены бронирования.
 */
export const CancelBookingModal = reatomComponent(
  ({ cancelForm }: CancelBookingModalProps) => {
    const opened = cancelForm.isOpen()
    const isCancelling = !cancelForm.form.submit.ready()

    const handleConfirm = (e: React.FormEvent) => {
      e.preventDefault()
      cancelForm.form.submit()
    }

    return (
      <Modal
        opened={opened}
        onClose={cancelForm.close}
        title="Отменить бронирование"
        centered
      >
        <form onSubmit={handleConfirm}>
          <Stack gap="md">
            <Text>
              Вы уверены, что хотите отменить бронирование? Это действие нельзя
              отменить.
            </Text>
            {cancelForm.form.submit.error() && (
              <Text c="red" size="sm">
                {cancelForm.form.submit.error()?.message}
              </Text>
            )}
            <Group justify="flex-end" wrap="nowrap">
              <Button variant="subtle" onClick={cancelForm.close}>
                Закрыть
              </Button>
              <Button
                color="red"
                type="submit"
                loading={isCancelling}
                loaderProps={{ type: 'dots' }}
                miw={180}
              >
                Отменить бронирование
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    )
  },
  'CancelBookingModal'
)
