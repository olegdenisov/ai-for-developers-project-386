import { reatomForm, action, type Action } from '@reatom/core'
import { atom, computed, wrap, withAsyncData } from '@reatom/core'
import { apiClient } from '@shared/api'
import { parseApiError } from '@shared/lib'
import { currentBookingAtom } from '@entities/booking'
import type { Booking } from '@entities/booking'
import type { Slot } from '@entities/slot'


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

  // Начальное состояние списка слотов (пустой массив с явным типом для withAsyncData)
  const emptySlots: Slot[] = []

  // Счётчик для ручного повтора запроса слотов при ошибке
  const retryTrigger = atom(0, `reschedule#${bookingId}.retryTrigger`)

  // Загрузка доступных слотов (следующие 14 дней) для данного типа события.
  // Автоматически обновляется когда isOpen становится true или при ручном повторе.
  const availableSlots = computed(async (): Promise<Slot[]> => {
    if (!isOpen()) return emptySlots
    retryTrigger() // подписываемся для поддержки ручного повтора

    const today = new Date()
    // Используем локальные компоненты даты, чтобы избежать смещения в UTC- часовых поясах
    const pad = (n: number) => String(n).padStart(2, '0')
    const startDate = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`
    // +15 вместо +14: endDate — эксклюзивная граница для lte-фильтра на бэкенде.
    // new Date('2026-04-28') = 2026-04-28T00:00:00Z, что обрезает слоты этого дня.
    // Сдвиг на +15 включает все слоты 14-го дня (до 23:59 UTC).
    const endDate14 = new Date(today)
    endDate14.setDate(today.getDate() + 15)
    const endDate = `${endDate14.getFullYear()}-${pad(endDate14.getMonth() + 1)}-${pad(endDate14.getDate())}`

    const response = await wrap(
      apiClient.getAvailableSlotsForEventType(eventTypeId, startDate, endDate)
    )
    return response.data
  }, `reschedule#${bookingId}.availableSlots`).extend(withAsyncData({ initState: emptySlots }))

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
          const booking = response.data
          // Обновляем данные бронирования без навигации
          currentBookingAtom.set(booking)
          // Закрываем модальное окно после успешного переноса
          isOpen.set(false)
          return booking
        } catch (err) {
          throw parseApiError(err, 'Не удалось перенести встречу')
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
    form.submit.error.set(undefined)
  }, `reschedule#${bookingId}.close`)

  // Повторить загрузку слотов без закрытия модалки (инкремент триггера)
  const retry: Action<[], void> = action(() => {
    retryTrigger.set((v) => v + 1)
  }, `reschedule#${bookingId}.retry`)

  return { isOpen, availableSlots, form, close, retry }
}
