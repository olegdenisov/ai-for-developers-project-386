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
import type { Slot } from '@entities/slot'
import type { createRescheduleForm } from '../model/model'

/** Пропсы модального окна переноса бронирования */
interface RescheduleModalProps {
  rescheduleForm: ReturnType<typeof createRescheduleForm>
}

/** Форматирует локальную дату YYYY-MM-DD в локализованную строку (например, «12 апреля 2026») */
function formatDate(dateStr: string): string {
  // Парсим как локальную дату (не UTC), чтобы избежать смещения на -1 день в timezone UTC-
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** Форматирует время из ISO-строки (например, «14:30») */
function formatTime(isoStr: string): string {
  return new Date(isoStr).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Модальное окно выбора нового слота для переноса бронирования.
 * Слоты сгруппированы по дням, выбор через Radio.
 */
export const RescheduleModal = reatomComponent(
  ({ rescheduleForm }: RescheduleModalProps) => {
    const { isOpen, availableSlots, form } = rescheduleForm

    const opened = isOpen()
    const slots = availableSlots.data()
    const isLoadingSlots = !availableSlots.ready()
    const slotsError = availableSlots.error()

    const selectedSlotId = form.fields.newSlotId()
    const isSubmitting = !form.submit.ready()
    const submitError = form.submit.error()

    const handleClose = () => {
      isOpen.set(false)
      form.reset()
      // Сбрасываем ошибку сабмита напрямую — form.submit.reset() сбрасывает только data-атом,
      // но не error-атом, поэтому при повторном открытии модалки старая ошибка оставалась бы видна
      if ((form.submit as any).errorAtom) {
        ;(form.submit as any).errorAtom.set(null)
      }
    }

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      form.submit()
    }

    // Группируем слоты по локальной дате (YYYY-MM-DD) в часовом поясе пользователя.
    // Нельзя использовать split('T')[0] — это UTC-дата, а не локальная.
    const slotsByDay = slots.reduce<Record<string, Slot[]>>((acc: Record<string, Slot[]>, slot: Slot) => {
      const d = new Date(slot.startTime)
      const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      if (!acc[day]) acc[day] = []
      acc[day].push(slot)
      return acc
    }, {})

    const sortedDays = Object.keys(slotsByDay).sort()

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
                Не удалось загрузить доступные слоты. Попробуйте позже.
              </Alert>
            )}

            {!isLoadingSlots && !slotsError && slots.length === 0 && (
              <Text c="dimmed" ta="center" py="xl">
                Нет доступных слотов в ближайшие 14 дней
              </Text>
            )}

            {!isLoadingSlots && !slotsError && slots.length > 0 && (
              <ScrollArea mah={360} offsetScrollbars>
                <Radio.Group
                  value={selectedSlotId}
                  onChange={(value) => form.fields.newSlotId.set(value)}
                  name="newSlotId"
                >
                  <Stack gap="sm">
                    {sortedDays.map((day) => (
                      <Stack key={day} gap="xs">
                        <Text fw={600} size="sm">
                          {formatDate(day)}
                        </Text>
                        {slotsByDay[day].map((slot: Slot) => (
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
