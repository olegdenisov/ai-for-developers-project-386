import { reatomComponent } from '@reatom/react';
import { wrap } from '@reatom/core';
import {
  Title,
  Text,
  Button,
  TextInput,
  Stack,
  Card,
  Textarea,
  Group,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { homeRoute } from '@pages/home/route';
import { submitBooking } from './route';
import { Layout, ErrorMessage } from '@shared/ui';
import { formatDateTime } from '@shared/lib';
import { bookingFormSchema, type BookingFormData } from '@features/create-booking';
import type { EventType } from '@entities/event-type';
import type { Slot } from '@entities/slot';
import type { Booking } from '@entities/booking';

// ============================================
// PROPS INTERFACE
// ============================================

interface BookingPageProps {
  eventType?: EventType;
  slot?: Slot;
  isLoading: boolean;
  error?: string | null;
}

// ============================================
// COMPONENT
// ============================================

export const BookingPage = reatomComponent(({ eventType, slot, isLoading, error }: BookingPageProps) => {
  // Form state using Mantine form
  const form = useForm<BookingFormData>({
    initialValues: {
      guestName: '',
      guestEmail: '',
      guestNotes: '',
    },
    validate: (values) => {
      const result = bookingFormSchema.safeParse(values);
      if (!result.success) {
        const errors: Record<string, string> = {};
        result.error.issues.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0].toString()] = err.message;
          }
        });
        return errors;
      }
      return {};
    },
  });

  // Track submission state
  const isSubmitting = submitBooking.pending();
  const submitError = submitBooking.error();
  const booking: Booking | null = submitBooking.data() || null;
  const isSuccess = submitBooking.ready() && booking != null;

  const handleSubmit = wrap(async (values: BookingFormData) => {
    try {
      await submitBooking(values);
    } catch (err) {
      // Error is handled by the action
    }
  });

  const handleBackHome = wrap(() => {
    homeRoute.go();
  });

  // Error state - no event type or slot
  if (error || !eventType || !slot) {
    return (
      <Layout>
        <ErrorMessage message={error || "Информация о бронировании не найдена. Пожалуйста, начните сначала."} />
        <Button onClick={handleBackHome} mt="md">На главную</Button>
      </Layout>
    );
  }

  // Success state - booking created
  if (isSuccess && booking) {
    return (
      <Layout>
        <Card withBorder padding="xl">
          <Title order={2} c="green" mb="md">
            Бронирование подтверждено!
          </Title>
          
          <Stack gap="sm" mb="lg">
            <Text>
              <strong>Тип встречи:</strong> {eventType.name}
            </Text>
            <Text>
              <strong>Дата и время:</strong> {formatDateTime(slot.startTime)}
            </Text>
            <Text>
              <strong>Ваше имя:</strong> {booking.guestName}
            </Text>
            <Text>
              <strong>Email:</strong> {booking.guestEmail}
            </Text>
          </Stack>

          <Button onClick={handleBackHome} variant="outline">
            На главную
          </Button>

          <Text c="dimmed" size="sm" mt="md">
            ID бронирования: {booking.id}
          </Text>
        </Card>
      </Layout>
    );
  }

  // Form state - ready to submit
  return (
    <Layout title="Подтверждение бронирования">
      <Card withBorder mb="lg">
        <Text fw={500} mb="xs">
          {eventType.name}
        </Text>
        <Text c="dimmed">
          {formatDateTime(slot.startTime)}
        </Text>
      </Card>

      {submitError && <ErrorMessage message={submitError.message} />}

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label="Ваше имя"
            placeholder="Иван Иванов"
            required
            {...form.getInputProps('guestName')}
          />

          <TextInput
            label="Email"
            placeholder="ivan@example.com"
            required
            type="email"
            {...form.getInputProps('guestEmail')}
          />

          <Textarea
            label="Заметки (опционально)"
            placeholder="Дополнительная информация..."
            rows={3}
            {...form.getInputProps('guestNotes')}
          />

          <Group justify="flex-end" mt="md">
            <Button
              type="submit"
              loading={isSubmitting}
              size="lg"
            >
              Подтвердить бронирование
            </Button>
          </Group>
        </Stack>
      </form>
    </Layout>
  );
}, 'BookingPage');
