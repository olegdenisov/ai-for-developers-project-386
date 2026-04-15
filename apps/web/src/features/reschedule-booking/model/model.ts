import { reatomForm, action } from '@reatom/core'
import { atom, computed, wrap, withAsyncData } from '@reatom/core'
import { apiClient } from '@shared/api'
import { currentBookingAtom } from '@entities/booking'
import type { Booking } from '@entities/booking'
import type { Slot } from '@entities/slot'

/**
 * Парсит ошибку из API клиента и возвращает читаемое сообщение.
 * API клиент бросает Error с JSON-строкой вида { code, message }.
 */
export function parseApiError(err: unknown): Error {
  if (!(err instanceof Error)) {
    return new Error('Не удалось перенести встречу')
  }
  try {
    const parsed = JSON.parse(err.message) as { code?: string; message?: string }
    if (parsed.code === 'SLOT_ALREADY_BOOKED') {
      return new Error('Выбранный слот уже занят')
    }
    return new Error(parsed.message || 'Не удалось перенести встречу')
  } catch {
    // Если не JSON — возвращаем как есть
    return new Error(err.message || 'Не удалось перенести встречу')
  }
}

/**
 * Factory function для создания формы переноса бронирования.
 * Создаётся внутри route loader для автоматической очистки при уходе со страницы.
 *
 * @param bookingId — идентификатор бронирования для переноса
 * @param eventTypeId — идентификатор типа события (для загрузки слотов)
 */
export function createRescheduleForm(bookingId: string, eventTypeId: string) {
  // Atom состояния открытости модального окна
  const isOpen = atom(false, `reschedule#${bookingId}.isOpen`)

  // Загрузка доступных слотов (следующие 14 дней) для данного типа события.
  // Автоматически обновляется когда isOpen становится true.
  const availableSlots = computed(async () => {
    if (!isOpen()) return [] as Slot[]

    const today = new Date()
    const startDate = today.toISOString().split('T')[0]
    // +15 вместо +14: endDate — эксклюзивная граница для lte-фильтра на бэкенде.
    // new Date('2026-04-28') = 2026-04-28T00:00:00Z, что обрезает слоты этого дня.
    // Сдвиг на +15 включает все слоты 14-го дня (до 23:59 UTC).
    const endDate14 = new Date(today)
    endDate14.setDate(today.getDate() + 15)
    const endDate = endDate14.toISOString().split('T')[0]

    const response = await wrap(
      apiClient.getAvailableSlotsForEventType(eventTypeId, startDate, endDate)
    )
    return response.data as Slot[]
  }, `reschedule#${bookingId}.availableSlots`).extend(withAsyncData({ initState: [] as Slot[] }))

  // Форма переноса бронирования с полем выбора нового слота
  const form = reatomForm(
    { newSlotId: '' },
    {
      name: `rescheduleBookingForm#${bookingId}`,
      // Сбрасываем состояние формы после успешного сабмита (очищает поле выбора слота)
      resetOnSubmit: true,
      onSubmit: async (values: { newSlotId: string }): Promise<Booking> => {
        try {
          const response = await wrap(
            apiClient.rescheduleBooking(bookingId, values.newSlotId)
          )
          const booking = response.data as Booking
          // Обновляем данные бронирования без навигации
          currentBookingAtom.set(booking)
          // Закрываем модальное окно после успешного переноса
          isOpen.set(false)
          return booking
        } catch (err) {
          throw parseApiError(err)
        }
      },
    }
  )

  // Закрыть модальное окно и сбросить все состояния формы,
  // включая error-атом сабмита, который form.reset() не сбрасывает
  const close = action(() => {
    isOpen.set(false)
    form.reset()
    // form.reset() не сбрасывает error-атом сабмита — сбрасываем напрямую
    ;(form.submit as any).errorAtom?.set(null)
  }, `reschedule#${bookingId}.close`)

  return { isOpen, availableSlots, form, close }
}
