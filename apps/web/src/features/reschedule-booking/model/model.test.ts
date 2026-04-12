import { describe, it, expect, vi, beforeEach } from 'vitest'
import { context, peek } from '@reatom/core'
import { createRescheduleForm, parseApiError } from './model'
import { currentBookingAtom } from '@entities/booking'
import type { Booking } from '@entities/booking'

// Мок для API клиента
vi.mock('@shared/api', () => ({
  apiClient: {
    rescheduleBooking: vi.fn(),
    getAvailableSlotsForEventType: vi.fn(),
  },
}))

import { apiClient } from '@shared/api'

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
        data: mockBooking,
      })

      const { form } = createRescheduleForm('booking-1', 'event-1')
      form.fields.newSlotId.set('slot-2')

      await form.submit()

      expect(apiClient.rescheduleBooking).toHaveBeenCalledWith('booking-1', 'slot-2')
    })

    it('успешный перенос: обновляет currentBookingAtom', async () => {
      vi.mocked(apiClient.rescheduleBooking).mockResolvedValue({
        status: 200,
        data: mockBooking,
      })

      const { form } = createRescheduleForm('booking-1', 'event-1')
      form.fields.newSlotId.set('slot-2')

      await form.submit()

      expect(peek(currentBookingAtom)).toEqual(mockBooking)
    })

    it('успешный перенос: закрывает модальное окно', async () => {
      vi.mocked(apiClient.rescheduleBooking).mockResolvedValue({
        status: 200,
        data: mockBooking,
      })

      const { isOpen, form } = createRescheduleForm('booking-1', 'event-1')
      isOpen.set(true)
      form.fields.newSlotId.set('slot-2')

      await form.submit()

      expect(peek(isOpen)).toBe(false)
    })

    it('конфликт слота: выбрасывает "Выбранный слот уже занят"', async () => {
      vi.mocked(apiClient.rescheduleBooking).mockRejectedValue(
        new Error(
          JSON.stringify({ code: 'SLOT_ALREADY_BOOKED', message: 'Slot already booked' })
        )
      )

      const { form } = createRescheduleForm('booking-1', 'event-1')
      form.fields.newSlotId.set('slot-2')

      await expect(form.submit()).rejects.toThrow('Выбранный слот уже занят')
    })

    it('слот не найден: выбрасывает сообщение из ответа API', async () => {
      vi.mocked(apiClient.rescheduleBooking).mockRejectedValue(
        new Error(JSON.stringify({ code: 'NOT_FOUND', message: 'Slot not found' }))
      )

      const { form } = createRescheduleForm('booking-1', 'event-1')
      form.fields.newSlotId.set('slot-2')

      await expect(form.submit()).rejects.toThrow('Slot not found')
    })
  })
})
