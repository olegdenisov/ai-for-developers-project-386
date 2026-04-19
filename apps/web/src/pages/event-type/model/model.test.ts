import { describe, it, expect, vi, beforeEach } from 'vitest'
import { context, peek } from '@reatom/core'

vi.mock('@shared/api', () => ({
  apiClient: {
    getAvailableSlotsForEventType: vi.fn(),
  },
}))

vi.mock('@app/router', () => ({
  navigate: {
    bookingConfirmation: vi.fn(),
    booking: vi.fn(),
  },
}))

import { apiClient } from '@shared/api'
import { navigate } from '@app/router'

import {
  selectDate,
  selectSlot,
  proceedToBooking,
  goBack,
  slotsForSelectedDateAtom,
} from './model'

import {
  selectedDateAtom,
  selectedSlotAtom,
  selectedSlotIdAtom,
  selectedEventTypeIdAtom,
  slotsAtom,
  fetchSlotsForCalendar,
  fetchSlotsForDate,
} from './route'

import type { Slot } from '@entities/slot'
import type { EventType } from '@entities/event-type'

const mockSlot: Slot = {
  id: 'slot-1',
  startTime: '2026-04-20T10:00:00Z',
  endTime: '2026-04-20T10:30:00Z',
  isAvailable: true,
  createdAt: '2024-01-01T00:00:00Z',
}

const unavailableSlot: Slot = { ...mockSlot, id: 'slot-2', isAvailable: false }

const mockEventType: EventType = {
  id: 'event-1',
  name: 'Встреча 30 мин',
  description: 'Короткая встреча',
  durationMinutes: 30,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

describe('pages/event-type/model', () => {
  beforeEach(() => {
    context.reset()
    vi.clearAllMocks()
  })

  describe('selectDate', () => {
    it('устанавливает выбранную дату', () => {
      const date = new Date('2026-04-20')
      selectDate(date)
      expect(peek(selectedDateAtom)).toEqual(date)
    })

    it('сбрасывает selectedSlotAtom при смене даты', () => {
      selectedSlotAtom.set(mockSlot)
      selectDate(new Date('2026-04-21'))
      expect(peek(selectedSlotAtom)).toBeNull()
    })

    it('сбрасывает selectedSlotIdAtom при смене даты', () => {
      selectedSlotIdAtom.set('slot-1')
      selectDate(new Date('2026-04-21'))
      expect(peek(selectedSlotIdAtom)).toBeNull()
    })
  })

  describe('selectSlot', () => {
    it('устанавливает выбранный слот если он доступен', () => {
      selectSlot(mockSlot)
      expect(peek(selectedSlotAtom)).toEqual(mockSlot)
      expect(peek(selectedSlotIdAtom)).toBe('slot-1')
    })

    it('не обновляет атомы для недоступного слота', () => {
      selectSlot(unavailableSlot)
      expect(peek(selectedSlotAtom)).toBeNull()
      expect(peek(selectedSlotIdAtom)).toBeNull()
    })
  })

  describe('proceedToBooking', () => {
    it('навигирует к подтверждению бронирования при выбранных слоте и типе события', () => {
      selectedSlotAtom.set(mockSlot)
      proceedToBooking(mockEventType)
      expect(navigate.bookingConfirmation).toHaveBeenCalledWith('event-1', 'slot-1')
    })

    it('не навигирует если слот не выбран', () => {
      proceedToBooking(mockEventType)
      expect(navigate.bookingConfirmation).not.toHaveBeenCalled()
    })

    it('не навигирует если тип события не передан', () => {
      selectedSlotAtom.set(mockSlot)
      proceedToBooking(undefined)
      expect(navigate.bookingConfirmation).not.toHaveBeenCalled()
    })
  })

  describe('goBack', () => {
    it('очищает все атомы состояния', () => {
      selectedEventTypeIdAtom.set('event-1')
      selectedDateAtom.set(new Date())
      selectedSlotAtom.set(mockSlot)
      selectedSlotIdAtom.set('slot-1')

      goBack()

      expect(peek(selectedEventTypeIdAtom)).toBeNull()
      expect(peek(selectedDateAtom)).toBeNull()
      expect(peek(selectedSlotAtom)).toBeNull()
      expect(peek(selectedSlotIdAtom)).toBeNull()
    })

    it('навигирует на каталог бронирований', () => {
      goBack()
      expect(navigate.booking).toHaveBeenCalled()
    })
  })

  describe('slotsForSelectedDateAtom', () => {
    it('возвращает пустой массив если дата не выбрана', () => {
      expect(peek(slotsForSelectedDateAtom)).toEqual([])
    })

    it('возвращает слоты для выбранной даты', () => {
      const date = new Date('2026-04-20T00:00:00.000Z')
      slotsAtom.set([mockSlot])
      selectedDateAtom.set(date)

      const slots = peek(slotsForSelectedDateAtom)
      expect(slots).toContain(mockSlot)
    })
  })

  describe('fetchSlotsForCalendar', () => {
    it('вызывает API с корректным диапазоном дат', async () => {
      vi.mocked(apiClient.getAvailableSlotsForEventType).mockResolvedValue({
        status: 200,
        data: [mockSlot],
      })

      selectedEventTypeIdAtom.set('event-1')
      await fetchSlotsForCalendar()

      expect(apiClient.getAvailableSlotsForEventType).toHaveBeenCalledWith(
        'event-1',
        expect.any(String),
        expect.any(String)
      )
    })

    it('устанавливает слоты в slotsAtom после загрузки', async () => {
      vi.mocked(apiClient.getAvailableSlotsForEventType).mockResolvedValue({
        status: 200,
        data: [mockSlot],
      })

      selectedEventTypeIdAtom.set('event-1')
      await fetchSlotsForCalendar()

      expect(peek(slotsAtom)).toEqual([mockSlot])
    })

    it('не вызывает API если eventTypeId не установлен', async () => {
      await fetchSlotsForCalendar()
      expect(apiClient.getAvailableSlotsForEventType).not.toHaveBeenCalled()
    })
  })

  describe('fetchSlotsForDate', () => {
    it('не вызывает API если дата не выбрана', async () => {
      await fetchSlotsForDate()
      expect(apiClient.getAvailableSlotsForEventType).not.toHaveBeenCalled()
    })

    it('загружает слоты для недели выбранной даты', async () => {
      vi.mocked(apiClient.getAvailableSlotsForEventType).mockResolvedValue({
        status: 200,
        data: [mockSlot],
      })

      selectedEventTypeIdAtom.set('event-1')
      selectedDateAtom.set(new Date('2026-04-20'))

      await fetchSlotsForDate()

      expect(apiClient.getAvailableSlotsForEventType).toHaveBeenCalledWith(
        'event-1',
        expect.any(String),
        expect.any(String)
      )
      expect(peek(slotsAtom)).toEqual([mockSlot])
    })
  })
})
