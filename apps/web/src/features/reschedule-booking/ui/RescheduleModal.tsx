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

/** Форматирует дату в локализованную строку (например, «12 апреля 2026») */
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
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
      form.fields.newSlotId.set('')
      if (form.submit.errorAtom) {
        form.submit.errorAtom.set(null)
      }
    }

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      form.submit()
    }

    // Группируем слоты по дате (YYYY-MM-DD)
    const slotsByDay = slots.reduce<Record<string, Slot[]>>((acc: Record<string, Slot[]>, slot: Slot) => {
      const day = slot.startTime.split('T')[0]
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
