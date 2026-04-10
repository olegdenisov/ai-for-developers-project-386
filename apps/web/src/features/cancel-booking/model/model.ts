// @ts-ignore - reatomForm доступен в runtime, но не объявлен в типах
import { reatomForm } from '@reatom/core'
import { wrap } from '@reatom/core'
import { apiClient } from '@shared/api'
import { navigate } from '@app/router'
import type { Booking } from '@entities/booking'

/**
 * Factory function для создания формы отмены бронирования.
 * Создаётся внутри route loader для автоматической очистки при уходе со страницы.
 */
export function createCancelForm(bookingId: string) {
  return reatomForm(
    {
      reason: '',
    },
    {
      name: 'cancelBookingForm',
      onSubmit: async (values: { reason: string }): Promise<Booking> => {
        const response = await wrap(
          apiClient.cancelBooking(bookingId, values.reason || undefined)
        )

        if (response.status >= 400) {
          const errorData = response.data as { message?: string }
          throw new Error(errorData.message || 'Failed to cancel booking')
        }

        // После успешной отмены переходим на главную
        navigate.home()

        return response.data as Booking
      },
    }
  )
}
