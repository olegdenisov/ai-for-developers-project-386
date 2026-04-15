import { reatomComponent } from '@reatom/react'
import { Modal, Stack, Text, Group, Button } from '@mantine/core'
import type { createCancelForm } from '../model/model'

interface CancelBookingModalProps {
  cancelForm: ReturnType<typeof createCancelForm>
}

/**
 * Модальное окно подтверждения отмены бронирования.
 * Управляет открытием/закрытием через поле reason формы.
 */
export const CancelBookingModal = reatomComponent(
  ({ cancelForm }: CancelBookingModalProps) => {
    const isOpen =
      cancelForm.fields.reason() === 'cancel_requested' ||
      !!cancelForm.submit.error()
    const isCancelling = !cancelForm.submit.ready()

    const handleConfirm = (e: React.FormEvent) => {
      e.preventDefault()
      cancelForm.submit()
    }

    const handleClose = () => {
      cancelForm.fields.reason.set('')
      cancelForm.submit.error.set(undefined)
    }

    return (
      <Modal
        opened={isOpen}
        onClose={handleClose}
        title="Отменить бронирование"
        centered
      >
        <form onSubmit={handleConfirm}>
          <Stack gap="md">
            <Text>
              Вы уверены, что хотите отменить бронирование? Это действие нельзя
              отменить.
            </Text>
            {cancelForm.submit.error() && (
              <Text c="red" size="sm">
                {cancelForm.submit.error()?.message}
              </Text>
            )}
            <Group justify="flex-end" wrap="nowrap">
              <Button variant="subtle" onClick={handleClose}>
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
