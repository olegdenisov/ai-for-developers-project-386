import { describe, it, expect, vi, beforeEach } from 'vitest'
import { context, peek } from '@reatom/core'
import { createBookingForm } from './route'
import type { EventType } from '@entities/event-type'
import type { Slot } from '@entities/slot'

vi.mock('@shared/api', () => ({
  apiClient: {
    createBooking: vi.fn(),
  },
  slotsApiClient: {
    getSlot: vi.fn(),
  },
}))

// Роут-зависимости не нужны для тестирования createBookingForm
vi.mock('@pages/event-type/model/eventTypeRoute', () => ({
  eventTypeRoute: { reatomRoute: () => ({}) },
}))
vi.mock('@pages/book-catalog', () => ({ bookCatalogRoute: { loader: { data: () => [] } } }))
vi.mock('@pages/booking', () => ({ bookingRoute: { loader: { data: () => null } } }))
vi.mock('@app/router', () => ({ navigate: { bookingDetail: vi.fn() } }))

import { apiClient } from '@shared/api'

const mockEventType: EventType = {
  id: 'event-1',
  name: 'Встреча 30 мин',
  description: 'Короткая встреча',
  durationMinutes: 30,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

const mockSlot: Slot = {
  id: 'slot-1',
  startTime: '2026-04-20T10:00:00Z',
  endTime: '2026-04-20T10:30:00Z',
  isAvailable: true,
  createdAt: '2024-01-01T00:00:00Z',
}

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

describe('pages/booking-confirmation/model/createBookingForm', () => {
  beforeEach(() => {
    context.reset()
    vi.clearAllMocks()
  })

  it('успешный сабмит: вызывает API с правильными данными', async () => {
    vi.mocked(apiClient.createBooking).mockResolvedValue({
      status: 201,
      data: mockBooking,
    })

    const navigateFn = vi.fn()
    const { form } = createBookingForm(mockEventType, mockSlot, navigateFn)

    form.fields.guestName.set('Иван Иванов')
    form.fields.guestEmail.set('ivan@example.com')

    await form.submit()

    expect(apiClient.createBooking).toHaveBeenCalledWith({
      eventTypeId: 'event-1',
      slotId: 'slot-1',
      guestName: 'Иван Иванов',
      guestEmail: 'ivan@example.com',
      guestNotes: '',
    })
  })

  it('успешный сабмит: вызывает navigateFn с ID бронирования', async () => {
    vi.mocked(apiClient.createBooking).mockResolvedValue({
      status: 201,
      data: mockBooking,
    })

    const navigateFn = vi.fn()
    const { form } = createBookingForm(mockEventType, mockSlot, navigateFn)

    form.fields.guestName.set('Иван Иванов')
    form.fields.guestEmail.set('ivan@example.com')

    await form.submit()

    expect(navigateFn).toHaveBeenCalledWith('booking-1')
  })

  it('409 конфликт: выбрасывает сообщение из ответа API', async () => {
    vi.mocked(apiClient.createBooking).mockResolvedValue({
      status: 409,
      data: { message: 'Этот слот уже забронирован', code: 'SLOT_ALREADY_BOOKED' },
    })

    const navigateFn = vi.fn()
    const { form } = createBookingForm(mockEventType, mockSlot, navigateFn)

    form.fields.guestName.set('Иван Иванов')
    form.fields.guestEmail.set('ivan@example.com')

    await expect(form.submit()).rejects.toThrow('Этот слот уже забронирован')
    expect(navigateFn).not.toHaveBeenCalled()
  })

  it('400 ошибка валидации: выбрасывает сообщение из ответа API', async () => {
    vi.mocked(apiClient.createBooking).mockResolvedValue({
      status: 400,
      data: { message: 'Некорректный email' },
    })

    const navigateFn = vi.fn()
    const { form } = createBookingForm(mockEventType, mockSlot, navigateFn)

    form.fields.guestName.set('Иван Иванов')
    form.fields.guestEmail.set('ivan@example.com')

    await expect(form.submit()).rejects.toThrow('Некорректный email')
  })

  it('ошибка без message: выбрасывает дефолтное сообщение', async () => {
    vi.mocked(apiClient.createBooking).mockResolvedValue({
      status: 500,
      data: {},
    })

    const navigateFn = vi.fn()
    const { form } = createBookingForm(mockEventType, mockSlot, navigateFn)

    form.fields.guestName.set('Иван Иванов')
    form.fields.guestEmail.set('ivan@example.com')

    await expect(form.submit()).rejects.toThrow('Failed to create booking')
  })

  it('форма имеет начальные пустые значения', () => {
    const navigateFn = vi.fn()
    const { form } = createBookingForm(mockEventType, mockSlot, navigateFn)

    expect(peek(form.fields.guestName)).toBe('')
    expect(peek(form.fields.guestEmail)).toBe('')
    expect(peek(form.fields.guestNotes)).toBe('')
  })
})
