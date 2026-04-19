import { describe, it, expect, vi, beforeEach } from 'vitest'
import { context, peek } from '@reatom/core'
import { createCancelForm } from './model'

vi.mock('@shared/api', () => ({
  apiClient: {
    cancelBooking: vi.fn(),
  },
}))

vi.mock('@app/router', () => ({
  navigate: {
    home: vi.fn(),
  },
}))

import { apiClient } from '@shared/api'
import { navigate } from '@app/router'

const mockBooking = {
  id: 'booking-1',
  eventTypeId: 'event-1',
  slotId: 'slot-1',
  guestName: 'Иван Иванов',
  guestEmail: 'ivan@example.com',
  status: 'confirmed',
  createdAt: '2024-01-10T00:00:00Z',
  updatedAt: '2024-01-10T00:00:00Z',
}

const cancelledBooking = { ...mockBooking, status: 'cancelled' }

describe('features/cancel-booking/model', () => {
  beforeEach(() => {
    context.reset()
    vi.clearAllMocks()
  })

  describe('createCancelForm', () => {
    it('создаёт форму с начальным состоянием isOpen=false', () => {
      const { isOpen } = createCancelForm('booking-1')
      expect(peek(isOpen)).toBe(false)
    })

    it('open: открывает модальное окно', () => {
      const { isOpen, open } = createCancelForm('booking-1')
      open()
      expect(peek(isOpen)).toBe(true)
    })

    it('close: закрывает модальное окно и сбрасывает форму', () => {
      const { isOpen, form, open, close } = createCancelForm('booking-1')
      open()
      form.fields.reason.set('Не могу прийти')

      close()

      expect(peek(isOpen)).toBe(false)
      expect(peek(form.fields.reason)).toBe('')
    })

    it('close: сбрасывает ошибку сабмита', async () => {
      vi.mocked(apiClient.cancelBooking).mockResolvedValue({
        status: 404,
        data: { message: 'Бронирование не найдено' },
      })

      const { form, open, close } = createCancelForm('booking-1')
      open()

      await expect(form.submit()).rejects.toThrow()
      expect(peek(form.submit.error)).toBeInstanceOf(Error)

      close()

      expect(peek(form.submit.error)).toBeUndefined()
    })

    it('успешная отмена: вызывает API с правильными аргументами', async () => {
      vi.mocked(apiClient.cancelBooking).mockResolvedValue({
        status: 200,
        data: cancelledBooking,
      })

      const { form } = createCancelForm('booking-1')
      form.fields.reason.set('Не могу прийти')

      await form.submit()

      expect(apiClient.cancelBooking).toHaveBeenCalledWith('booking-1', 'Не могу прийти')
    })

    it('успешная отмена: вызывает API без причины если поле пустое', async () => {
      vi.mocked(apiClient.cancelBooking).mockResolvedValue({
        status: 200,
        data: cancelledBooking,
      })

      const { form } = createCancelForm('booking-1')

      await form.submit()

      expect(apiClient.cancelBooking).toHaveBeenCalledWith('booking-1', undefined)
    })

    it('успешная отмена: выполняет навигацию на главную', async () => {
      vi.mocked(apiClient.cancelBooking).mockResolvedValue({
        status: 200,
        data: cancelledBooking,
      })

      const { form } = createCancelForm('booking-1')

      await form.submit()

      expect(navigate.home).toHaveBeenCalled()
    })

    it('ошибка API: выбрасывает сообщение из ответа', async () => {
      vi.mocked(apiClient.cancelBooking).mockResolvedValue({
        status: 404,
        data: { message: 'Бронирование не найдено' },
      })

      const { isOpen, form, open } = createCancelForm('booking-1')
      open()

      await expect(form.submit()).rejects.toThrow('Бронирование не найдено')

      expect(peek(isOpen)).toBe(true)
      expect(navigate.home).not.toHaveBeenCalled()
    })

    it('ошибка API без message: выбрасывает дефолтное сообщение', async () => {
      vi.mocked(apiClient.cancelBooking).mockResolvedValue({
        status: 500,
        data: {},
      })

      const { form } = createCancelForm('booking-1')

      await expect(form.submit()).rejects.toThrow('Не удалось отменить бронирование')
    })
  })
})
