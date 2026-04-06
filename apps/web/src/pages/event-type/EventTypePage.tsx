import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAtom } from '@reatom/jsx';
import { Container, Title, Text, Button, Stack, Group, Card, Radio } from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import { IconArrowLeft, IconClock } from '@mantine/icons';
import { selectedEventTypeAtom, fetchEventTypeById } from '@entities/event-type';
import { availableSlotsAtom, selectedSlotAtom, selectSlot } from '@entities/slot';
import { selectDate, selectedDateAtom, calendarLoadingAtom } from '@features/view-slots';
import { Layout, LoadingSpinner } from '@shared/ui';
import { formatDuration, formatTime } from '@shared/lib';

export function EventTypePage() {
  const { id } = useParams<{ id: string }>();
  const eventType = useAtom(selectedEventTypeAtom);
  const slots = useAtom(availableSlotsAtom);
  const selectedSlot = useAtom(selectedSlotAtom);
  const selectedDate = useAtom(selectedDateAtom);
  const isLoading = useAtom(calendarLoadingAtom);
  const isFetching = useAtom(fetchEventTypeById.pendingAtom);

  useEffect(() => {
    if (id) {
      fetchEventTypeById({}, id);
    }
  }, [id]);

  useEffect(() => {
    if (id && selectedDate) {
      selectDate({}, selectedDate, id);
    }
  }, [id, selectedDate]);

  const handleDateSelect = (date: Date | null) => {
    if (date && id) {
      selectDate({}, date, id);
    }
  };

  const handleSlotSelect = (slotId: string) => {
    const slot = slots.find((s) => s.id === slotId);
    if (slot) {
      selectSlot({}, slot);
    }
  };

  const handleContinue = () => {
    if (selectedSlot && id) {
      window.location.href = `/bookings/new?eventTypeId=${id}&slotId=${selectedSlot.id}`;
    }
  };

  if (isFetching || !eventType) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  // Filter slots for selected date
  const slotsForSelectedDate = selectedDate
    ? slots.filter((slot) => {
        const slotDate = new Date(slot.startTime);
        return (
          slotDate.getDate() === selectedDate.getDate() &&
          slotDate.getMonth() === selectedDate.getMonth() &&
          slotDate.getFullYear() === selectedDate.getFullYear()
        );
      })
    : [];

  return (
    <Layout>
      <Button
        variant="subtle"
        leftSection={<IconArrowLeft size={16} />}
        mb="md"
        onClick={() => (window.location.href = '/')}
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

        {isLoading ? (
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
                {slotsForSelectedDate.map((slot) => (
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
}
