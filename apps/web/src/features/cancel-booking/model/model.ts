import { reatomForm, action, atom, wrap } from '@reatom/core'
import { apiClient } from '@shared/api'
import { navigate } from '@app/router'
import type { Booking } from '@entities/booking'

/**
 * Factory function для создания формы отмены бронирования.
 * Создаётся внутри route loader для автоматической очистки при уходе со страницы.
 */
export function createCancelForm(bookingId: string) {
  // Atom состояния открытости модального окна
  const isOpen = atom(false, `cancelBookingForm#${bookingId}.isOpen`)

  // Форма отмены бронирования с полем причины отмены
  const form = reatomForm(
    { reason: '' },
    {
      name: `cancelBookingForm#${bookingId}`,
      onSubmit: async (values: { reason: string }): Promise<Booking> => {
        const response = await wrap(
          apiClient.cancelBooking(bookingId, values.reason || undefined)
        )

        if (response.status >= 400) {
          const errorData = response.data as { message?: string }
          throw new Error(errorData.message || 'Не удалось отменить бронирование')
        }

        // После успешной отмены переходим на главную
        navigate.home()

        return response.data
      },
    }
  )

  // Открыть модальное окно подтверждения отмены
  const open = action(() => {
    isOpen.set(true)
  }, `cancelBookingForm#${bookingId}.open`)

  // Закрыть модальное окно и сбросить все состояния формы,
  // включая error-атом сабмита, который form.reset() не сбрасывает
  const close = action(() => {
    isOpen.set(false)
    form.reset()
    form.submit.error.set(undefined)
  }, `cancelBookingForm#${bookingId}.close`)

  return { form, isOpen, open, close }
}
