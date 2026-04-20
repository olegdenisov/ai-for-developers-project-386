import { useState, useEffect } from 'react'
import { reatomComponent } from '@reatom/react'
import {
  Modal,
  Stack,
  Text,
  Group,
  Button,
  Radio,
  Loader,
  Alert,
  ScrollArea,
} from '@mantine/core'
import { formatDate, formatTime } from '@shared/lib'
import type { Slot } from '@entities/slot'
import type { createRescheduleForm } from '../model/model'

/** Пропсы модального окна переноса бронирования */
interface RescheduleModalProps {
  rescheduleForm: ReturnType<typeof createRescheduleForm>
  currentSlot: Slot
}

/**
 * Модальное окно выбора нового слота для переноса бронирования.
 * Слоты сгруппированы по дням, выбор через Radio.
 */
export const RescheduleModal = reatomComponent(
  ({ rescheduleForm, currentSlot }: RescheduleModalProps) => {
    const { isOpen, availableSlots, form, retry } = rescheduleForm

    const [selectedDay, setSelectedDay] = useState<string | null>(null)

    const opened = isOpen()
    const slots: Slot[] = availableSlots.data() ?? []
    const isLoadingSlots = !availableSlots.ready()
    const slotsError = availableSlots.error()

    const selectedSlotId = form.fields.newSlotId()
    const isSubmitting = !form.submit.ready()
    const submitError = form.submit.error()

    const handleClose = () => {
      rescheduleForm.close()
    }

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      form.submit()
    }

    // Группируем слоты по локальной дате (YYYY-MM-DD) в часовом поясе пользователя.
    // Нельзя использовать split('T')[0] — это UTC-дата, а не локальная.
    const slotsByDay = slots.reduce<Record<string, Slot[]>>((acc, slot) => {
      const d = new Date(slot.startTime)
      const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      if (!acc[day]) acc[day] = []
      acc[day].push(slot)
      return acc
    }, {})

    const sortedDays = Object.keys(slotsByDay).sort()
    const sortedDaysKey = sortedDays.join(',')

    // Сбрасываем фильтр при закрытии модалки — submit закрывает через isOpen.set(false), минуя handleClose
    useEffect(() => {
      if (!opened) {
        setSelectedDay(null)
      }
    }, [opened])

    // Сбрасываем фильтр если выбранный день исчез из обновлённых слотов (после retry)
    useEffect(() => {
      const days = new Set(sortedDaysKey ? sortedDaysKey.split(',') : [])
      if (selectedDay !== null && !days.has(selectedDay)) {
        setSelectedDay(null)
      }
    }, [sortedDaysKey, selectedDay])

    // При активном фильтре показываем только выбранный день
    const visibleDays = selectedDay ? sortedDays.filter((d) => d === selectedDay) : sortedDays
    const selectedSlotData = selectedSlotId ? slots.find((s) => s.id === selectedSlotId) : null

    const handleDaySelect = (day: string) => {
      const newDay = selectedDay === day ? null : day
      setSelectedDay(newDay)
      // Сбрасываем выбранный слот если он не принадлежит новому дню
      if (newDay && selectedSlotId && !slotsByDay[newDay]?.some((s) => s.id === selectedSlotId)) {
        form.fields.newSlotId.set('')
      }
    }

    return (
      <Modal
        opened={opened}
        onClose={handleClose}
        title="Перенести встречу"
        centered
        size="md"
      >
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <Alert variant="light" color="blue" title="Текущее время встречи">
              {formatDate(currentSlot.startTime, 'dddd, D MMMM')} •{' '}
              {formatTime(currentSlot.startTime)} — {formatTime(currentSlot.endTime)}
            </Alert>

            {isLoadingSlots && (
              <Group justify="center" py="xl">
                <Loader size="sm" />
                <Text size="sm" c="dimmed">
                  Загрузка доступных слотов…
                </Text>
              </Group>
            )}

            {!isLoadingSlots && slotsError && (
              <Alert color="red" title="Ошибка загрузки">
                Не удалось загрузить доступные слоты.
                <Button
                  size="compact-sm"
                  variant="subtle"
                  color="red"
                  mt="xs"
                  onClick={retry}
                >
                  Повторить
                </Button>
              </Alert>
            )}

            {!isLoadingSlots && !slotsError && slots.length === 0 && (
              <Text c="dimmed" ta="center" py="xl">
                Нет доступных слотов в ближайшие 14 дней
              </Text>
            )}

            {!isLoadingSlots && !slotsError && slots.length > 0 && (
              <>
                <ScrollArea type="scroll" offsetScrollbars>
                  <Group gap="xs" wrap="nowrap" pb="xs">
                    {sortedDays.map((day) => (
                      <Button
                        key={day}
                        variant={selectedDay === day ? 'filled' : 'default'}
                        size="compact-sm"
                        onClick={() => handleDaySelect(day)}
                      >
                        {formatDate(day, 'D MMM')}
                      </Button>
                    ))}
                  </Group>
                </ScrollArea>

                <ScrollArea mah={360} offsetScrollbars>
                  <Radio.Group
                    value={selectedSlotId}
                    onChange={(value) => form.fields.newSlotId.set(value)}
                    name="newSlotId"
                  >
                    <Stack gap="sm">
                      {visibleDays.map((day) => (
                        <Stack key={day} gap="xs">
                          <Text fw={600} size="sm">
                            {formatDate(day, 'dddd, D MMMM')}
                          </Text>
                          {slotsByDay[day].map((slot) => (
                            <Radio
                              key={slot.id}
                              value={slot.id}
                              label={`${formatTime(slot.startTime)} — ${formatTime(slot.endTime)}`}
                            />
                          ))}
                        </Stack>
                      ))}
                    </Stack>
                  </Radio.Group>
                </ScrollArea>
              </>
            )}

            {selectedSlotData && (
              <Text size="sm" c="dimmed" ta="center">
                Вы выбрали: {formatDate(selectedSlotData.startTime, 'dddd, D MMMM')} •{' '}
                {formatTime(selectedSlotData.startTime)} — {formatTime(selectedSlotData.endTime)}
              </Text>
            )}

            {submitError && (
              <Text c="red" size="sm">
                {submitError.message}
              </Text>
            )}

            <Group justify="flex-end" wrap="nowrap">
              <Button variant="subtle" onClick={handleClose} disabled={isSubmitting}>
                Отмена
              </Button>
              <Button
                type="submit"
                loading={isSubmitting}
                loaderProps={{ type: 'dots' }}
                disabled={!selectedSlotId || isSubmitting}
                miw={160}
              >
                Перенести
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    )
  },
  'RescheduleModal'
)
