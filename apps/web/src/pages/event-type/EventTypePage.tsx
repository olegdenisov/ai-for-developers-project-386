import { reatomComponent } from '@reatom/react';
import { atom, wrap } from '@reatom/core';
import { Title, Text, Button, Stack, Group, Card, Radio, Badge } from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import { IconArrowLeft, IconClock } from '@tabler/icons-react';
import { Layout, LoadingSpinner, ErrorMessage } from '@shared/ui';
import { formatTime } from '@shared/lib';
import { navigate } from '@app/router';
import { bookingEventTypeAtom, bookingSlotAtom } from '@pages/booking/route';
import { selectedDateForRoute, slotsForDate } from './route';
import type { EventType } from '@entities/event-type';
import type { Slot } from '@entities/slot';

// ============================================
// PROPS INTERFACE
// ============================================

interface EventTypePageProps {
  eventType?: EventType;
  isLoading: boolean;
  error?: string | null;
}

// ============================================
// UTILITIES
// ============================================

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} мин`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours} ч ${mins} мин` : `${hours} ч`;
}

function filterSlotsForDate(slots: Slot[], date: Date): Slot[] {
  return slots.filter((slot) => {
    const slotDate = new Date(slot.startTime);
    return (
      slotDate.getDate() === date.getDate() &&
      slotDate.getMonth() === date.getMonth() &&
      slotDate.getFullYear() === date.getFullYear()
    );
  });
}

// ============================================
// LOCAL STATE ATOM
// ============================================

const selectedSlotLocal = atom<Slot | null>(null, 'eventTypePage.selectedSlot');

// ============================================
// COMPONENT
// ============================================

export const EventTypePage = reatomComponent(({ eventType, isLoading, error }: EventTypePageProps) => {
  // Get route state
  const selectedDate = selectedDateForRoute();
  const slotsLoading = slotsForDate.pending();
  const slots = slotsForDate.data() || [];
  
  // Get selected slot from local atom
  const selectedSlot = selectedSlotLocal();

  const handleDateSelect = wrap((date: Date | null) => {
    if (date) {
      selectedDateForRoute.set(date);
    }
  });

  const handleSlotSelect = wrap((slotId: string) => {
    const slot = slots.find((s: Slot) => s.id === slotId);
    if (slot) {
      selectedSlotLocal.set(slot);
    }
  });

  const handleContinue = wrap(() => {
    if (selectedSlot && eventType) {
      // Сохраняем данные в atoms контекста бронирования
      bookingEventTypeAtom.set(eventType);
      bookingSlotAtom.set(selectedSlot);
      // Переходим на страницу бронирования
      navigate.booking();
    }
  });

  const handleBack = wrap(() => {
    navigate.home();
  });

  if (isLoading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <ErrorMessage message={error} />
        <Button onClick={handleBack} mt="md">На главную</Button>
      </Layout>
    );
  }

  if (!eventType) {
    return (
      <Layout>
        <ErrorMessage message="Тип события не найден" />
        <Button onClick={handleBack} mt="md">На главную</Button>
      </Layout>
    );
  }

  // Filter slots for selected date
  const slotsForSelectedDate = selectedDate
    ? filterSlotsForDate(slots, selectedDate)
    : [];

  return (
    <Layout>
      <Button
        variant="subtle"
        leftSection={<IconArrowLeft size={16} />}
        mb="md"
        onClick={handleBack}
      >
        Назад
      </Button>

      <Title order={2} mb="xs">
        {eventType.name}
      </Title>

      <Group gap="xs" mb="lg">
        <Text c="dimmed">Длительность:</Text>
        <Badge leftSection={<IconClock size={12} />}>
          {formatDuration(eventType.durationMinutes)}
        </Badge>
      </Group>

      {eventType.description && (
        <Text c="dimmed" mb="xl">
          {eventType.description}
        </Text>
      )}

      <Stack gap="lg">
        <Card withBorder>
          <Title order={4} mb="md">
            Выберите дату
          </Title>
          <DatePicker
            value={selectedDate}
            onChange={handleDateSelect}
            minDate={new Date()}
            firstDayOfWeek={1}
          />
        </Card>

        {slotsLoading ? (
          <LoadingSpinner />
        ) : selectedDate && slotsForSelectedDate.length > 0 ? (
          <Card withBorder>
            <Title order={4} mb="md">
              Доступное время
            </Title>
            <Radio.Group
              value={selectedSlot?.id}
              onChange={handleSlotSelect}
            >
              <Group>
                {slotsForSelectedDate.map((slot: Slot) => (
                  <Radio
                    key={slot.id}
                    value={slot.id}
                    label={formatTime(slot.startTime)}
                  />
                ))}
              </Group>
            </Radio.Group>
          </Card>
        ) : selectedDate ? (
          <Text c="dimmed">Нет доступного времени на выбранную дату</Text>
        ) : null}

        {selectedSlot && (
          <Button onClick={handleContinue} size="lg">
            Продолжить
          </Button>
        )}
      </Stack>
    </Layout>
  );
}, 'EventTypePage');
