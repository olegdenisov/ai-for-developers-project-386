import { describe, it, expect, vi, beforeEach } from 'vitest'
import { context, peek } from '@reatom/core'
import { createRescheduleForm, parseApiError } from './model'
import { currentBookingAtom } from '@entities/booking'
import type { Booking } from '@entities/booking'
import type { Slot } from '@entities/slot'

// Мок для API клиента
vi.mock('@shared/api', () => ({
  apiClient: {
    rescheduleBooking: vi.fn(),
    getAvailableSlotsForEventType: vi.fn(),
  },
}))

import { apiClient } from '@shared/api'

// Исходное бронирование (на слот slot-2)
const mockBooking: Booking = {
  id: 'booking-1',
  eventTypeId: 'event-1',
  slotId: 'slot-2',
  guestName: 'Иван Иванов',
  guestEmail: 'ivan@example.com',
  guestNotes: null,
  status: 'CONFIRMED',
  createdAt: '2024-01-10T00:00:00Z',
  updatedAt: '2024-01-10T00:00:00Z',
}

// Бронирование после переноса (на слот slot-3)
const rescheduledBooking: Booking = {
  ...mockBooking,
  slotId: 'slot-3',
}

describe('features/reschedule-booking/model', () => {
  beforeEach(() => {
    context.reset()
    vi.clearAllMocks()
  })

  describe('parseApiError', () => {
    it('должен возвращать "Выбранный слот уже занят" для SLOT_ALREADY_BOOKED', () => {
      const err = new Error(
        JSON.stringify({ code: 'SLOT_ALREADY_BOOKED', message: 'Slot already booked' })
      )
      expect(parseApiError(err).message).toBe('Выбранный слот уже занят')
    })

    it('должен возвращать message из ошибки для других кодов', () => {
      const err = new Error(
        JSON.stringify({ code: 'NOT_FOUND', message: 'Booking not found' })
      )
      expect(parseApiError(err).message).toBe('Booking not found')
    })

    it('должен возвращать дефолтное сообщение если message не задан', () => {
      const err = new Error(JSON.stringify({ code: 'UNKNOWN' }))
      expect(parseApiError(err).message).toBe('Не удалось перенести встречу')
    })

    it('должен возвращать сообщение ошибки если не JSON', () => {
      const err = new Error('network error')
      expect(parseApiError(err).message).toBe('network error')
    })

    it('должен возвращать дефолтное сообщение для не-Error значений', () => {
      expect(parseApiError('string error').message).toBe('Не удалось перенести встречу')
    })
  })

  describe('createRescheduleForm', () => {
    it('должен создавать форму с начальным состоянием isOpen=false', () => {
      const { isOpen } = createRescheduleForm('booking-1', 'event-1')
      expect(peek(isOpen)).toBe(false)
    })

    it('успешный перенос: вызывает API с правильными аргументами', async () => {
      vi.mocked(apiClient.rescheduleBooking).mockResolvedValue({
        status: 200,
        data: rescheduledBooking,
      })

      const { form } = createRescheduleForm('booking-1', 'event-1')
      form.fields.newSlotId.set('slot-3')

      await form.submit()

      expect(apiClient.rescheduleBooking).toHaveBeenCalledWith('booking-1', 'slot-3')
    })

    it('успешный перенос: обновляет currentBookingAtom', async () => {
      vi.mocked(apiClient.rescheduleBooking).mockResolvedValue({
        status: 200,
        data: rescheduledBooking,
      })

      const { form } = createRescheduleForm('booking-1', 'event-1')
      form.fields.newSlotId.set('slot-3')

      await form.submit()

      expect(peek(currentBookingAtom)).toEqual(rescheduledBooking)
    })

    it('успешный перенос: закрывает модальное окно', async () => {
      vi.mocked(apiClient.rescheduleBooking).mockResolvedValue({
        status: 200,
        data: rescheduledBooking,
      })

      const { isOpen, form } = createRescheduleForm('booking-1', 'event-1')
      isOpen.set(true)
      form.fields.newSlotId.set('slot-3')

      await form.submit()

      expect(peek(isOpen)).toBe(false)
    })

    it('конфликт слота: выбрасывает "Выбранный слот уже занят"', async () => {
      vi.mocked(apiClient.rescheduleBooking).mockRejectedValue(
        new Error(
          JSON.stringify({ code: 'SLOT_ALREADY_BOOKED', message: 'Slot already booked' })
        )
      )

      const { isOpen, form } = createRescheduleForm('booking-1', 'event-1')
      // Предустанавливаем значение, чтобы проверить что оно не изменилось после ошибки
      currentBookingAtom.set(mockBooking)
      isOpen.set(true)
      form.fields.newSlotId.set('slot-3')

      await expect(form.submit()).rejects.toThrow('Выбранный слот уже занят')

      // Модальное окно остаётся открытым при ошибке
      expect(peek(isOpen)).toBe(true)
      // Бронирование не обновляется при ошибке (должно остаться mockBooking, а не rescheduledBooking)
      expect(peek(currentBookingAtom)).toEqual(mockBooking)
    })

    it('слот не найден: выбрасывает сообщение из ответа API', async () => {
      vi.mocked(apiClient.rescheduleBooking).mockRejectedValue(
        new Error(JSON.stringify({ code: 'NOT_FOUND', message: 'Slot not found' }))
      )

      const { isOpen, form } = createRescheduleForm('booking-1', 'event-1')
      isOpen.set(true)
      form.fields.newSlotId.set('slot-3')

      await expect(form.submit()).rejects.toThrow('Slot not found')

      // Модальное окно остаётся открытым при ошибке
      expect(peek(isOpen)).toBe(true)
    })

    it('close: закрывает модальное окно и сбрасывает форму', async () => {
      const { isOpen, form, close } = createRescheduleForm('booking-1', 'event-1')
      isOpen.set(true)
      form.fields.newSlotId.set('slot-3')

      close()

      expect(peek(isOpen)).toBe(false)
      expect(peek(form.fields.newSlotId)).toBe('')
    })

    it('close: сбрасывает ошибку сабмита', async () => {
      vi.mocked(apiClient.rescheduleBooking).mockRejectedValue(
        new Error(JSON.stringify({ code: 'SLOT_ALREADY_BOOKED', message: 'Slot already booked' }))
      )

      const { isOpen, form, close } = createRescheduleForm('booking-1', 'event-1')
      isOpen.set(true)
      form.fields.newSlotId.set('slot-3')

      await expect(form.submit()).rejects.toThrow()
      // Убеждаемся, что ошибка появилась
      expect(peek(form.submit.error)).toBeInstanceOf(Error)

      close()

      // После закрытия ошибка должна быть сброшена
      expect(peek(form.submit.error)).toBeUndefined()
    })

    describe('availableSlots', () => {
      const mockSlot: Slot = {
        id: 'slot-3',
        startTime: '2026-04-20T10:00:00Z',
        endTime: '2026-04-20T10:30:00Z',
        isAvailable: true,
        createdAt: '2026-01-01T00:00:00Z',
      }

      it('не вызывает API когда isOpen=false', async () => {
        const { availableSlots } = createRescheduleForm('booking-1', 'event-1')
        // Подписка активирует computed, но isOpen=false — запрос не должен происходить
        const unsub = availableSlots.subscribe(() => {})
        await Promise.resolve()
        expect(apiClient.getAvailableSlotsForEventType).not.toHaveBeenCalled()
        unsub()
      })

      it('загружает слоты при открытии модального окна', async () => {
        vi.mocked(apiClient.getAvailableSlotsForEventType).mockResolvedValue({
          status: 200,
          data: [mockSlot],
        })

        const { isOpen, availableSlots } = createRescheduleForm('booking-1', 'event-1')
        const unsub = availableSlots.subscribe(() => {})

        isOpen.set(true)

        // Ждём завершения асинхронной операции через детерминированную проверку состояния
        await vi.waitFor(() => {
          expect(apiClient.getAvailableSlotsForEventType).toHaveBeenCalledWith(
            'event-1',
            expect.any(String),
            expect.any(String)
          )
        })

        // Проверяем что данные попали в атом
        expect(peek(availableSlots.data)).toEqual([mockSlot])
        unsub()
      })

      it('передаёт диапазон дат на 15 дней вперёд', async () => {
        vi.mocked(apiClient.getAvailableSlotsForEventType).mockResolvedValue({
          status: 200,
          data: [],
        })

        const { isOpen, availableSlots } = createRescheduleForm('booking-1', 'event-1')
        const unsub = availableSlots.subscribe(() => {})

        isOpen.set(true)

        await vi.waitFor(() => {
          expect(apiClient.getAvailableSlotsForEventType).toHaveBeenCalled()
        })

        const calls = vi.mocked(apiClient.getAvailableSlotsForEventType).mock.calls
        const [, startDate, endDate] = calls[0]

        const start = new Date(startDate)
        const end = new Date(endDate)
        const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

        expect(diffDays).toBe(15)
        unsub()
      })
    })
  })
})
