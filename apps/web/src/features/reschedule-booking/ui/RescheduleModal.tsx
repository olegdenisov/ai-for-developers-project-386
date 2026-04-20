import { useState, useEffect, useMemo } from 'react'
import { reatomComponent } from '@reatom/react'
import {
  Modal,
  Stack,
  Text,
  Group,
  Button,
  Loader,
  Alert,
  Box,
  SimpleGrid,
  Divider,
  Paper,
} from '@mantine/core'
import { IconArrowNarrowRight } from '@tabler/icons-react'
import { formatDate, formatTime } from '@shared/lib'
import type { Slot } from '@entities/slot'
import type { createRescheduleForm } from '../model/model'

/** Пропсы модального окна переноса бронирования */
interface RescheduleModalProps {
  rescheduleForm: ReturnType<typeof createRescheduleForm>
  currentSlot: Slot
}

// Нельзя использовать split('T')[0] — это UTC-дата, а не локальная дата пользователя.
function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function groupSlotsByDay(slots: Slot[]): Record<string, Slot[]> {
  return slots.reduce<Record<string, Slot[]>>((acc, slot) => {
    const day = toLocalDateStr(new Date(slot.startTime))
    if (!acc[day]) acc[day] = []
    acc[day].push(slot)
    return acc
  }, {})
}

const WEEKDAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

/**
 * Модальное окно переноса бронирования.
 * Шаг 1 — выбор дня в мини-календаре (14 дней, выровнено по дням недели).
 * Шаг 2 — выбор времени из доступных слотов выбранного дня.
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

    const slotsByDay = useMemo(() => groupSlotsByDay(slots), [slots])
    const selectedSlotData = selectedSlotId ? slots.find((s) => s.id === selectedSlotId) : null
    const visibleSlots = selectedDay ? (slotsByDay[selectedDay] ?? []) : []

    // Строим 14-дневную сетку с выравниванием по понедельнику.
    // today стабилизирован через useMemo([]), иначе new Date() !== new Date() → gridItems пересчитывался бы каждый рендер.
    const today = useMemo(() => new Date(), [])
    const months = new Set<string>()
    for (let i = 0; i < 14; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      months.add(formatDate(d, 'MMMM'))
    }
    const monthLabel = Array.from(months).join(' — ')

    const gridItems = useMemo(() => {
      const offset = (today.getDay() + 6) % 7
      const days: { dateStr: string; dayNum: number; hasSlots: boolean }[] = []
      for (let i = 0; i < 14; i++) {
        const d = new Date(today)
        d.setDate(today.getDate() + i)
        const dateStr = toLocalDateStr(d)
        days.push({ dateStr, dayNum: d.getDate(), hasSlots: !!slotsByDay[dateStr] })
      }
      return [...(Array(offset).fill(null) as null[]), ...days]
    }, [slotsByDay, today])

    // Сбрасываем выбор дня при закрытии модалки
    useEffect(() => {
      if (!opened) setSelectedDay(null)
    }, [opened])

    // Сбрасываем выбор дня если после retry он исчез из доступных
    useEffect(() => {
      if (selectedDay && !slotsByDay[selectedDay]) setSelectedDay(null)
    }, [slotsByDay, selectedDay])

    const handleDaySelect = (dateStr: string) => {
      setSelectedDay(dateStr)
      // Сбрасываем выбранный слот, если он не принадлежит новому дню
      if (selectedSlotId && !slotsByDay[dateStr]?.some((s) => s.id === selectedSlotId)) {
        form.fields.newSlotId.set('')
      }
    }

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      form.submit()
    }

    return (
      <Modal
        opened={opened}
        onClose={rescheduleForm.close}
        title="Перенести встречу"
        centered
        size="md"
      >
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            {/* Текущее время встречи */}
            <Group gap="xs">
              <Text size="sm" c="dimmed">Сейчас:</Text>
              <Text size="sm" fw={500}>
                {formatDate(currentSlot.startTime, 'D MMMM, dddd')} •{' '}
                {formatTime(currentSlot.startTime)} — {formatTime(currentSlot.endTime)}
              </Text>
            </Group>

            {isLoadingSlots && (
              <Group justify="center" py="xl">
                <Loader size="sm" />
                <Text size="sm" c="dimmed">Загрузка доступных слотов…</Text>
              </Group>
            )}

            {!isLoadingSlots && slotsError && (
              <Alert color="red" title="Ошибка загрузки">
                Не удалось загрузить доступные слоты.
                <Button size="compact-sm" variant="subtle" color="red" mt="xs" onClick={retry}>
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
                {/* Мини-календарь: выбор дня */}
                <Box>
                  <Text size="xs" c="dimmed" mb={6} tt="capitalize">{monthLabel}</Text>

                  {/* Заголовки дней недели */}
                  <SimpleGrid cols={7} spacing={4} mb={4}>
                    {WEEKDAY_LABELS.map((label) => (
                      <Text key={label} size="xs" ta="center" c="dimmed" fw={600}>{label}</Text>
                    ))}
                  </SimpleGrid>

                  {/* Сетка дней: пустые ячейки для выравнивания + дни */}
                  <SimpleGrid cols={7} spacing={4}>
                    {gridItems.map((item, idx) =>
                      item === null ? (
                        <Box key={`empty-${idx}`} />
                      ) : (
                        <Button
                          key={item.dateStr}
                          variant={
                            selectedDay === item.dateStr
                              ? 'filled'
                              : item.hasSlots
                                ? 'light'
                                : 'subtle'
                          }
                          disabled={!item.hasSlots}
                          onClick={() => handleDaySelect(item.dateStr)}
                          size="compact-md"
                          h={40}
                          w="100%"
                          p={4}
                          fw={selectedDay === item.dateStr ? 700 : 400}
                        >
                          {item.dayNum}
                        </Button>
                      )
                    )}
                  </SimpleGrid>
                </Box>

                {/* Выбор времени: появляется после выбора дня */}
                {selectedDay && (
                  <>
                    <Divider
                      label={formatDate(visibleSlots[0].startTime, 'dddd, D MMMM')}
                      labelPosition="left"
                    />
                    <SimpleGrid cols={3} spacing="xs">
                      {visibleSlots.map((slot) => (
                        <Button
                          key={slot.id}
                          variant={selectedSlotId === slot.id ? 'filled' : 'light'}
                          onClick={() => form.fields.newSlotId.set(slot.id)}
                          h="auto"
                          py={8}
                          style={{ whiteSpace: 'nowrap' }}
                        >
                          {formatTime(slot.startTime)} — {formatTime(slot.endTime)}
                        </Button>
                      ))}
                    </SimpleGrid>
                  </>
                )}
              </>
            )}

            {/* Итоговая карточка: было → станет */}
            {selectedSlotData && (
              <Paper withBorder p="sm" radius="md" bg="green.0">
                <Group justify="center" gap="md" wrap="nowrap">
                  <Stack gap={1} align="center">
                    <Text size="xs" c="dimmed">Было</Text>
                    <Text size="sm" fw={500}>
                      {formatDate(currentSlot.startTime, 'D MMM')} • {formatTime(currentSlot.startTime)}
                    </Text>
                  </Stack>
                  <IconArrowNarrowRight size={16} />
                  <Stack gap={1} align="center">
                    <Text size="xs" c="dimmed">Станет</Text>
                    <Text size="sm" fw={600} c="green.7">
                      {formatDate(selectedSlotData.startTime, 'D MMM')} • {formatTime(selectedSlotData.startTime)}
                    </Text>
                  </Stack>
                </Group>
              </Paper>
            )}

            {submitError && (
              <Text c="red" size="sm">{submitError.message}</Text>
            )}

            <Group justify="flex-end" wrap="nowrap">
              <Button variant="subtle" onClick={rescheduleForm.close} disabled={isSubmitting}>
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
